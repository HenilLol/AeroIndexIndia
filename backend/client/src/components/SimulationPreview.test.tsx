// @vitest-environment jsdom
import React, { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { getPresentationDataMode } from "@/lib/aeroindex-ui";
import { SimulationModeToggle, SimulationPreview } from "./SimulationPreview";

function SimulationHarness() {
  const [enabled, setEnabled] = useState(false);
  const [routeStatusScenario, setRouteStatusScenario] = useState<"on-time" | "delayed" | "cancelled">("on-time");
  const serverMode = { mode: "historical" as const, source: "Validated archive", updatedAt: null, warning: "Live provider updates are not active." };
  const presentationMode = getPresentationDataMode(serverMode, enabled);
  return <div><p data-testid="presentation-mode">{presentationMode?.mode}</p><p data-testid="server-mode">{serverMode.mode}</p><SimulationModeToggle enabled={enabled} onToggle={() => setEnabled(value => !value)} /><SimulationPreview enabled={enabled} routeStatusScenario={routeStatusScenario} onRouteStatusScenarioChange={setRouteStatusScenario} /></div>;
}

describe("SimulationPreview", () => {
  it("toggles an explicit local simulation presentation without changing server historical mode", async () => {
    const user = userEvent.setup();
    render(<SimulationHarness />);
    expect(screen.getByTestId("presentation-mode").textContent).toBe("historical");
    expect(screen.queryByTestId("simulation-preview")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Preview live UI" }));
    expect(screen.getByTestId("presentation-mode").textContent).toBe("simulation");
    expect(screen.getByTestId("server-mode").textContent).toBe("historical");
    expect(screen.getByTestId("simulation-preview")).toBeTruthy();
    expect(screen.getAllByText("Simulation—no live data")).toHaveLength(2);
    expect(screen.getByText(/no provider request, ingestion/i)).toBeTruthy();
    expect(screen.getByTestId("simulation-route-status-value").textContent).toContain("On time");
    expect(screen.getByRole("button", { name: "On time" }).getAttribute("aria-pressed")).toBe("true");

    await user.click(screen.getByRole("button", { name: "Delayed" }));
    expect(screen.getByTestId("simulation-route-status-value").textContent).toContain("Delayed 45 min");
    expect(screen.getByRole("button", { name: "Delayed" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByTestId("server-mode").textContent).toBe("historical");

    await user.click(screen.getByRole("button", { name: "Cancelled" }));
    expect(screen.getByTestId("simulation-route-status-value").textContent).toContain("Cancelled");
    expect(screen.getByRole("button", { name: "Cancelled" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByTestId("server-mode").textContent).toBe("historical");
    await user.click(screen.getByRole("button", { name: "Exit simulation" }));
    expect(screen.queryByTestId("simulation-preview")).toBeNull();
    expect(screen.getByTestId("presentation-mode").textContent).toBe("historical");
  });
});
