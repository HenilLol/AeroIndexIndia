import { describe, expect, it } from "vitest";

const baseUrl = "https://partners.api.skyscanner.net/apiservices/v3/flights/live/search/create";

describe("Skyscanner provider credentials", () => {
  const enabled = process.env.AEROINDEX_LIVE_PROVIDER_CONTRACT_TEST === "true";

  it.skipIf(!enabled)("is accepted by the Flights Live Prices API gateway", async () => {
    const apiKey = process.env.SKYSCANNER_API_KEY;
    expect(apiKey, "SKYSCANNER_API_KEY must be configured for live pricing").toBeTruthy();
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey! },
      body: JSON.stringify({}),
    });
    expect(response.status, `Skyscanner rejected the configured key with ${response.status}`).not.toBe(401);
    expect(response.status, `Skyscanner denied access for the configured key with ${response.status}`).not.toBe(403);
    expect([400, 429, 500, 503]).toContain(response.status);
  }, 20_000);
});
