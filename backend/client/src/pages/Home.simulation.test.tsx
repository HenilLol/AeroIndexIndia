// @vitest-environment jsdom
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSetLocation = vi.fn();
const dashboardResult = {
  data: {
    latestNationalIndex: { value: 102.4, changePercent: 0, asOfDate: new Date("2026-09-16T00:00:00.000Z") },
    marketSnapshot: { recentAverageFare: 6543, recentObservationCount: 7, recentVolatilityPercent: 10, openAlerts: 0 },
    dataMode: { mode: "historical" as const, source: "Validated archive", updatedAt: null, warning: "Live provider updates are not active; figures shown use validated historical observations." },
  },
  isLoading: false,
  error: null,
  refetch: vi.fn(),
};

vi.mock("wouter", () => ({ useLocation: () => ["/", mockSetLocation] }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    aeroIndex: {
      public: {
        dashboard: { useQuery: () => dashboardResult },
        routes: {
          search: { useQuery: () => ({ data: { items: [{ id: 1, origin: { iataCode: "DEL", city: "Delhi" }, destination: { iataCode: "BOM", city: "Mumbai" } }] }, isLoading: false, error: null, refetch: vi.fn() }) },
          indexHistory: { useQuery: () => ({ data: [], isLoading: false, error: null, refetch: vi.fn() }) },
          analytics: { useQuery: () => ({ data: { route: { origin: { iataCode: "DEL", city: "Delhi" }, destination: { iataCode: "BOM", city: "Mumbai" }, distanceKm: 1148 }, averageFare: 6543, minimumFare: 5200, volatilityPercent: 10, trend: { percentChange: 0 }, observationCount: 7 }, isLoading: false, error: null, refetch: vi.fn() }) },
        },
        fares: { history: { useQuery: () => ({ data: { items: [{ routeId: 1 }] }, isLoading: false, error: null, refetch: vi.fn() }) } },
        carriers: { compare: { useQuery: () => ({ data: [], isLoading: false, error: null, refetch: vi.fn() }) } },
        alerts: { list: { useQuery: () => ({ data: [], isLoading: false, error: null, refetch: vi.fn() }) } },
      },
    },
  },
}));

import Home from "./Home";

describe("Home simulation preview", () => {
  beforeEach(() => {
    mockSetLocation.mockReset();
  });

  it("switches dashboard presentation labels locally without changing historical API data", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await waitFor(() => expect(screen.getByTestId("dashboard-data-mode-title").textContent).toBe("Historical data mode"));
    expect(screen.getByTestId("dashboard-data-mode-badge").textContent).toBe("Historical data");
    expect(screen.getByTestId("route-analysis-label").textContent).toBe("Historical analysis");
    expect(screen.getByTestId("dashboard-data-mode-footer").textContent).toBe("Validated historical data mode");
    expect(dashboardResult.data.dataMode.mode).toBe("historical");

    await user.click(screen.getByRole("button", { name: "Preview live UI" }));

    expect(screen.getByText(/Preview mode is on/)).toBeTruthy();
    expect(screen.getByText(/simulated live interface using historical values/)).toBeTruthy();
    expect(screen.getByTestId("dashboard-data-mode-title").textContent).toBe("Simulation—no live data");
    expect(screen.getByTestId("dashboard-data-mode-badge").textContent).toBe("Simulation");
    expect(screen.getByTestId("route-analysis-label").textContent).toBe("Simulation preview");
    expect(screen.getByTestId("dashboard-data-mode-footer").textContent).toBe("Simulation—no live data");
    expect(screen.getByText("Illustrative live fare")).toBeTruthy();
    expect(screen.getByText("Illustrative route pulse")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Delayed" }));
    expect(screen.getByTestId("simulation-route-status-value").textContent).toContain("Delayed 45 min");
    expect(dashboardResult.data.dataMode.mode).toBe("historical");

    await user.click(screen.getByRole("button", { name: "Exit simulation" }));
    expect(screen.getByTestId("dashboard-data-mode-title").textContent).toBe("Historical data mode");
    expect(screen.getByTestId("dashboard-data-mode-badge").textContent).toBe("Historical data");
    expect(screen.getByTestId("route-analysis-label").textContent).toBe("Historical analysis");
    expect(screen.getByTestId("dashboard-data-mode-footer").textContent).toBe("Validated historical data mode");
    expect(dashboardResult.data.dataMode.mode).toBe("historical");
  });
});
