import { describe, expect, it, vi } from "vitest";
import { getSourceHealth, resolveAsyncPanelState } from "./aeroindex-ui";

describe("AeroIndex dashboard UI state", () => {
  it("prioritizes pending and error states before empty and ready rendering", () => {
    expect(resolveAsyncPanelState({ isLoading: true, hasError: true, itemCount: 3 })).toBe("loading");
    expect(resolveAsyncPanelState({ isLoading: false, hasError: true, itemCount: 3 })).toBe("error");
    expect(resolveAsyncPanelState({ isLoading: false, hasError: false, itemCount: 0 })).toBe("empty");
    expect(resolveAsyncPanelState({ isLoading: false, hasError: false, itemCount: 1 })).toBe("ready");
  });

  it("derives source health from the server-maintained import timestamp", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-27T12:00:00.000Z"));
    expect(getSourceHealth({ isActive: false, lastIngestedAt: new Date() })).toMatchObject({ label: "Paused" });
    expect(getSourceHealth({ isActive: true, lastIngestedAt: null })).toMatchObject({ label: "Awaiting data" });
    expect(getSourceHealth({ isActive: true, lastIngestedAt: new Date("2026-08-25T11:00:00.000Z") })).toMatchObject({ label: "Stale" });
    expect(getSourceHealth({ isActive: true, lastIngestedAt: new Date("2026-08-27T11:00:00.000Z") })).toMatchObject({ label: "Healthy" });
    vi.useRealTimers();
  });
});
