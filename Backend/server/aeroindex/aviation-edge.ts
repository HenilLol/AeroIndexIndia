import { TRPCError } from "@trpc/server";
import type { AviationEdgeRoutesInput, AviationEdgeTimetableInput } from "./contracts";

const AVIATION_EDGE_BASE_URL = "https://aviation-edge.com/v2/public";
const AVIATION_EDGE_LIVE_ENABLED = () => process.env.AVIATION_EDGE_LIVE_ENABLED === "true";

type AviationEdgeAirport = {
  actualTime?: string | null;
  delay?: string | number | null;
  estimatedTime?: string | null;
  iataCode?: string | null;
  scheduledTime?: string | null;
  terminal?: string | null;
  gate?: string | null;
};
type AviationEdgeAirline = { iataCode?: string | null; icaoCode?: string | null; name?: string | null };
type AviationEdgeFlight = { iataNumber?: string | null; icaoNumber?: string | null; number?: string | null };
type AviationEdgeTimetableRecord = {
  airline?: AviationEdgeAirline | null;
  arrival?: AviationEdgeAirport | null;
  departure?: AviationEdgeAirport | null;
  flight?: AviationEdgeFlight | null;
  status?: string | null;
  type?: string | null;
};
type AviationEdgeRouteRecord = {
  airlineIata?: string | null;
  airlineIcao?: string | null;
  arrivalIata?: string | null;
  arrivalIcao?: string | null;
  arrivalTerminal?: string | null;
  arrivalTime?: string | null;
  codeshares?: string | null;
  departureIata?: string | null;
  departureIcao?: string | null;
  departureTerminal?: string | null;
  departureTime?: string | null;
  flightNumber?: string | null;
};

function normalizeCode(value: string | null | undefined) {
  const normalized = value?.trim().toUpperCase();
  return normalized || null;
}

function normalizeTime(value: string | null | undefined) {
  return value && !Number.isNaN(Date.parse(value)) ? new Date(value) : null;
}

function normalizedDelay(value: string | number | null | undefined) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
}

function boundedRecords<T>(value: unknown, limit: number): T[] {
  return Array.isArray(value) ? value.slice(0, limit) as T[] : [];
}

function buildUrl(path: string, params: Record<string, string | undefined>) {
  const url = new URL(`${AVIATION_EDGE_BASE_URL}/${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  return url;
}

function providerFailure(response: Response): never {
  if (response.status === 401) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Aviation Edge rejected the configured credential. Live route tracking remains inactive." });
  if (response.status === 403) throw new TRPCError({ code: "FORBIDDEN", message: "The Aviation Edge account is not authorised for this route or flight-status resource." });
  if (response.status === 429) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Aviation Edge rate limit reached. Try again later." });
  throw new TRPCError({ code: "BAD_GATEWAY", message: `Aviation Edge request failed with HTTP ${response.status}.` });
}

async function aviationEdgeFetch(path: string, params: Record<string, string | undefined>) {
  const apiKey = process.env.AVIATION_EDGE_API_KEY;
  if (!apiKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No Aviation Edge key is configured." });
  const response = await fetch(buildUrl(path, { ...params, key: apiKey }), { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) providerFailure(response);
  return response.json() as Promise<unknown>;
}

export function getAviationEdgeAdapterStatus() {
  const configured = Boolean(process.env.AVIATION_EDGE_API_KEY);
  const enabled = configured && AVIATION_EDGE_LIVE_ENABLED();
  return {
    provider: "Aviation Edge Flight Tracker and Routes",
    configured,
    enabled,
    state: enabled ? "ready" as const : "inactive" as const,
    reason: configured ? "A provider key is stored, but live route and status requests require explicit activation and successful gateway validation." : "No Aviation Edge provider key is configured.",
    supportedData: ["flight status", "airport timetable", "airline routes"] as const,
    fareData: false,
  };
}

export async function validateAviationEdgeCredential() {
  if (!process.env.AVIATION_EDGE_API_KEY) return { valid: false, httpStatus: null, checkedAt: new Date(), message: "No Aviation Edge provider key is configured." };
  try {
    const response = await fetch(buildUrl("flights", { key: process.env.AVIATION_EDGE_API_KEY, status: "en-route" }), { signal: AbortSignal.timeout(10_000) });
    const checkedAt = new Date();
    if (response.status === 401) return { valid: false, httpStatus: 401, checkedAt, message: "The provider rejected the configured credential." };
    if (response.status === 403) return { valid: false, httpStatus: 403, checkedAt, message: "The provider account lacks Flight Tracker access." };
    if ([400, 429, 500, 503].includes(response.status)) return { valid: true, httpStatus: response.status, checkedAt, message: "The provider accepted the credential; the bounded validation request was not fulfilled." };
    return { valid: response.ok, httpStatus: response.status, checkedAt, message: response.ok ? "The provider accepted the credential." : "Unexpected provider response." };
  } catch {
    return { valid: false, httpStatus: null, checkedAt: new Date(), message: "The provider could not be reached for validation." };
  }
}

export async function previewAviationEdgeTimetable(input: AviationEdgeTimetableInput) {
  const adapter = getAviationEdgeAdapterStatus();
  if (!adapter.enabled) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Aviation Edge live route tracking is inactive. Validate the server-side key and enable the live flag before requesting a preview." });
  let payload: unknown;
  try {
    payload = await aviationEdgeFetch("timetable", { iataCode: input.airportIata, type: input.direction, airline_iata: input.airlineIata, status: input.status });
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw new TRPCError({ code: "BAD_GATEWAY", message: "Aviation Edge is unreachable. Historical fare data remains unaffected." });
  }
  return boundedRecords<AviationEdgeTimetableRecord>(payload, input.limit).map(normalizeTimetableRecord);
}

export async function previewAviationEdgeRoutes(input: AviationEdgeRoutesInput) {
  const adapter = getAviationEdgeAdapterStatus();
  if (!adapter.enabled) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Aviation Edge live route tracking is inactive. Validate the server-side key and enable the live flag before requesting a preview." });
  let payload: unknown;
  try {
    payload = await aviationEdgeFetch("routes", { airlineIata: input.airlineIata, departureIata: input.departureIata, arrivalIata: input.arrivalIata, flightNumber: input.flightNumber });
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw new TRPCError({ code: "BAD_GATEWAY", message: "Aviation Edge is unreachable. Historical fare data remains unaffected." });
  }
  return boundedRecords<AviationEdgeRouteRecord>(payload, input.limit).map(normalizeRouteRecord);
}

export function normalizeTimetableRecord(record: AviationEdgeTimetableRecord) {
  const departure = record.departure ?? {};
  const arrival = record.arrival ?? {};
  return {
    airline: record.airline?.name?.trim() || null,
    airlineIata: normalizeCode(record.airline?.iataCode),
    flightNumber: normalizeCode(record.flight?.iataNumber ?? record.flight?.number),
    status: record.status?.trim().toLowerCase() || "unknown",
    direction: record.type?.trim().toLowerCase() || null,
    departureIata: normalizeCode(departure.iataCode),
    arrivalIata: normalizeCode(arrival.iataCode),
    scheduledAt: normalizeTime(record.type === "arrival" ? arrival.scheduledTime : departure.scheduledTime),
    estimatedAt: normalizeTime(record.type === "arrival" ? arrival.estimatedTime : departure.estimatedTime),
    actualAt: normalizeTime(record.type === "arrival" ? arrival.actualTime : departure.actualTime),
    delayMinutes: normalizedDelay(record.type === "arrival" ? arrival.delay : departure.delay),
    terminal: (record.type === "arrival" ? arrival.terminal : departure.terminal) ?? null,
    gate: (record.type === "arrival" ? arrival.gate : departure.gate) ?? null,
  };
}

export function normalizeRouteRecord(record: AviationEdgeRouteRecord) {
  return {
    airlineIata: normalizeCode(record.airlineIata),
    airlineIcao: normalizeCode(record.airlineIcao),
    flightNumber: normalizeCode(record.flightNumber),
    departureIata: normalizeCode(record.departureIata),
    departureIcao: normalizeCode(record.departureIcao),
    departureTime: record.departureTime?.trim() || null,
    departureTerminal: record.departureTerminal?.trim() || null,
    arrivalIata: normalizeCode(record.arrivalIata),
    arrivalIcao: normalizeCode(record.arrivalIcao),
    arrivalTime: record.arrivalTime?.trim() || null,
    arrivalTerminal: record.arrivalTerminal?.trim() || null,
    codeshares: record.codeshares?.trim() || null,
  };
}

export const __aviationEdgeTestables = { normalizeRouteRecord, normalizeTimetableRecord };
