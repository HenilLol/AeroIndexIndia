import { TRPCError } from "@trpc/server";
import { carriers, dataSources } from "../../drizzle/schema";
import type { User } from "../../drizzle/schema";
import type { SkyscannerLiveSearchInput } from "./contracts";
import { getRouteDetail, importNormalizedFareObservation } from "./services";
import { requireDb } from "./repository";
import { eq } from "drizzle-orm";
import { getPublicDataMode, recordLiveProviderFailure, recordLiveProviderSuccess } from "./provider-status";

const SKYSCANNER_SEARCH_URL = "https://partners.api.skyscanner.net/apiservices/v3/flights/live/search/create";
const SKYSCANNER_LIVE_ENABLED = () => process.env.SKYSCANNER_LIVE_INGEST_ENABLED === "true";

type SkyscannerPrice = { amount?: string | number };
type SkyscannerPricingOption = { id?: string; price?: SkyscannerPrice };
type SkyscannerItinerary = { pricingOptions?: SkyscannerPricingOption[] };
type SkyscannerResponse = { sessionToken?: string; status?: string; content?: { results?: { itineraries?: Record<string, SkyscannerItinerary> } } };

function toDatePart(date: Date) {
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

function candidatePrices(response: SkyscannerResponse) {
  const itineraries = response.content?.results?.itineraries ?? {};
  return Object.entries(itineraries).flatMap(([itineraryId, itinerary]) => (itinerary.pricingOptions ?? []).flatMap(option => {
    const amount = Number(option.price?.amount);
    return Number.isFinite(amount) && amount > 0 ? [{ itineraryId, pricingOptionId: option.id ?? "unknown", totalFareInr: amount }] : [];
  })).sort((a, b) => a.totalFareInr - b.totalFareInr);
}

function statusCodeError(response: Response): never {
  recordLiveProviderFailure(`Skyscanner gateway returned HTTP ${response.status}`);
  if (response.status === 401) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Skyscanner rejected the configured credential. Live ingestion remains inactive." });
  if (response.status === 403) throw new TRPCError({ code: "FORBIDDEN", message: "The Skyscanner partner account is not authorised for this live-pricing resource." });
  if (response.status === 429) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Skyscanner rate limit reached. Try again later." });
  throw new TRPCError({ code: "BAD_GATEWAY", message: `Skyscanner search failed with HTTP ${response.status}.` });
}

export function getSkyscannerAdapterStatus() {
  const hasCredential = Boolean(process.env.SKYSCANNER_API_KEY);
  return {
    provider: "Skyscanner Flights Live Prices",
    endpoint: SKYSCANNER_SEARCH_URL,
    configured: hasCredential,
    enabled: hasCredential && SKYSCANNER_LIVE_ENABLED(),
    state: hasCredential && SKYSCANNER_LIVE_ENABLED() ? "ready" as const : "inactive" as const,
    reason: hasCredential ? "A provider key is stored, but live requests stay disabled until explicit activation and successful gateway validation." : "No provider key is configured.",
    publicDataMode: getPublicDataMode(),
  };
}

export async function validateSkyscannerCredential() {
  if (!process.env.SKYSCANNER_API_KEY) return { valid: false, httpStatus: null, checkedAt: new Date(), message: "No provider key is configured." };
  try {
    const response = await fetch(SKYSCANNER_SEARCH_URL, { method: "POST", headers: { "content-type": "application/json", "x-api-key": process.env.SKYSCANNER_API_KEY }, body: JSON.stringify({}) });
    const checkedAt = new Date();
    if (response.status === 401) { recordLiveProviderFailure("Skyscanner rejected the configured credential."); return { valid: false, httpStatus: 401, checkedAt, message: "The provider rejected the configured credential." }; }
    if (response.status === 403) { recordLiveProviderFailure("Skyscanner denied live-pricing access."); return { valid: false, httpStatus: 403, checkedAt, message: "The provider account lacks Flights Live Prices access." }; }
    if ([400, 429, 500, 503].includes(response.status)) return { valid: true, httpStatus: response.status, checkedAt, message: "The provider accepted the credential; the empty validation request was rejected as expected." };
    return { valid: response.ok, httpStatus: response.status, checkedAt, message: response.ok ? "The provider accepted the credential." : "Unexpected provider response." };
  } catch {
    recordLiveProviderFailure("Skyscanner credential validation could not reach the provider.");
    return { valid: false, httpStatus: null, checkedAt: new Date(), message: "The provider could not be reached for validation." };
  }
}

export async function runSkyscannerSearch(input: SkyscannerLiveSearchInput, actor: User) {
  const adapter = getSkyscannerAdapterStatus();
  if (!adapter.enabled) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Skyscanner live requests are inactive. Validate the provider key and explicitly enable the server-side live-ingestion flag before requesting real-time fares." });

  const db = await requireDb();
  const [route, carrier, source] = await Promise.all([
    getRouteDetail(input.routeId),
    db.select().from(carriers).where(eq(carriers.id, input.carrierId)).limit(1),
    db.select().from(dataSources).where(eq(dataSources.id, input.sourceId)).limit(1),
  ]);
  if (!carrier[0] || !source[0]) throw new TRPCError({ code: "NOT_FOUND", message: "The selected carrier or data source does not exist." });
  if (!carrier[0].isActive || !source[0].isActive) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Only active carriers and sources may run a live fare search." });

  let response: Response;
  try {
    response = await fetch(SKYSCANNER_SEARCH_URL, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": process.env.SKYSCANNER_API_KEY! },
      body: JSON.stringify({ query: {
        market: "IN", locale: "en-IN", currency: "INR", adults: input.adults, cabinClass: "CABIN_CLASS_ECONOMY", includedCarriersIds: [carrier[0].iataCode],
        queryLegs: [{ originPlaceId: { iata: route.origin.iataCode }, destinationPlaceId: { iata: route.destination.iataCode }, date: toDatePart(input.travelDate) }], includeSustainabilityData: false, nearbyAirports: false,
      } }),
    });
  } catch {
    recordLiveProviderFailure("Skyscanner live search could not reach the provider.");
    throw new TRPCError({ code: "BAD_GATEWAY", message: "Skyscanner is unreachable. Public market data continues to use validated historical observations." });
  }
  if (!response.ok) statusCodeError(response);
  const providerResult = await response.json() as SkyscannerResponse;
  const candidates = candidatePrices(providerResult);
  if (!candidates.length) throw new TRPCError({ code: "NOT_FOUND", message: "Skyscanner returned no usable INR pricing options for this configured route and carrier." });
  recordLiveProviderSuccess();
  const cheapest = candidates[0]!;
  const observation = {
    idempotencyKey: `skyscanner:${providerResult.sessionToken ?? "create"}:${cheapest.itineraryId}:${cheapest.pricingOptionId}`.slice(0, 128),
    sourceId: input.sourceId,
    routeId: input.routeId,
    carrierId: input.carrierId,
    observationAt: new Date(),
    bookingDate: input.bookingDate,
    travelDate: input.travelDate,
    passengerCount: input.adults,
    cabinClass: "economy" as const,
    currency: "INR",
    baseFare: cheapest.totalFareInr,
    taxes: 0,
    fees: 0,
    totalFare: cheapest.totalFareInr,
    normalizedFareInr: cheapest.totalFareInr,
  };
  if (input.mode === "preview") return { mode: "preview" as const, sessionToken: providerResult.sessionToken ?? null, providerStatus: providerResult.status ?? null, candidates, observation };
  const persisted = await importNormalizedFareObservation(observation, actor);
  return { mode: "ingest" as const, sessionToken: providerResult.sessionToken ?? null, providerStatus: providerResult.status ?? null, candidateCount: candidates.length, persisted };
}

export const __skyscannerTestables = { candidatePrices, toDatePart };
