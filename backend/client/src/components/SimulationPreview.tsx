import React from "react";
import { CircleAlert, Compass, Plane, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSimulatedLivePreview, type SimulationRouteStatus } from "@/lib/aeroindex-ui";

export function SimulationModeToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return <Button variant="outline" size="sm" onClick={onToggle} className="h-8 border-current/25 bg-white/55 text-xs hover:bg-white/80">{enabled ? "Exit simulation" : "Preview live UI"}</Button>;
}

const scenarioOptions: Array<{ value: SimulationRouteStatus; label: string }> = [
  { value: "on-time", label: "On time" },
  { value: "delayed", label: "Delayed" },
  { value: "cancelled", label: "Cancelled" },
];

export function SimulationPreview({
  enabled,
  routeStatusScenario = "on-time",
  onRouteStatusScenarioChange = () => undefined,
}: {
  enabled: boolean;
  routeStatusScenario?: SimulationRouteStatus;
  onRouteStatusScenarioChange?: (scenario: SimulationRouteStatus) => void;
}) {
  if (!enabled) return null;
  const preview = getSimulatedLivePreview(routeStatusScenario);
  const statusTone = routeStatusScenario === "cancelled" ? "text-rose-700" : routeStatusScenario === "delayed" ? "text-amber-700" : "text-emerald-700";
  const StatusIcon = routeStatusScenario === "cancelled" ? XCircle : routeStatusScenario === "delayed" ? CircleAlert : Plane;

  return (
    <div data-testid="simulation-preview" className="mt-4">
      <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm leading-6 text-violet-900">
        <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-violet-300 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-violet-800">Simulation only</span><b>Preview mode is on.</b></div>
        <p className="mt-1">The interface is demonstrating how licensed live-pricing and route-status UI will appear. All values remain the validated historical dataset; no provider request, ingestion, index recalculation, or anomaly decision is performed.</p>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm shadow-violet-950/[0.05]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">{preview.label}</p>
          <p className="mt-3 text-sm font-semibold text-slate-900">{preview.livePrice.label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-violet-900">{preview.livePrice.value}</p>
          <p className="mt-2 text-xs leading-5 text-slate-600">{preview.livePrice.detail}</p>
        </article>
        <article data-testid="simulation-route-status-card" className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm shadow-violet-950/[0.05]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">{preview.label}</p>
          <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-900"><Compass className="h-4 w-4 text-violet-700" />{preview.routeStatus.label}</p>
          <p data-testid="simulation-route-status-value" aria-live="polite" className={`mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight ${statusTone}`}><StatusIcon className="h-5 w-5" />{preview.routeStatus.value}</p>
          <p className="mt-2 text-xs leading-5 text-slate-600">{preview.routeStatus.detail}</p>
          <fieldset className="mt-4 border-t border-slate-100 pt-4">
            <legend className="text-xs font-semibold text-slate-700">Preview route-status scenario</legend>
            <div role="group" aria-label="Preview route-status scenario" className="mt-2 flex flex-wrap gap-2">
              {scenarioOptions.map(option => <Button key={option.value} type="button" variant="outline" size="sm" aria-pressed={routeStatusScenario === option.value} onClick={() => onRouteStatusScenarioChange(option.value)} className={`h-8 text-xs ${routeStatusScenario === option.value ? "border-violet-500 bg-violet-50 text-violet-900 hover:bg-violet-100" : "border-slate-200 bg-white text-slate-600"}`}>{option.label}</Button>)}
            </div>
          </fieldset>
        </article>
      </div>
    </div>
  );
}
