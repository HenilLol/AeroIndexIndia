export type CpiBreakdown = {
  routeCompatibility: number;
  travelDateWindow: number;
  bookingWindow: number;
  passengerConfiguration: number;
  sourceReliability: number;
  duplicateDetection: number;
  dataCompleteness: number;
  total: number;
};

export type AnomalySeverity = "normal" | "low" | "medium" | "high" | "critical";

export type AnomalyAssessment = {
  isAnomaly: boolean;
  severity: AnomalySeverity;
  anomalyScore: number;
  ruleScore: number;
  statisticalScore: number;
  baselineMedian: number | null;
  percentDifference: number | null;
  detectionMethods: string[];
  explanation: string;
};

const round = (value: number, digits = 2) => Number(value.toFixed(digits));
const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

export function median(values: number[]): number | null {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

export function calculateCpiCompatibility(input: {
  routeActive: boolean;
  bookingWindowDays: number;
  passengerCount: number;
  sourceReliabilityScore: number;
  isDuplicate: boolean;
  hasFlightTiming: boolean;
  hasFlightNumber: boolean;
}): CpiBreakdown {
  const routeCompatibility = input.routeActive ? 20 : 0;
  const travelDateWindow = input.bookingWindowDays >= 1 && input.bookingWindowDays <= 120 ? 20 : 8;
  const bookingWindow = input.bookingWindowDays >= 7 && input.bookingWindowDays <= 60 ? 15 : 7;
  const passengerConfiguration = input.passengerCount === 1 ? 15 : 8;
  const sourceReliability = round(clamp(input.sourceReliabilityScore / 100) * 15);
  const duplicateDetection = input.isDuplicate ? 0 : 10;
  const dataCompleteness = (input.hasFlightTiming ? 3 : 0) + (input.hasFlightNumber ? 2 : 0);
  const total = round(routeCompatibility + travelDateWindow + bookingWindow + passengerConfiguration + sourceReliability + duplicateDetection + dataCompleteness);
  return { routeCompatibility, travelDateWindow, bookingWindow, passengerConfiguration, sourceReliability, duplicateDetection, dataCompleteness, total };
}

export function calculateJevonsIndex(pairs: Array<{ baseFare: number; currentFare: number }>) {
  const validPairs = pairs.filter(pair => pair.baseFare > 0 && pair.currentFare > 0 && Number.isFinite(pair.baseFare) && Number.isFinite(pair.currentFare));
  if (!validPairs.length) {
    return { indexValue: null, matchedItems: 0, ratios: [] as number[] };
  }
  const ratios = validPairs.map(pair => pair.currentFare / pair.baseFare);
  const logMean = ratios.reduce((sum, ratio) => sum + Math.log(ratio), 0) / ratios.length;
  return { indexValue: round(Math.exp(logMean) * 100, 4), matchedItems: ratios.length, ratios };
}

export function calculateVolatility(values: number[]) {
  const safe = values.filter(value => value > 0 && Number.isFinite(value));
  if (safe.length < 2) return 0;
  const average = safe.reduce((sum, value) => sum + value, 0) / safe.length;
  const variance = safe.reduce((sum, value) => sum + (value - average) ** 2, 0) / safe.length;
  return round((Math.sqrt(variance) / average) * 100, 2);
}

export function calculateConfidence(sampleSize: number, volatilityPercent: number) {
  const sampleFactor = clamp(sampleSize / 12);
  const stabilityFactor = 1 - clamp(volatilityPercent / 100);
  return round((sampleFactor * 0.7 + stabilityFactor * 0.3) * 100);
}

export function assessFareAnomaly(currentFare: number, historicalFares: number[]): AnomalyAssessment {
  const sample = historicalFares.filter(value => value > 0 && Number.isFinite(value));
  if (sample.length < 4) {
    return {
      isAnomaly: false,
      severity: "normal",
      anomalyScore: 0,
      ruleScore: 0,
      statisticalScore: 0,
      baselineMedian: median(sample),
      percentDifference: null,
      detectionMethods: [],
      explanation: "Insufficient historical route observations for a statistically reliable anomaly assessment.",
    };
  }

  const baselineMedian = median(sample)!;
  const percentDifference = ((currentFare - baselineMedian) / baselineMedian) * 100;
  const ruleScore = clamp((Math.abs(percentDifference) - 35) / 115);

  const deviations = sample.map(value => Math.abs(value - baselineMedian));
  const mad = median(deviations) ?? 0;
  const modifiedZ = mad === 0 ? (currentFare === baselineMedian ? 0 : 10) : (0.6745 * (currentFare - baselineMedian)) / mad;
  const sorted = [...sample].sort((a, b) => a - b);
  const q1 = median(sorted.slice(0, Math.floor(sorted.length / 2))) ?? baselineMedian;
  const q3 = median(sorted.slice(Math.ceil(sorted.length / 2))) ?? baselineMedian;
  const iqr = q3 - q1;
  const outsideIqr = iqr === 0 ? currentFare !== baselineMedian : currentFare < q1 - 1.5 * iqr || currentFare > q3 + 1.5 * iqr;
  const zScore = clamp((Math.abs(modifiedZ) - 2.5) / 5);
  const statisticalScore = outsideIqr ? Math.max(0.55, zScore) : zScore;
  const anomalyScore = round(ruleScore * 0.45 + statisticalScore * 0.55, 4);
  const isAnomaly = anomalyScore >= 0.55;
  const severity: AnomalySeverity = anomalyScore >= 0.9 ? "critical" : anomalyScore >= 0.75 ? "high" : anomalyScore >= 0.6 ? "medium" : anomalyScore >= 0.55 ? "low" : "normal";
  const methods = [ruleScore >= 0.25 ? "RULE_BASED" : null, statisticalScore >= 0.25 ? "ROBUST_STATISTICAL" : null].filter((method): method is string => Boolean(method));
  const direction = percentDifference >= 0 ? "higher" : "lower";
  const explanation = isAnomaly
    ? `Observed fare is ${round(Math.abs(percentDifference))}% ${direction} than the route median of ₹${round(baselineMedian)}; rule and robust-distribution checks jointly produced a ${severity} assessment.`
    : "Observed fare remains within the configured route-level rule and robust statistical thresholds.";
  return { isAnomaly, severity, anomalyScore, ruleScore: round(ruleScore, 4), statisticalScore: round(statisticalScore, 4), baselineMedian: round(baselineMedian), percentDifference: round(percentDifference), detectionMethods: methods, explanation };
}

export function buildTrendSummary(values: Array<{ timestamp: Date; fare: number }>) {
  const ordered = [...values].filter(value => value.fare > 0).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  if (!ordered.length) return { direction: "flat" as const, percentChange: 0, firstFare: null, latestFare: null };
  const firstFare = ordered[0]!.fare;
  const latestFare = ordered[ordered.length - 1]!.fare;
  const percentChange = round(((latestFare - firstFare) / firstFare) * 100);
  return { direction: percentChange > 2 ? "up" as const : percentChange < -2 ? "down" as const : "flat" as const, percentChange, firstFare: round(firstFare), latestFare: round(latestFare) };
}
