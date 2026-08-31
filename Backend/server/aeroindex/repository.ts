import { and, desc, eq, gte, inArray, isNull, lte, lt } from "drizzle-orm";
import { getDb } from "../db";
import { airports, anomalyRecords, carriers, cities, dataSources, fareObservations, indexSnapshots, routes } from "../../drizzle/schema";

export async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("The AeroIndex database is unavailable. Configure DATABASE_URL and apply migrations before using market data APIs.");
  return db;
}

export function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function getRouteReference(routeId: number) {
  const db = await requireDb();
  const route = (await db.select().from(routes).where(eq(routes.id, routeId)).limit(1))[0];
  if (!route) return null;
  const airportRows = await db.select().from(airports).where(inArray(airports.id, [route.originAirportId, route.destinationAirportId]));
  const airportMap = new Map(airportRows.map(airport => [airport.id, airport]));
  const origin = airportMap.get(route.originAirportId);
  const destination = airportMap.get(route.destinationAirportId);
  if (!origin || !destination) return null;
  const cityRows = await db.select().from(cities).where(inArray(cities.id, [origin.cityId, destination.cityId]));
  const cityMap = new Map(cityRows.map(city => [city.id, city]));
  return { route, origin, destination, originCity: cityMap.get(origin.cityId) ?? null, destinationCity: cityMap.get(destination.cityId) ?? null };
}

export async function listRouteReferences(input: { query?: string; originIata?: string; destinationIata?: string; cursor?: number; limit: number }) {
  const db = await requireDb();
  const routeRows = await db.select().from(routes).where(and(eq(routes.isActive, true), input.cursor ? lt(routes.id, input.cursor) : undefined)).orderBy(desc(routes.id)).limit(500);
  const routeViews = await Promise.all(routeRows.map(row => getRouteReference(row.id)));
  const query = input.query?.toUpperCase();
  const filtered = routeViews.filter((view): view is NonNullable<typeof view> => Boolean(view)).filter(view => {
    const routeText = `${view.origin.iataCode} ${view.destination.iataCode} ${view.origin.name} ${view.destination.name} ${view.originCity?.name ?? ""} ${view.destinationCity?.name ?? ""}`.toUpperCase();
    return (!query || routeText.includes(query)) && (!input.originIata || view.origin.iataCode === input.originIata) && (!input.destinationIata || view.destination.iataCode === input.destinationIata);
  });
  const hasNextPage = filtered.length > input.limit;
  const items = filtered.slice(0, input.limit);
  return { items, nextCursor: hasNextPage ? items[items.length - 1]?.route.id ?? null : null };
}

export async function getFares(input: { routeId?: number; carrierId?: number; travelDate?: Date; minimumFare?: number; maximumFare?: number; anomaliesOnly?: boolean; cursor?: number; limit: number }) {
  const db = await requireDb();
  const conditions = [
    eq(fareObservations.validationStatus, "valid"),
    input.routeId ? eq(fareObservations.routeId, input.routeId) : undefined,
    input.carrierId ? eq(fareObservations.carrierId, input.carrierId) : undefined,
    input.travelDate ? eq(fareObservations.travelDate, input.travelDate) : undefined,
    input.minimumFare ? gte(fareObservations.normalizedFareInr, input.minimumFare) : undefined,
    input.maximumFare ? lte(fareObservations.normalizedFareInr, input.maximumFare) : undefined,
    input.anomaliesOnly ? eq(fareObservations.isAnomaly, true) : undefined,
    input.cursor ? lt(fareObservations.id, input.cursor) : undefined,
  ];
  const rows = await db.select().from(fareObservations).where(and(...conditions)).orderBy(desc(fareObservations.id)).limit(input.limit + 1);
  const items = rows.slice(0, input.limit);
  return { items, nextCursor: rows.length > input.limit ? items[items.length - 1]?.id ?? null : null };
}

export async function getIndexSnapshots(input: { routeId?: number; limit: number }) {
  const db = await requireDb();
  const condition = input.routeId ? eq(indexSnapshots.routeId, input.routeId) : and(eq(indexSnapshots.scope, "national"), isNull(indexSnapshots.routeId));
  return db.select().from(indexSnapshots).where(condition).orderBy(desc(indexSnapshots.asOfDate)).limit(input.limit);
}

export async function getActiveSources() {
  const db = await requireDb();
  return db.select().from(dataSources).where(eq(dataSources.isActive, true)).orderBy(dataSources.displayName);
}

export async function getAnomalyRows(limit: number) {
  const db = await requireDb();
  return db.select().from(anomalyRecords).orderBy(desc(anomalyRecords.createdAt)).limit(limit);
}

export async function getCarrierRows() {
  const db = await requireDb();
  return db.select().from(carriers).where(eq(carriers.isActive, true)).orderBy(carriers.name);
}
