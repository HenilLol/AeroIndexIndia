import { afterEach, describe, expect, it, vi } from "vitest";
import { __skyscannerTestables, getSkyscannerAdapterStatus, validateSkyscannerCredential } from "./skyscanner";
import { __providerStatusTestables, getPublicDataMode } from "./provider-status";

describe("Skyscanner adapter", () => {
  const originalKey = process.env.SKYSCANNER_API_KEY;

  afterEach(() => {
    if (originalKey) process.env.SKYSCANNER_API_KEY = originalKey;
    else delete process.env.SKYSCANNER_API_KEY;
    __providerStatusTestables.reset();
    vi.unstubAllGlobals();
  });

  it("normalizes only positive price amounts from documented itinerary pricing options", () => {
    const candidates = __skyscannerTestables.candidatePrices({
      sessionToken: "session-1",
      content: { results: { itineraries: {
        a: { pricingOptions: [{ id: "expensive", price: { amount: "7200" } }, { id: "low", price: { amount: "5850.5" } }] },
        b: { pricingOptions: [{ id: "invalid", price: { amount: "0" } }] },
      } } },
    });
    expect(candidates).toEqual([
      { itineraryId: "a", pricingOptionId: "low", totalFareInr: 5850.5 },
      { itineraryId: "a", pricingOptionId: "expensive", totalFareInr: 7200 },
    ]);
  });

  it("reports an inactive safe mode until explicit live activation is configured", () => {
    const previous = process.env.SKYSCANNER_LIVE_INGEST_ENABLED;
    delete process.env.SKYSCANNER_LIVE_INGEST_ENABLED;
    expect(getSkyscannerAdapterStatus().enabled).toBe(false);
    process.env.SKYSCANNER_LIVE_INGEST_ENABLED = previous;
  });

  it("turns public market status to historical fallback when the provider rejects a credential", async () => {
    process.env.SKYSCANNER_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 401 })));
    const result = await validateSkyscannerCredential();
    expect(result).toMatchObject({ valid: false, httpStatus: 401 });
    expect(getPublicDataMode()).toMatchObject({ mode: "fallback", warning: expect.stringContaining("temporarily unavailable") });
  });
});
