// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SecureIntegrationSettingsPanel } from "./SecureIntegrationSettingsPanel";

describe("SecureIntegrationSettingsPanel", () => {
  afterEach(() => cleanup());

  it("shows secure provider guidance without rendering a browser-side secret input or value", () => {
    render(<SecureIntegrationSettingsPanel onBack={vi.fn()} providers={[{ name: "Aviation Edge Flight Tracker", purpose: "Flight-status enrichment.", configured: false, enabled: false, note: "No provider key is configured." }]} />);
    expect(screen.getByTestId("secure-integration-settings")).toBeTruthy();
    expect(screen.getByText(/Management UI → Settings → Secrets/)).toBeTruthy();
    expect(screen.getByText(/API-key input/i)).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByDisplayValue(/key/i)).toBeNull();
  });

  it("guides administrators through secure activation steps without rendering a key field", async () => {
    const user = userEvent.setup();
    render(<SecureIntegrationSettingsPanel onBack={vi.fn()} providers={[]} />);

    await user.click(screen.getByTestId("start-activation-tour"));
    expect(screen.getByTestId("activation-tour-title").textContent).toBe("Save licensed provider credentials securely");
    expect(screen.getAllByText(/Management UI → Settings → Secrets/)).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByTestId("activation-tour-title").textContent).toBe("Return to Operations and validate access");
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByTestId("activation-tour-title").textContent).toBe("Activate only after a successful validation");
    expect(screen.queryByRole("textbox")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Finish tour" }));
    expect(screen.getByTestId("start-activation-tour")).toBeTruthy();
  });
});
