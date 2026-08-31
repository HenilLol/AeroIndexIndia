import { describe, expect, it } from "vitest";
import { getPresentationDataMode, getSimulatedLivePreview, integrationSettingsGuidance } from "./aeroindex-ui";

describe("AeroIndex simulation presentation mode", () => {
  const historical = {
    mode: "historical" as const,
    source: "Validated archive",
    updatedAt: new Date("2026-09-16T00:00:00.000Z"),
    warning: "Live provider updates are not active.",
  };

  it("preserves the server-derived market mode when simulation is disabled", () => {
    expect(getPresentationDataMode(historical, false)).toEqual(historical);
  });

  it("returns a clearly labelled local-only simulation state without changing server data", () => {
    expect(getPresentationDataMode(historical, true)).toMatchObject({
      mode: "simulation",
      source: "Local UI simulation",
      updatedAt: null,
      warning: expect.stringContaining("no provider request"),
    });
    expect(historical.mode).toBe("historical");
  });

  it("provides illustrative live price and route presentation without provider payloads", () => {
    const preview = getSimulatedLivePreview();
    expect(preview.label).toBe("Simulation—no live data");
    expect(preview.livePrice.detail).toContain("no fare observation is stored");
    expect(preview.routeStatus.detail).toContain("no airline location is requested");
  });

  it("provides browser-local delayed and cancelled route-status illustrations without changing server mode", () => {
    expect(getSimulatedLivePreview("delayed").routeStatus).toMatchObject({
      value: "SIM-106 · Delayed 45 min",
      detail: expect.stringContaining("no provider status is requested"),
    });
    expect(getSimulatedLivePreview("cancelled").routeStatus).toMatchObject({
      value: "SIM-106 · Cancelled",
      detail: expect.stringContaining("no provider status is requested"),
    });
    expect(historical.mode).toBe("historical");
  });

  it("defines secure settings guidance without a browser-side secret field or value", () => {
    expect(integrationSettingsGuidance).toMatchObject({
      secureSettingsPath: "Management UI → Settings → Secrets",
      noBrowserSecretInput: true,
      noSecretValueRendered: true,
    });
  });
});
