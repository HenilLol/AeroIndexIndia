import { createHash } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { anomalyRecords, auditLogs, carriers, dataSources, fareObservations, indexSnapshots, routes } from "../../drizzle/schema";
import type { User } from "../../drizzle/schema";
import { assessFareAnomaly, buildTrendSummary, calculateConfidence, calculateCpiCompatibility, calculateJevonsIndex, calculateVolatility, median } from "./calculations";
import type { NormalizedFareObservationInput } from "./contracts";
import { getActiveSources, getAnomalyRows, getCarrierRows, getFares, getIndexSnapshots, getRouteReference, listRouteReferences, requireDb, toNumber } from "./repository";
import { getPublicDataMode } from "./provider-status";

const DAY_MS = 86_400_000;
const MAX_ROUTE_FARES_FOR_ANALYSIS = 2_000;
const domainError = (code: "NOT_FOUND" | "BAD_REQUEST" | "CONFLICT" | "PRECONDITION_FAILED", message: string): never => {
  throw new TRPCError({ code, message });
};
const dayStart = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
const dateToken = (date: Date) => dayStart(date).toISOString().slice(0, 10);
const asFareNumber = (value: number | string | null | undefined) => toNumber(value) ?? 0;

function hash(parts: Array<string | number | Date | undefined>) {
  return createHash("sha256").update(parts.map(value => value instanceof Date ? value.toISOString() : String(value ?? "")).join("|")).digest("hex");
}

function canonicalIdempotencyKey(input: NormalizedFareObservationInput) {
  return hash([input.sourceId, input.routeId, input.carrierId, input.flightNumber, dateToken(input.travelDate), input.passengerCount, input.cabinClass, input.totalFare, Math.floor(input.observationAt.getTime() / 300_000)]);
}

function isDuplicateKeyError(error: unknown) {
  if (typeof error !== "object" || error === null) return false;
  const code = (error as { code?: string }).code;
  return code === "23505" || code === "ER_DUP_ENTRY" || String(code) === "1062";
}

export async function getMarketStatus() {
  return {
    service: "AeroIndex India Market Intelligence API",
    version: "v1",
    publicReads: true,
    operationsRequireAdmin: true,
    methodology: "Route-level Jevons indices with transparent rule and robust statistical anomaly flags.",
    dataMode: getPublicDataMode(),
  };
}

export async function listRoutes(input: Parameters<typeof listRouteReferences>[0]) {
  const result = await listRouteReferences(input);
  return {
    ...result,
    items: result.items.map(view => ({
      id: view.route.id,
      origin: { id: view.origin.id, iataCode: view.origin.iataCode, name: view.origin.name, city: view.originCity?.name ?? null },
      destination: { id: view.destination.id, iataCode: view.destination.iataCode, name: view.destination.name, city: view.destinationCity?.name ?? null },
      distanceKm: toNumber(view.route.distanceKm),
    })),
  };
}

export async function getRouteDetail(routeId: number) {
  const reference = await getRouteReference(routeId);
  if (!reference) domainError("NOT_FOUND", `Route #${routeId} was not found.`);
  const ref = reference!;
  const fares = await getFares({ routeId, limit: MAX_ROUTE_FARES_FOR_ANALYSIS });
  const fareNumbers = fares.items.map(fare => asFareNumber(fare.normalizedFareInr));
  const activeFares = fares.items.filter(fare => fare.normalizedFareInr > 0);
  const trend = buildTrendSummary(activeFares.map(fare => ({ timestamp: fare.observationAt, fare: asFareNumber(fare.normalizedFareInr) })));
  const latestFare = activeFares[0]?.normalizedFareInr ?? null;
  const anomalyCount = fares.items.filter(fare => fare.isAnomaly).length;

  return {
    id: ref.route.id,
    origin: { iataCode: ref.origin.iataCode, name: ref.origin.name, city: ref.originCity?.name ?? null },
    destination: { iataCode: ref.destination.iataCode, name: ref.destination.name, city: ref.destinationCity?.name ?? null },
    distanceKm: toNumber(ref.route.distanceKm),
    observationCount: fares.items.length,
    latestFare,
    trendPercent: trend.percentChange,
    volatilityPercent: calculateVolatility(fareNumbers),
    anomalyCount,
  };
}

export async function getRouteAnalytics(routeId: number) {
  const detail = await getRouteDetail(routeId);
  const [fares, indexSeries, carriersList] = await Promise.all([
    getFares({ routeId, limit: 300 }),
    getIndexSnapshots({ routeId, limit: 90 }),
    getCarrierRows(),
  ]);
  const carrierMap = new Map(carriersList.map(carrier => [carrier.id, carrier]));
  const bookingWindows = [
    { window: "0-7 days", count: 0, sum: 0 },
    { window: "8-14 days", count: 0, sum: 0 },
    { window: "15-30 days", count: 0, sum: 0 },
    { window: "31+ days", count: 0, sum: 0 },
  ];

  for (const fare of fares.items) {
    const fareVal = asFareNumber(fare.normalizedFareInr);
    if (fare.bookingWindowDays <= 7) { bookingWindows[0].count++; bookingWindows[0].sum += fareVal; }
    else if (fare.bookingWindowDays <= 14) { bookingWindows[1].count++; bookingWindows[1].sum += fareVal; }
    else if (fare.bookingWindowDays <= 30) { bookingWindows[2].count++; bookingWindows[2].sum += fareVal; }
    else { bookingWindows[3].count++; bookingWindows[3].sum += fareVal; }
  }

  const byCarrier = new Map<number, { carrierId: number; name: string; iataCode: string; fares: number[] }>();
  for (const fare of fares.items) {
    const carrier = carrierMap.get(fare.carrierId);
    if (!carrier) continue;
    const existing = byCarrier.get(carrier.id) ?? { carrierId: carrier.id, name: carrier.name, iataCode: carrier.iataCode, fares: [] };
    existing.fares.push(asFareNumber(fare.normalizedFareInr));
    byCarrier.set(carrier.id, existing);
  }

  return {
    route: detail,
    averageFare: detail.latestFare ?? 0,
    minimumFare: detail.latestFare ?? 0,
    volatilityPercent: detail.volatilityPercent,
    trend: { percentChange: detail.trendPercent },
    trendPercent: detail.trendPercent,
    observationCount: detail.observationCount,
    indexHistory: indexSeries.map(item => ({ id: item.id, routeId: item.routeId, asOfDate: item.asOfDate, indexValue: asFareNumber(item.indexValue), percentChange: toNumber(item.percentChange), confidenceScore: asFareNumber(item.confidenceScore) })),
    bookingWindowAnalysis: bookingWindows.map(item => ({ window: item.window, averageFare: item.count ? Math.round(item.sum / item.count) : 0, observationCount: item.count })),
    carrierComparison: Array.from(byCarrier.values()).map(item => {
      const averageFare = item.fares.length ? Math.round(item.fares.reduce((a, b) => a + b, 0) / item.fares.length) : 0;
      const lowestFare = item.fares.length ? Math.min(...item.fares) : 0;
      const highestFare = item.fares.length ? Math.max(...item.fares) : 0;
      return {
        carrierId: item.carrierId,
        name: item.name,
        carrierName: item.name,
        iataCode: item.iataCode,
        observationCount: item.fares.length,
        averageFare,
        lowestFare,
        highestFare,
        minimumFare: lowestFare,
        maximumFare: highestFare,
        volatilityPercent: calculateVolatility(item.fares),
        trend: { percentChange: 0 },
      };
    }),
  };
}

export async function getDashboardOverview() {
  const [nationalIndices, fares, alerts] = await Promise.all([
    getIndexSnapshots({ limit: 1 }),
    getFares({ limit: 200 }),
    getAnomalyRows(10),
  ]);
  const latestNational = nationalIndices[0] ?? null;
  const fareValues = fares.items.map(fare => asFareNumber(fare.normalizedFareInr));
  const recentAverageFare = fareValues.length ? Math.round(fareValues.reduce((a, b) => a + b, 0) / fareValues.length) : null;
  const recentVolatilityPercent = calculateVolatility(fareValues);
  const openAlerts = alerts.filter(alert => alert.reviewStatus === "pending").length;

  return {
    dataMode: getPublicDataMode(),
    latestNationalIndex: latestNational ? { value: asFareNumber(latestNational.indexValue), asOfDate: latestNational.asOfDate, changePercent: toNumber(latestNational.percentChange) ?? 0, confidence: asFareNumber(latestNational.confidenceScore) } : null,
    marketSnapshot: { recentObservationCount: fares.items.length, recentAverageFare, recentVolatilityPercent, openAlerts },
    alerts: alerts.map(alert => ({ id: alert.id, severity: alert.severity, score: asFareNumber(alert.anomalyScore), explanation: alert.explanation, createdAt: alert.createdAt })),
  };
}

export async function getCarrierComparison(routeId?: number) {
  const [fares, carriersList] = await Promise.all([
    getFares({ routeId, limit: 500 }),
    getCarrierRows(),
  ]);
  const carrierMap = new Map(carriersList.map(carrier => [carrier.id, carrier]));
  const grouped = new Map<number, number[]>();
  for (const fare of fares.items) {
    grouped.set(fare.carrierId, [...(grouped.get(fare.carrierId) ?? []), asFareNumber(fare.normalizedFareInr)]);
  }

  return carriersList.map(carrier => {
    const faresForCarrier = grouped.get(carrier.id) ?? [];
    const averageFare = faresForCarrier.length ? Math.round(faresForCarrier.reduce((a, b) => a + b, 0) / faresForCarrier.length) : 0;
    const lowestFare = faresForCarrier.length ? Math.min(...faresForCarrier) : 0;
    const highestFare = faresForCarrier.length ? Math.max(...faresForCarrier) : 0;
    return {
      carrierId: carrier.id,
      name: carrier.name,
      carrierName: carrier.name,
      iataCode: carrier.iataCode,
      observationCount: faresForCarrier.length,
      averageFare,
      lowestFare,
      highestFare,
      minimumFare: lowestFare,
      maximumFare: highestFare,
      volatilityPercent: calculateVolatility(faresForCarrier),
      trend: { percentChange: 0 },
    };
  }).sort((a, b) => a.averageFare - b.averageFare);
}

export async function getAlertData(limit: number) {
  const alerts = await getAnomalyRows(limit);
  return alerts.map(alert => ({ id: alert.id, fareObservationId: alert.fareObservationId, severity: alert.severity, reviewStatus: alert.reviewStatus, anomalyScore: asFareNumber(alert.anomalyScore), baselineMedian: toNumber(alert.baselineMedian), percentDifference: toNumber(alert.percentDifference), detectionMethods: alert.detectionMethods, explanation: alert.explanation, createdAt: alert.createdAt, reviewedAt: alert.reviewedAt }));
}

export async function getIndexHistory(routeId?: number, limit = 90) {
  const snapshots = await getIndexSnapshots({ routeId, limit });
  return snapshots.map(item => ({
    id: item.id,
    routeId: item.routeId,
    asOfDate: item.asOfDate,
    indexValue: asFareNumber(item.indexValue),
    percentChange: toNumber(item.percentChange) ?? 0,
    confidenceScore: asFareNumber(item.confidenceScore),
  }));
}

export async function listFareHistory(input: Parameters<typeof getFares>[0]) {
  const fares = await getFares(input);
  return {
    ...fares,
    items: fares.items.map(fare => ({
      id: fare.id,
      routeId: fare.routeId,
      carrierId: fare.carrierId,
      observationAt: fare.observationAt,
      travelDate: fare.travelDate,
      normalizedFareInr: asFareNumber(fare.normalizedFareInr),
      cpiCompatibilityScore: asFareNumber(fare.cpiCompatibilityScore),
      isAnomaly: fare.isAnomaly,
      anomalyScore: asFareNumber(fare.anomalyScore),
    })),
  };
}

export async function upsertSource(input: { slug: string; displayName: string; kind: "airline" | "ota" | "api" | "manual"; reliabilityScore: number; isActive: boolean }, actor: User) {
  const db = await requireDb();
  await db.insert(dataSources).values(input).onConflictDoUpdate({ target: dataSources.slug, set: { displayName: input.displayName, kind: input.kind, reliabilityScore: input.reliabilityScore, isActive: input.isActive } });
  const source = (await db.select().from(dataSources).where(eq(dataSources.slug, input.slug)).limit(1))[0];
  await recordAudit(actor.id, "source.upserted", "dataSource", String(source?.id ?? input.slug), { slug: input.slug });
  return source;
}

export async function importNormalizedFareObservation(input: NormalizedFareObservationInput, actor: User) {
  const db = await requireDb();
  const [route, carrier, source] = await Promise.all([
    db.select().from(routes).where(eq(routes.id, input.routeId)).limit(1),
    db.select().from(carriers).where(eq(carriers.id, input.carrierId)).limit(1),
    db.select().from(dataSources).where(eq(dataSources.id, input.sourceId)).limit(1),
  ]);
  const routeRecord = route[0];
  const carrierRecord = carrier[0];
  const sourceRecord = source[0];
  if (!routeRecord || !carrierRecord || !sourceRecord) domainError("NOT_FOUND", "The route, carrier, or source referenced by this observation was not found.");
  if (!routeRecord.isActive || !carrierRecord.isActive || !sourceRecord.isActive) domainError("PRECONDITION_FAILED", "Inactive routes, carriers, or sources cannot receive fare observations.");
  if (routeRecord.originAirportId === routeRecord.destinationAirportId) domainError("BAD_REQUEST", "A route cannot use the same airport for origin and destination.");

  const reference = await getRouteReference(input.routeId);
  if (!reference?.originCity || !reference.destinationCity) domainError("PRECONDITION_FAILED", "Route geography could not be resolved for the observation.");
  const resolvedReference = reference!;
  const idempotencyKey = input.idempotencyKey ?? canonicalIdempotencyKey(input);
  const existing = (await db.select().from(fareObservations).where(eq(fareObservations.idempotencyKey, idempotencyKey)).limit(1))[0];
  if (existing) return { created: false, idempotent: true, observation: existing };

  const historicalRows = await db.select({ normalizedFareInr: fareObservations.normalizedFareInr }).from(fareObservations).where(and(eq(fareObservations.routeId, input.routeId), eq(fareObservations.validationStatus, "valid"))).orderBy(desc(fareObservations.observationAt)).limit(365);
  const historicalFares = historicalRows.map(row => asFareNumber(row.normalizedFareInr));
  const fingerprint = hash([input.sourceId, input.routeId, input.carrierId, input.flightNumber, dateToken(input.travelDate), input.passengerCount, input.cabinClass, input.totalFare]);
  const nearDuplicate = (await db.select({ id: fareObservations.id }).from(fareObservations).where(eq(fareObservations.observationFingerprint, fingerprint)).limit(1))[0];
  const bookingWindowDays = Math.round((dayStart(input.travelDate).getTime() - dayStart(input.bookingDate).getTime()) / DAY_MS);
  const cpi = calculateCpiCompatibility({ routeActive: routeRecord.isActive, bookingWindowDays, passengerCount: input.passengerCount, sourceReliabilityScore: asFareNumber(sourceRecord.reliabilityScore), isDuplicate: Boolean(nearDuplicate), hasFlightTiming: Boolean(input.departureAt && input.arrivalAt), hasFlightNumber: Boolean(input.flightNumber) });
  const anomaly = assessFareAnomaly(input.normalizedFareInr, historicalFares);
  const observationValues = {
    idempotencyKey,
    observationFingerprint: fingerprint,
    routeId: input.routeId,
    originCityId: resolvedReference.originCity!.id,
    destinationCityId: resolvedReference.destinationCity!.id,
    originAirportId: resolvedReference.origin.id,
    destinationAirportId: resolvedReference.destination.id,
    carrierId: input.carrierId,
    flightId: input.flightId,
    flightNumber: input.flightNumber,
    sourceId: input.sourceId,
    observationAt: input.observationAt,
    bookingDate: input.bookingDate,
    travelDate: input.travelDate,
    departureAt: input.departureAt,
    arrivalAt: input.arrivalAt,
    flightDurationMinutes: input.flightDurationMinutes,
    passengerCount: input.passengerCount,
    cabinClass: input.cabinClass,
    currency: input.currency,
    baseFare: input.baseFare,
    taxes: input.taxes,
    fees: input.fees,
    totalFare: input.totalFare,
    normalizedFareInr: input.normalizedFareInr,
    bookingWindowDays,
    cpiCompatibilityScore: cpi.total,
    cpiScoreVersion: "v1",
    cpiScoreBreakdown: cpi,
    validationStatus: nearDuplicate ? "flagged" as const : "valid" as const,
    isDuplicate: Boolean(nearDuplicate),
    duplicateOfId: nearDuplicate?.id,
    isAnomaly: anomaly.isAnomaly,
    anomalyScore: anomaly.anomalyScore,
  };
  try {
    return await db.transaction(async tx => {
      const concurrentExisting = (await tx.select().from(fareObservations).where(eq(fareObservations.idempotencyKey, idempotencyKey)).limit(1))[0];
      if (concurrentExisting) return { created: false, idempotent: true, observation: concurrentExisting };
      const result = await tx.insert(fareObservations).values(observationValues).returning({ id: fareObservations.id });
      const insertedId = result[0].id;
      const observation = (await tx.select().from(fareObservations).where(eq(fareObservations.id, insertedId)).limit(1))[0]!;
      if (anomaly.isAnomaly) {
        await tx.insert(anomalyRecords).values({
          fareObservationId: insertedId,
          severity: anomaly.severity,
          anomalyScore: anomaly.anomalyScore,
          ruleScore: anomaly.ruleScore,
          statisticalScore: anomaly.statisticalScore,
          baselineMedian: anomaly.baselineMedian,
          percentDifference: anomaly.percentDifference,
          detectionMethods: anomaly.detectionMethods,
          explanation: anomaly.explanation
        });
      }
      await tx.update(dataSources).set({ lastIngestedAt: new Date() }).where(eq(dataSources.id, input.sourceId));
      await tx.insert(auditLogs).values({ actorUserId: actor.id > 0 ? actor.id : undefined, action: "fare.imported", entityType: "fareObservation", entityId: String(insertedId), metadata: { sourceId: input.sourceId, routeId: input.routeId, idempotencyKey, isAnomaly: anomaly.isAnomaly } });
      return { created: true, idempotent: false, observation };
    });
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    const duplicate = (await db.select().from(fareObservations).where(eq(fareObservations.idempotencyKey, idempotencyKey)).limit(1))[0];
    if (duplicate) return { created: false, idempotent: true, observation: duplicate };
    throw error;
  }
}

export async function recomputeRouteIndex(input: { routeId: number; baselineDate: Date; asOfDate: Date }, actor: User) {
  const db = await requireDb();
  await getRouteDetail(input.routeId);
  const relevant = await db.select().from(fareObservations).where(and(eq(fareObservations.routeId, input.routeId), eq(fareObservations.validationStatus, "valid"), inArray(fareObservations.travelDate, [input.baselineDate, input.asOfDate]))).limit(MAX_ROUTE_FARES_FOR_ANALYSIS);
  const byDateAndCarrier = new Map<string, number[]>();
  for (const fare of relevant) {
    const key = `${dateToken(fare.travelDate)}:${fare.carrierId}`;
    byDateAndCarrier.set(key, [...(byDateAndCarrier.get(key) ?? []), asFareNumber(fare.normalizedFareInr)]);
  }
  const carrierIds = Array.from(new Set(relevant.map(fare => fare.carrierId)));
  const pairs = carrierIds.flatMap(carrierId => {
    const base = median(byDateAndCarrier.get(`${dateToken(input.baselineDate)}:${carrierId}`) ?? []);
    const current = median(byDateAndCarrier.get(`${dateToken(input.asOfDate)}:${carrierId}`) ?? []);
    return base && current ? [{ baseFare: base, currentFare: current }] : [];
  });
  const calculation = calculateJevonsIndex(pairs);
  if (calculation.indexValue === null) domainError("PRECONDITION_FAILED", "At least one carrier needs valid baseline and current fare observations to calculate an index.");
  const indexValue = calculation.indexValue!;
  const volatility = calculateVolatility(relevant.map(fare => asFareNumber(fare.normalizedFareInr)));
  const confidence = calculateConfidence(calculation.matchedItems, volatility);
  const key = `route:${input.routeId}:base:${dateToken(input.baselineDate)}:asof:${dateToken(input.asOfDate)}:jevons-v1`;
  const prior = (await db.select().from(indexSnapshots).where(and(eq(indexSnapshots.scope, "route"), eq(indexSnapshots.routeId, input.routeId))).orderBy(desc(indexSnapshots.asOfDate)).limit(1))[0];
  const percentChange = prior ? ((indexValue - asFareNumber(prior.indexValue)) / asFareNumber(prior.indexValue)) * 100 : null;
  const priorIndexVal = prior ? asFareNumber(prior.indexValue) : null;

  await db.insert(indexSnapshots).values({
    calculationKey: key,
    scope: "route",
    routeId: input.routeId,
    baselineDate: input.baselineDate,
    asOfDate: input.asOfDate,
    indexValue,
    priorIndexValue: priorIndexVal,
    percentChange,
    observationCount: calculation.matchedItems,
    confidenceScore: confidence,
    calculationVersion: "jevons-v1",
    methodology: "Matched-carrier Jevons geometric mean"
  }).onConflictDoUpdate({
    target: indexSnapshots.calculationKey,
    set: { indexValue, priorIndexValue: priorIndexVal, percentChange, observationCount: calculation.matchedItems, confidenceScore: confidence, updatedAt: new Date() }
  });
  const snapshot = (await db.select().from(indexSnapshots).where(eq(indexSnapshots.calculationKey, key)).limit(1))[0]!;
  await recordAudit(actor.id, "index.recomputed", "indexSnapshot", String(snapshot.id), { routeId: input.routeId, baselineDate: dateToken(input.baselineDate), asOfDate: dateToken(input.asOfDate) });
  return snapshot;
}

export async function recomputeNationalIndex(asOfDate: Date, baselineDate: Date, actor: User) {
  const db = await requireDb();
  if (asOfDate < baselineDate) domainError("BAD_REQUEST", "The national index as-of date must be on or after its baseline date.");
  const routeIndices = await db.select().from(indexSnapshots).where(and(eq(indexSnapshots.scope, "route"), eq(indexSnapshots.asOfDate, asOfDate))).limit(500);
  if (!routeIndices.length) domainError("PRECONDITION_FAILED", "No route index snapshots exist for this date; calculate route indices first.");
  const totalWeight = routeIndices.reduce((sum, row) => sum + row.observationCount, 0);
  const weightedLog = routeIndices.reduce((sum, row) => sum + (row.observationCount / totalWeight) * Math.log(asFareNumber(row.indexValue) / 100), 0);
  const indexValue = Number((Math.exp(weightedLog) * 100).toFixed(4));
  const confidence = Math.round(routeIndices.reduce((sum, row) => sum + (row.observationCount / totalWeight) * asFareNumber(row.confidenceScore), 0));
  const key = `national:base:${dateToken(baselineDate)}:asof:${dateToken(asOfDate)}:tornqvist-v1`;
  await db.insert(indexSnapshots).values({
    calculationKey: key,
    scope: "national",
    baselineDate,
    asOfDate,
    indexValue,
    observationCount: totalWeight,
    confidenceScore: confidence,
    calculationVersion: "tornqvist-v1",
    methodology: "Observation-weighted Törnqvist-style aggregation",
    weights: Object.fromEntries(routeIndices.map(row => [String(row.routeId), Number((row.observationCount / totalWeight).toFixed(6))]))
  }).onConflictDoUpdate({
    target: indexSnapshots.calculationKey,
    set: { indexValue, observationCount: totalWeight, confidenceScore: confidence, updatedAt: new Date() }
  });
  const snapshot = (await db.select().from(indexSnapshots).where(eq(indexSnapshots.calculationKey, key)).limit(1))[0]!;
  await recordAudit(actor.id, "national_index.recomputed", "indexSnapshot", String(snapshot.id), { baselineDate: dateToken(baselineDate), asOfDate: dateToken(asOfDate) });
  return snapshot;
}

export async function reviewAnomaly(input: { anomalyId: number; reviewStatus: "pending" | "confirmed" | "false_positive" | "resolved" }, actor: User) {
  const db = await requireDb();
  const existing = (await db.select().from(anomalyRecords).where(eq(anomalyRecords.id, input.anomalyId)).limit(1))[0];
  if (!existing) domainError("NOT_FOUND", "Anomaly record not found.");
  await db.update(anomalyRecords).set({ reviewStatus: input.reviewStatus, reviewedByUserId: actor.id, reviewedAt: new Date() }).where(eq(anomalyRecords.id, input.anomalyId));
  await recordAudit(actor.id, "anomaly.reviewed", "anomalyRecord", String(input.anomalyId), { reviewStatus: input.reviewStatus });
  return (await db.select().from(anomalyRecords).where(eq(anomalyRecords.id, input.anomalyId)).limit(1))[0]!;
}

function recordAudit(actorUserId: number, action: string, entityType: string, entityId: string, metadata: Record<string, unknown>) {
  return requireDb().then(db => db.insert(auditLogs).values({
    actorUserId: actorUserId > 0 ? actorUserId : undefined,
    action,
    entityType,
    entityId,
    metadata,
  }));
}
