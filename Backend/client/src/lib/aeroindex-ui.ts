export type AsyncPanelState = "loading" | "error" | "empty" | "ready";

export function resolveAsyncPanelState(input: { isLoading: boolean; hasError: boolean; itemCount: number }): AsyncPanelState {
  if (input.isLoading) return "loading";
  if (input.hasError) return "error";
  if (input.itemCount === 0) return "empty";
  return "ready";
}

export function getSourceHealth(input: { isActive: boolean; lastIngestedAt: Date | string | null }) {
  if (!input.isActive) return { label: "Paused", tone: "muted" as const };
  if (!input.lastIngestedAt) return { label: "Awaiting data", tone: "warning" as const };
  const ageHours = (Date.now() - new Date(input.lastIngestedAt).getTime()) / 3_600_000;
  if (ageHours > 48) return { label: "Stale", tone: "danger" as const };
  return { label: "Healthy", tone: "success" as const };
}

export type ServerDataMode = {
  mode: "live" | "historical" | "fallback";
  source: string;
  updatedAt: Date | null;
  warning: string | null;
};

export type PresentationDataMode = ServerDataMode | {
  mode: "simulation";
  source: "Local UI simulation";
  updatedAt: null;
  warning: string;
};

export type SimulationRouteStatus = "on-time" | "delayed" | "cancelled";

const simulatedRouteStatusStates: Record<SimulationRouteStatus, { value: string; detail: string }> = {
  "on-time": {
    value: "SIM-106 · On time",
    detail: "Illustrative scheduled flight-status display only; no airline location is requested or shown.",
  },
  delayed: {
    value: "SIM-106 · Delayed 45 min",
    detail: "Illustrative delay display only; no provider status is requested, persisted, or used in fare analysis.",
  },
  cancelled: {
    value: "SIM-106 · Cancelled",
    detail: "Illustrative cancellation display only; no provider status is requested, persisted, or used in fare analysis.",
  },
};

export function getPresentationDataMode(dataMode: ServerDataMode | undefined, simulationEnabled: boolean): PresentationDataMode | undefined {
  if (simulationEnabled) {
    return {
      mode: "simulation",
      source: "Local UI simulation",
      updatedAt: null,
      warning: "Simulation only. Illustrative values are shown to preview live-data UI states; no provider request, ingestion, or index calculation has occurred.",
    };
  }
  return dataMode;
}

export function getSimulatedLivePreview(routeStatus: SimulationRouteStatus = "on-time") {
  return {
    label: "Simulation—no live data",
    livePrice: {
      label: "Illustrative live fare",
      value: "₹6,980",
      detail: "Example provider offer display only; no fare observation is stored.",
    },
    routeStatus: {
      label: "Illustrative route pulse",
      ...simulatedRouteStatusStates[routeStatus],
    },
  } as const;
}

export const integrationSettingsGuidance = {
  secureSettingsPath: "Management UI → Settings → Secrets",
  noBrowserSecretInput: true,
  noSecretValueRendered: true,
  instructions: "Save provider-issued keys in the managed secure settings interface, then validate access from Operations.",
} as const;
