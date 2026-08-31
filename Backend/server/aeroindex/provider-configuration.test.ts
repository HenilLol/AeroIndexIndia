import { afterEach, describe, expect, it } from "vitest";
import { getAviationEdgeAdapterStatus, validateAviationEdgeCredential } from "./aviation-edge";
import { getPublicDataMode, __providerStatusTestables } from "./provider-status";
import { getSkyscannerAdapterStatus, validateSkyscannerCredential } from "./skyscanner";

const originalSkyscannerKey = process.env.SKYSCANNER_API_KEY;
const originalAviationEdgeKey = process.env.AVIATION_EDGE_API_KEY;
const originalSkyscannerEnabled = process.env.SKYSCANNER_LIVE_INGEST_ENABLED;
const originalAviationEdgeEnabled = process.env.AVIATION_EDGE_LIVE_ENABLED;

function removeProviderConfiguration() {
  delete process.env.SKYSCANNER_API_KEY;
  delete process.env.AVIATION_EDGE_API_KEY;
  delete process.env.SKYSCANNER_LIVE_INGEST_ENABLED;
  delete process.env.AVIATION_EDGE_LIVE_ENABLED;
  __providerStatusTestables.reset();
}

afterEach(() => {
  if (originalSkyscannerKey) process.env.SKYSCANNER_API_KEY = originalSkyscannerKey;
  else delete process.env.SKYSCANNER_API_KEY;
  if (originalAviationEdgeKey) process.env.AVIATION_EDGE_API_KEY = originalAviationEdgeKey;
  else delete process.env.AVIATION_EDGE_API_KEY;
  if (originalSkyscannerEnabled) process.env.SKYSCANNER_LIVE_INGEST_ENABLED = originalSkyscannerEnabled;
  else delete process.env.SKYSCANNER_LIVE_INGEST_ENABLED;
  if (originalAviationEdgeEnabled) process.env.AVIATION_EDGE_LIVE_ENABLED = originalAviationEdgeEnabled;
  else delete process.env.AVIATION_EDGE_LIVE_ENABLED;
  __providerStatusTestables.reset();
});

describe("provider configuration safety", () => {
  it("keeps both adapters inactive and public prices historical without provider keys", async () => {
    removeProviderConfiguration();
    expect(getSkyscannerAdapterStatus()).toMatchObject({ configured: false, enabled: false, state: "inactive" });
    expect(getAviationEdgeAdapterStatus()).toMatchObject({ configured: false, enabled: false, state: "inactive", fareData: false });
    await expect(validateSkyscannerCredential()).resolves.toMatchObject({ valid: false, message: "No provider key is configured." });
    await expect(validateAviationEdgeCredential()).resolves.toMatchObject({ valid: false, message: "No Aviation Edge provider key is configured." });
    expect(getPublicDataMode()).toMatchObject({ mode: "historical", warning: expect.stringContaining("not active") });
  });
});
