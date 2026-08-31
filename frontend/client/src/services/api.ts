import type { RouteRecord, Severity } from "@/data/mockData";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

type TrpcEnvelope<T> = { result?: { data?: { json?: T } } };

async function trpcQuery<T>(procedure: string, input?: unknown): Promise<T> {
  const url = new URL(`${API_BASE_URL}/api/trpc/${procedure}`);
  if (input !== undefined) url.searchParams.set("input", JSON.stringify({ json: input }));
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`AeroIndex API request failed (${response.status})`);
  const payload = (await response.json()) as TrpcEnvelope<T>;
  const value = payload.result?.data?.json;
  if (value === undefined) throw new Error("AeroIndex API returned an invalid response");
  return value;
}

export type DashboardOverview = {
  dataMode: { mode: string; warning?: string | null };
  latestNationalIndex: { value: number; asOfDate: string | Date; changePercent: number; confidence: number } | null;
  marketSnapshot: { recentObservationCount: number; recentAverageFare: number | null; recentVolatilityPercent: number; openAlerts: number };
  alerts: Array<{ id: number; severity: Severity; score: number; explanation: string; createdAt: string | Date }>;
};
export type RouteSearchResponse = Awaited<ReturnType<typeof searchRoutes>>;

export function getDashboardOverview() {
  return trpcQuery<DashboardOverview>("aeroIndex.public.dashboard");
}

export function searchRoutes(input: { query?: string; limit?: number } = {}) {
  return trpcQuery<{ items: Array<{ id: number; origin: { iataCode: string; city: string | null }; destination: { iataCode: string; city: string | null } }>; nextCursor?: number }>("aeroIndex.public.routes.search", { limit: 100, ...input });
}

export function getFareHistory(input: { limit?: number; routeId?: number } = {}) {
  return trpcQuery<{ items: Array<{ id: number; routeId: number; carrierId: number; observationAt: string | Date; travelDate: string | Date; normalizedFareInr: number; cpiCompatibilityScore: number; isAnomaly: boolean; anomalyScore: number }>; nextCursor?: number }>("aeroIndex.public.fares.history", { limit: 100, ...input });
}

export function getIndexHistory(input: { routeId?: number; limit?: number } = {}) {
  return trpcQuery<Array<{ id: number; routeId: number | null; asOfDate: string | Date; indexValue: number; percentChange: number; confidenceScore: number }>>("aeroIndex.public.routes.indexHistory", { limit: 90, ...input });
}

export function getAlerts(limit = 25) {
  return trpcQuery<Array<{ id: number; severity: Severity; anomalyScore: number; explanation: string; createdAt: string | Date }>>("aeroIndex.public.alerts.list", { limit });
}

function severityFor(score: number): Severity {
  if (score >= 80) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

export async function loadLiveAeroIndex() {
  const [dashboard, routeSearch, fares, indexHistory, alerts] = await Promise.all([
    getDashboardOverview(),
    searchRoutes(),
    getFareHistory(),
    getIndexHistory(),
    getAlerts(),
  ]);
  const faresByRoute = new Map<number, typeof fares.items>();
  for (const fare of fares.items) faresByRoute.set(fare.routeId, [...(faresByRoute.get(fare.routeId) || []), fare]);
  const routes: RouteRecord[] = routeSearch.items.map((route) => {
    const observations = faresByRoute.get(route.id) || [];
    const ordered = [...observations].sort((a, b) => new Date(a.observationAt).getTime() - new Date(b.observationAt).getTime());
    const currentFare = ordered.at(-1)?.normalizedFareInr || 0;
    const baseline = ordered[0]?.normalizedFareInr || currentFare;
    const change = baseline ? ((currentFare - baseline) / baseline) * 100 : 0;
    const score = observations.length ? Math.round(observations.reduce((sum, item) => sum + item.cpiCompatibilityScore, 0) / observations.length) : 0;
    const anomalyScore = observations.length ? Math.max(...observations.map((item) => item.anomalyScore || 0)) : 0;
    return {
      id: String(route.id), origin: route.origin.iataCode, destination: route.destination.iataCode,
      currentFare, baseline, change, score, severity: severityFor(anomalyScore), anomalyScore,
      tier: "Tier 1", weight: 0, traffic: "High", availability: score, recommendation: score,
      included: true, sources: ["Backend observations"], observations: observations.length,
      explanation: observations.some((item) => item.isAnomaly) ? "Backend anomaly detection flagged one or more observations." : "No backend anomaly was flagged for the available observations.",
    };
  });
  return { dashboard, routes, fares, indexHistory, alerts };
}

export function getApiBaseUrl() { return API_BASE_URL; }
