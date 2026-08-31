import { afterEach, describe, expect, it, vi } from "vitest";
import { __aviationEdgeTestables, getAviationEdgeAdapterStatus, previewAviationEdgeTimetable, validateAviationEdgeCredential } from "./aviation-edge";
import { __providerStatusTestables, getPublicDataMode } from "./provider-status";

describe("Aviation Edge adapter", () => {
  const originalApiKey = process.env.AVIATION_EDGE_API_KEY;
  const originalEnabled = process.env.AVIATION_EDGE_LIVE_ENABLED;

  afterEach(() => {
    if (originalApiKey) process.env.AVIATION_EDGE_API_KEY = originalApiKey;
    else delete process.env.AVIATION_EDGE_API_KEY;
    if (originalEnabled) process.env.AVIATION_EDGE_LIVE_ENABLED = originalEnabled;
    else delete process.env.AVIATION_EDGE_LIVE_ENABLED;
    __providerStatusTestables.reset();
    vi.unstubAllGlobals();
  });

  it("remains inactive without an explicitly enabled server credential", () => {
    const status = getAviationEdgeAdapterStatus();
    expect(status.enabled).toBe(false);
    expect(status.fareData).toBe(false);
  });

  it("returns a safe validation response without a configured provider key", async () => {
    const prior = process.env.AVIATION_EDGE_API_KEY;
    delete process.env.AVIATION_EDGE_API_KEY;
    await expect(validateAviationEdgeCredential()).resolves.toMatchObject({ valid: false, httpStatus: null, message: "No Aviation Edge provider key is configured." });
    if (prior) process.env.AVIATION_EDGE_API_KEY = prior;
  });

  it("normalizes a live timetable record without exposing provider-only fields", () => {
    const record = __aviationEdgeTestables.normalizeTimetableRecord({
      airline: { iataCode: "6e", name: "IndiGo" },
      departure: { iataCode: "bom", scheduledTime: "2026-09-17T08:00:00.000Z", delay: "15", gate: "12", terminal: "2" },
      arrival: { iataCode: "del" },
      flight: { iataNumber: "6e 123" },
      status: "active",
      type: "departure",
    });
    expect(record).toMatchObject({ airline: "IndiGo", airlineIata: "6E", flightNumber: "6E 123", departureIata: "BOM", arrivalIata: "DEL", delayMinutes: 15, terminal: "2", gate: "12" });
    expect(record.scheduledAt).toEqual(new Date("2026-09-17T08:00:00.000Z"));
  });

  it("normalizes route response fields into AeroIndex-safe values", () => {
    expect(__aviationEdgeTestables.normalizeRouteRecord({ airlineIata: "ai", departureIata: "bom", arrivalIata: "del", flightNumber: "101", departureTime: "09:15:00", arrivalTime: "11:30:00" })).toMatchObject({ airlineIata: "AI", departureIata: "BOM", arrivalIata: "DEL", flightNumber: "101" });
  });

  it("returns safe error codes for rejected or denied live route-status access", async () => {
    process.env.AVIATION_EDGE_API_KEY = "test-key";
    process.env.AVIATION_EDGE_LIVE_ENABLED = "true";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response(null, { status: 401 })).mockResolvedValueOnce(new Response(null, { status: 403 })));
    await expect(previewAviationEdgeTimetable({ airportIata: "BOM", direction: "departure", limit: 5 })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    await expect(previewAviationEdgeTimetable({ airportIata: "BOM", direction: "departure", limit: 5 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("isolates Aviation Edge outages from the public fare-index data mode", async () => {
    process.env.AVIATION_EDGE_API_KEY = "test-key";
    process.env.AVIATION_EDGE_LIVE_ENABLED = "true";
    __providerStatusTestables.reset();
    const initialMode = getPublicDataMode().mode;
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network unavailable")));
    await expect(previewAviationEdgeTimetable({ airportIata: "BOM", direction: "departure", limit: 5 })).rejects.toMatchObject({ code: "BAD_GATEWAY" });
    expect(getPublicDataMode().mode).toBe(initialMode);
  });
});
