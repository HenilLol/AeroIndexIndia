export type Severity = "High" | "Medium" | "Low";

export type RouteRecord = {
  id: string;
  origin: string;
  destination: string;
  currentFare: number;
  baseline: number;
  change: number;
  score: number;
  severity: Severity;
  anomalyScore: number;
  tier: "Tier 1" | "Tier 2" | "Tier 3";
  weight: number;
  traffic: "High" | "Medium" | "Emerging";
  availability: number;
  recommendation: number;
  included: boolean;
  sources: string[];
  observations: number;
  explanation: string;
};

export const ROUTES: RouteRecord[] = [
  { id: "DEL-BOM", origin: "DEL", destination: "BOM", currentFare: 6250, baseline: 5580, change: 12.0, score: 96, severity: "Medium", anomalyScore: 68, tier: "Tier 1", weight: 18, traffic: "High", availability: 98, recommendation: 98, included: true, sources: ["IndiGo", "Air India", "MakeMyTrip", "Cleartrip"], observations: 184, explanation: "Stable cross-source agreement with moderate weekend pressure." },
  { id: "DEL-BLR", origin: "DEL", destination: "BLR", currentFare: 7130, baseline: 6540, change: 9.0, score: 93, severity: "Low", anomalyScore: 31, tier: "Tier 1", weight: 14, traffic: "High", availability: 95, recommendation: 96, included: true, sources: ["IndiGo", "Akasa", "Ixigo"], observations: 166, explanation: "Advance-purchase fares are rising steadily across three sources." },
  { id: "DEL-HYD", origin: "DEL", destination: "HYD", currentFare: 5780, baseline: 5590, change: 3.4, score: 91, severity: "Low", anomalyScore: 22, tier: "Tier 1", weight: 10, traffic: "High", availability: 92, recommendation: 94, included: true, sources: ["IndiGo", "Air India", "EaseMyTrip"], observations: 139, explanation: "Movement remains inside the established route volatility band." },
  { id: "AMD-DEL", origin: "AMD", destination: "DEL", currentFare: 9850, baseline: 6940, change: 42.0, score: 93, severity: "High", anomalyScore: 92, tier: "Tier 2", weight: 8, traffic: "High", availability: 94, recommendation: 92, included: true, sources: ["IndiGo", "Air India", "MakeMyTrip", "Yatra"], observations: 129, explanation: "A compressed booking window and weekend demand were confirmed across four monitored sources." },
  { id: "BOM-BLR", origin: "BOM", destination: "BLR", currentFare: 6840, baseline: 6330, change: 8.1, score: 92, severity: "Medium", anomalyScore: 63, tier: "Tier 1", weight: 13, traffic: "High", availability: 95, recommendation: 97, included: true, sources: ["IndiGo", "Akasa", "Cleartrip"], observations: 154, explanation: "Business-travel demand is lifting fares in the 7–14 day window." },
  { id: "BOM-CCU", origin: "BOM", destination: "CCU", currentFare: 7410, baseline: 7030, change: 5.4, score: 88, severity: "Low", anomalyScore: 38, tier: "Tier 2", weight: 6, traffic: "Medium", availability: 89, recommendation: 86, included: true, sources: ["Air India", "IndiGo", "Ixigo"], observations: 112, explanation: "Moderate seasonal movement with sound observation coverage." },
  { id: "MAA-HYD", origin: "MAA", destination: "HYD", currentFare: 4240, baseline: 4360, change: -2.8, score: 94, severity: "Low", anomalyScore: 24, tier: "Tier 2", weight: 5, traffic: "Medium", availability: 97, recommendation: 90, included: true, sources: ["IndiGo", "Air India", "Cleartrip"], observations: 136, explanation: "Supply remains ample and prices eased in all reliable sources." },
  { id: "MAA-CCU", origin: "MAA", destination: "CCU", currentFare: 5160, baseline: 5380, change: -4.1, score: 89, severity: "Low", anomalyScore: 34, tier: "Tier 2", weight: 4, traffic: "Medium", availability: 90, recommendation: 85, included: true, sources: ["IndiGo", "Akasa", "Yatra"], observations: 104, explanation: "A modest fare correction follows additional observed seat availability." },
  { id: "CCU-DEL", origin: "CCU", destination: "DEL", currentFare: 7320, baseline: 7020, change: 4.3, score: 87, severity: "Low", anomalyScore: 29, tier: "Tier 2", weight: 5, traffic: "Medium", availability: 85, recommendation: 84, included: true, sources: ["Air India", "IndiGo", "MakeMyTrip"], observations: 101, explanation: "Price growth is present but below the route’s historical alert threshold." },
  { id: "GOI-DEL", origin: "GOI", destination: "DEL", currentFare: 8120, baseline: 7380, change: 10.0, score: 76, severity: "Medium", anomalyScore: 66, tier: "Tier 3", weight: 2, traffic: "Medium", availability: 77, recommendation: 76, included: false, sources: ["IndiGo", "EaseMyTrip"], observations: 63, explanation: "Leisure demand strengthened, while data availability warrants closer monitoring." },
  { id: "PNQ-DEL", origin: "PNQ", destination: "DEL", currentFare: 6590, baseline: 6180, change: 6.6, score: 84, severity: "Low", anomalyScore: 41, tier: "Tier 3", weight: 2, traffic: "Medium", availability: 87, recommendation: 82, included: false, sources: ["IndiGo", "Air India", "Ixigo"], observations: 87, explanation: "Observed price movement tracks the normal route-level pattern." },
  { id: "AMD-BOM", origin: "AMD", destination: "BOM", currentFare: 4680, baseline: 4510, change: 3.8, score: 95, severity: "Low", anomalyScore: 18, tier: "Tier 2", weight: 3, traffic: "Medium", availability: 96, recommendation: 91, included: true, sources: ["IndiGo", "Akasa", "Cleartrip"], observations: 148, explanation: "High-quality observations make this a useful regional comparator." },
  { id: "HYD-BOM", origin: "HYD", destination: "BOM", currentFare: 5250, baseline: 5360, change: -2.1, score: 90, severity: "Low", anomalyScore: 27, tier: "Tier 2", weight: 3, traffic: "Medium", availability: 93, recommendation: 88, included: true, sources: ["IndiGo", "Air India", "MakeMyTrip"], observations: 123, explanation: "A controlled decrease appears consistently across monitored suppliers." },
  { id: "BLR-HYD", origin: "BLR", destination: "HYD", currentFare: 3890, baseline: 3660, change: 6.3, score: 92, severity: "Low", anomalyScore: 39, tier: "Tier 2", weight: 2, traffic: "Medium", availability: 92, recommendation: 87, included: false, sources: ["IndiGo", "Akasa", "Yatra"], observations: 109, explanation: "Slight compression in the booking window is the primary driver." },
  { id: "DEL-JAI", origin: "DEL", destination: "JAI", currentFare: 3450, baseline: 3230, change: 6.8, score: 85, severity: "Low", anomalyScore: 35, tier: "Tier 3", weight: 1, traffic: "Emerging", availability: 83, recommendation: 79, included: false, sources: ["IndiGo", "Cleartrip"], observations: 72, explanation: "A steady regional uplift with no abnormal source gap." },
  { id: "BOM-GOI", origin: "BOM", destination: "GOI", currentFare: 4570, baseline: 4050, change: 12.8, score: 80, severity: "Medium", anomalyScore: 71, tier: "Tier 3", weight: 1, traffic: "Emerging", availability: 79, recommendation: 74, included: false, sources: ["IndiGo", "Akasa"], observations: 58, explanation: "Weekend leisure demand has pushed fares above the normal seasonal curve." },
  { id: "HYD-CCU", origin: "HYD", destination: "CCU", currentFare: 6100, baseline: 5880, change: 3.7, score: 86, severity: "Low", anomalyScore: 32, tier: "Tier 3", weight: 1, traffic: "Emerging", availability: 86, recommendation: 80, included: false, sources: ["IndiGo", "Air India", "Ixigo"], observations: 75, explanation: "Price levels are broadly stable with enough observations for review." },
  { id: "BLR-MAA", origin: "BLR", destination: "MAA", currentFare: 3550, baseline: 3480, change: 2.0, score: 93, severity: "Low", anomalyScore: 16, tier: "Tier 3", weight: 1, traffic: "Emerging", availability: 94, recommendation: 83, included: false, sources: ["IndiGo", "Akasa", "EaseMyTrip"], observations: 116, explanation: "Short-haul supply conditions kept the route within baseline variation." },
  { id: "DEL-IXC", origin: "DEL", destination: "IXC", currentFare: 3970, baseline: 3750, change: 5.9, score: 82, severity: "Low", anomalyScore: 36, tier: "Tier 3", weight: 1, traffic: "Emerging", availability: 80, recommendation: 77, included: false, sources: ["IndiGo", "Air India"], observations: 66, explanation: "A measured increase with a stable underlying source mix." },
  { id: "BOM-NAG", origin: "BOM", destination: "NAG", currentFare: 4120, baseline: 3820, change: 7.9, score: 81, severity: "Low", anomalyScore: 44, tier: "Tier 3", weight: 1, traffic: "Emerging", availability: 82, recommendation: 78, included: false, sources: ["IndiGo", "Air India"], observations: 61, explanation: "The observed movement is notable but does not exceed anomaly criteria." },
];

export const TREND_DATA = [
  { day: "Aug 04", index: 110.8, reference: 109.6 },
  { day: "Aug 08", index: 111.4, reference: 110.1 },
  { day: "Aug 12", index: 112.2, reference: 110.8 },
  { day: "Aug 16", index: 113.6, reference: 111.4 },
  { day: "Aug 20", index: 115.2, reference: 112.3 },
  { day: "Aug 24", index: 116.8, reference: 113.1 },
  { day: "Aug 27", index: 118.4, reference: 114.2 },
];

export const BOOKING_DATA = [
  { days: "30d", fare: 4200 },
  { days: "25d", fare: 4380 },
  { days: "21d", fare: 4850 },
  { days: "18d", fare: 5120 },
  { days: "14d", fare: 5600 },
  { days: "10d", fare: 6430 },
  { days: "7d", fare: 7900 },
  { days: "3d", fare: 10400 },
];

export const CPI_FACTORS = [
  { label: "Route Consistency", score: 15, max: 15 },
  { label: "Travel Date Window", score: 15, max: 15 },
  { label: "Booking Window", score: 14, max: 15 },
  { label: "Passenger Configuration", score: 15, max: 15 },
  { label: "Source Reliability", score: 14, max: 15 },
  { label: "Duplicate Detection", score: 15, max: 15 },
  { label: "Missing Data Check", score: 8, max: 10 },
];

export const AUDIT_EVENTS = [
  { time: "10:42:00", title: "Data Collected", detail: "Airfare observation captured from validated source set." },
  { time: "10:42:03", title: "Validation Completed", detail: "Route, passenger and booking-window checks passed." },
  { time: "10:42:04", title: "Normalization Completed", detail: "Currency, fare family and journey pattern standardized." },
  { time: "10:42:05", title: "Stored Successfully", detail: "Observation assigned immutable audit identifier AIX-DEL-BOM-8842." },
  { time: "10:45:00", title: "Included in Index Calculation", detail: "Eligible observation contributed to route-level Jevons calculation." },
];

export const CPI_BUCKETS = [
  { name: "High", value: 62, fill: "#718B78" },
  { name: "Reliable", value: 24, fill: "#7D90A7" },
  { name: "Moderate", value: 10, fill: "#AA8960" },
  { name: "Low", value: 4, fill: "#B46E68" },
];

export const WEIGHTS = [
  { name: "Tier 1", value: 55, fill: "#6E839C" },
  { name: "Tier 2", value: 30, fill: "#92A0AE" },
  { name: "Tier 3", value: 15, fill: "#657387" },
];

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export function reliability(score: number) {
  if (score >= 90) return "High Reliability";
  if (score >= 75) return "Reliable";
  if (score >= 60) return "Moderate";
  return "Low Compatibility";
}

export function routeLabel(route: RouteRecord) {
  return `${route.origin} → ${route.destination}`;
}
