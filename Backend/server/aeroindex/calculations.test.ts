import { describe, expect, it } from "vitest";
import { assessFareAnomaly, calculateCpiCompatibility, calculateJevonsIndex, calculateVolatility } from "./calculations";

describe("AeroIndex deterministic calculations", () => {
  it("calculates the Jevons geometric mean without accepting invalid prices", () => {
    const result = calculateJevonsIndex([{ baseFare: 100, currentFare: 110 }, { baseFare: 100, currentFare: 121 }, { baseFare: 0, currentFare: 200 }]);
    expect(result.matchedItems).toBe(2);
    expect(result.indexValue).toBe(115.369);
  });

  it("produces an explainable CPI compatibility score", () => {
    const score = calculateCpiCompatibility({ routeActive: true, bookingWindowDays: 30, passengerCount: 1, sourceReliabilityScore: 100, isDuplicate: false, hasFlightTiming: true, hasFlightNumber: true });
    expect(score.total).toBe(100);
    expect(score.sourceReliability).toBe(15);
  });

  it("identifies a robust statistical fare spike and does not flag thin history", () => {
    const history = [5000, 5100, 4950, 5050, 5200, 5000, 5100];
    const assessment = assessFareAnomaly(11000, history);
    expect(assessment.isAnomaly).toBe(true);
    expect(assessment.severity).toMatch(/medium|high|critical/);
    expect(assessment.detectionMethods).toContain("ROBUST_STATISTICAL");
    expect(assessFareAnomaly(6000, [5000, 5100]).isAnomaly).toBe(false);
  });

  it("reports zero volatility for fewer than two values", () => {
    expect(calculateVolatility([5000])).toBe(0);
  });
});
