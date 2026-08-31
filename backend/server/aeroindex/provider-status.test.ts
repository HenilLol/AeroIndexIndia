import { describe, expect, it, vi } from "vitest";
import { __providerStatusTestables, getPublicDataMode, recordLiveProviderFailure, recordLiveProviderSuccess } from "./provider-status";

describe("public data mode", () => {
  it("uses historical data by default, live data after success, and a visible fallback after failure", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-27T12:00:00.000Z"));
    __providerStatusTestables.reset();
    expect(getPublicDataMode().mode).toBe("historical");
    recordLiveProviderSuccess();
    expect(getPublicDataMode()).toMatchObject({ mode: "live", warning: null });
    recordLiveProviderFailure("gateway unavailable");
    expect(getPublicDataMode()).toMatchObject({ mode: "fallback", warning: expect.stringContaining("temporarily unavailable") });
    vi.useRealTimers();
  });
});
