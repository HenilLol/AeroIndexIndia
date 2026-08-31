import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BellRing,
  ChevronRight,
  Compass,
  Database,
  Loader2,
  Radio,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SimulationModeToggle, SimulationPreview } from "@/components/SimulationPreview";
import { getPresentationDataMode, resolveAsyncPanelState, type PresentationDataMode, type SimulationRouteStatus } from "@/lib/aeroindex-ui";
import { trpc } from "@/lib/trpc";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });

function formatDate(value: Date | string | null | undefined) {
  return value ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "—";
}

function getInitialSimulationStatus(): SimulationRouteStatus {
  if (typeof window === "undefined") return "on-time";
  const status = new URLSearchParams(window.location.search).get("routeStatus");
  return status === "delayed" || status === "cancelled" ? status : "on-time";
}

function DataModeIndicator({
  dataMode,
  onOpenOperations,
  onToggleSimulation,
}: {
  dataMode: PresentationDataMode | undefined;
  onOpenOperations: () => void;
  onToggleSimulation: () => void;
}) {
  if (!dataMode) {
    return <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">Checking data freshness…</div>;
  }

  const isLive = dataMode.mode === "live";
  const isFallback = dataMode.mode === "fallback";
  const isSimulation = dataMode.mode === "simulation";
  const tone = isLive
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : isFallback
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : isSimulation
        ? "border-violet-200 bg-violet-50 text-violet-900"
        : "border-slate-200 bg-slate-100 text-slate-700";
  const title = isLive ? "Live price feed" : isFallback ? "Historical fallback active" : isSimulation ? "Simulation—no live data" : "Historical data mode";
  const Icon = isLive ? Radio : isFallback ? ShieldAlert : isSimulation ? Compass : Database;
  const badge = isLive ? { label: "Live data", className: "border-emerald-300 bg-emerald-100 text-emerald-900" } : isFallback ? { label: "Historical fallback", className: "border-amber-300 bg-amber-100 text-amber-900" } : isSimulation ? { label: "Simulation", className: "border-violet-300 bg-violet-100 text-violet-900" } : { label: "Historical data", className: "border-slate-300 bg-slate-200 text-slate-800" };

  return (
    <div data-testid="dashboard-data-mode" role={isFallback || isSimulation ? "alert" : "status"} aria-live="polite" className={`flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-start sm:justify-between ${tone}`}>
      <div className="flex gap-3">
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${isLive ? "animate-pulse" : ""}`} />
        <div>
          <div className="flex flex-wrap items-center gap-2"><span data-testid="dashboard-data-mode-badge" className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.13em] ${badge.className}`}>{badge.label}</span><p data-testid="dashboard-data-mode-title" className="text-sm font-semibold">{title}</p></div>
          <p className="mt-0.5 max-w-2xl text-xs leading-5 opacity-85">{dataMode.warning ?? `Displayed fares are sourced from ${dataMode.source}.`}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SimulationModeToggle enabled={isSimulation} onToggle={onToggleSimulation} />
        {!isLive && !isSimulation ? (
          <Button variant="outline" size="sm" onClick={onOpenOperations} className="h-8 border-current/25 bg-white/55 text-xs hover:bg-white/80">
            Activate live data
          </Button>
        ) : null}
        <span className="text-xs font-medium opacity-75">
          {dataMode.updatedAt ? `Status checked ${formatDate(dataMode.updatedAt)}` : isSimulation ? "Browser-only preview" : "Validated archive"}
        </span>
      </div>
    </div>
  );
}

function Metric({ label, value, detail, icon: Icon, tone = "indigo" }: { label: string; value: string; detail: string; icon: typeof Activity; tone?: "indigo" | "emerald" | "amber" }) {
  const colors = { indigo: "bg-indigo-50 text-indigo-700", emerald: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700" };
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
        </div>
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${colors[tone]}`}><Icon className="h-5 w-5" /></span>
      </div>
      <p className="mt-3 text-sm text-slate-500">{detail}</p>
    </article>
  );
}

function PanelMessage({ kind, message, retry }: { kind: "loading" | "error" | "empty"; message: string; retry?: () => void }) {
  return (
    <div className="grid min-h-44 place-items-center p-6 text-center">
      <div>
        {kind === "loading" ? <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" /> : kind === "error" ? <Activity className="mx-auto h-7 w-7 text-rose-500" /> : <ShieldCheck className="mx-auto h-7 w-7 text-emerald-500" />}
        <p className="mt-3 max-w-xs text-sm leading-5 text-slate-600">{message}</p>
        {retry ? <Button variant="outline" size="sm" onClick={retry} className="mt-3"><RefreshCw className="mr-1.5 h-3.5 w-3.5" />Retry</Button> : null}
      </div>
    </div>
  );
}

function Panel({ title, label, children }: { title: string; label: string; children: React.ReactNode }) {
  return (
    <article className="min-h-[280px] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03] sm:p-6">
      <p data-testid={title === "Selected route" ? "route-analysis-label" : undefined} className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <h2 className="mt-1 text-lg font-semibold">{title}</h2>
      <div className="mt-5">{children}</div>
    </article>
  );
}

function Datum({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-semibold text-slate-900">{value}</p></div>;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [routeId, setRouteId] = useState<number>();
  const [simulationEnabled, setSimulationEnabled] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("preview") === "live");
  const [simulationRouteStatus, setSimulationRouteStatus] = useState<SimulationRouteStatus>(getInitialSimulationStatus);
  const routeInput = useMemo(() => ({ query: search.trim() || undefined, limit: 12 }), [search]);
  const dashboard = trpc.aeroIndex.public.dashboard.useQuery();
  const routes = trpc.aeroIndex.public.routes.search.useQuery(routeInput);
  const recentFares = trpc.aeroIndex.public.fares.history.useQuery({ limit: 1 });
  const indexHistory = trpc.aeroIndex.public.routes.indexHistory.useQuery({ limit: 12 });
  const analysis = trpc.aeroIndex.public.routes.analytics.useQuery({ routeId: routeId ?? 1 }, { enabled: routeId !== undefined });
  const carriers = trpc.aeroIndex.public.carriers.compare.useQuery({ routeId });
  const alerts = trpc.aeroIndex.public.alerts.list.useQuery({ limit: 5 });

  useEffect(() => {
    if (routeId !== undefined) return;
    const observedRoute = recentFares.data?.items[0]?.routeId;
    const firstRoute = routes.data?.items[0]?.id;
    if (observedRoute ?? firstRoute) setRouteId(observedRoute ?? firstRoute!);
  }, [recentFares.data, routeId, routes.data]);

  const overview = dashboard.data;
  const dataMode = overview?.dataMode;
  const presentationDataMode = getPresentationDataMode(dataMode, simulationEnabled);
  const isSimulation = presentationDataMode?.mode === "simulation";
  const indexData = (indexHistory.data ?? []).map(point => ({ date: new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(point.asOfDate), index: point.indexValue }));
  const indexState = resolveAsyncPanelState({ isLoading: indexHistory.isLoading, hasError: Boolean(indexHistory.error), itemCount: indexData.length });
  const alertsState = resolveAsyncPanelState({ isLoading: alerts.isLoading, hasError: Boolean(alerts.error), itemCount: alerts.data?.length ?? 0 });
  const routeState = resolveAsyncPanelState({ isLoading: routes.isLoading, hasError: Boolean(routes.error), itemCount: routes.data?.items.length ?? 0 });
  const analysisState = resolveAsyncPanelState({ isLoading: analysis.isLoading, hasError: Boolean(analysis.error), itemCount: analysis.data ? 1 : 0 });
  const carrierState = resolveAsyncPanelState({ isLoading: carriers.isLoading, hasError: Boolean(carriers.error), itemCount: carriers.data?.length ?? 0 });
  const rising = (overview?.latestNationalIndex?.changePercent ?? 0) >= 0;
  const observationDetail = isSimulation ? "Simulation only—no provider request" : dataMode?.mode === "live" ? "Recent licensed-feed observation" : "Validated historical observation";

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-950">
      <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between gap-4">
          <a href="#top" className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-sm font-bold text-white shadow-lg shadow-slate-950/15">AI</span><span><b className="block text-sm leading-none">AeroIndex</b><span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">India Market Monitor</span></span></a>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex"><a href="#market">Market view</a><a href="#routes">Routes</a><a href="#alerts">Alerts</a></nav>
          <Button variant="outline" onClick={() => setLocation("/operations")} className="border-slate-300 bg-white">Operations <ArrowUpRight className="ml-1.5 h-4 w-4" /></Button>
        </div>
      </header>
      <main id="top">
        <section className="relative overflow-hidden border-b border-slate-200 bg-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_5%,rgba(199,210,254,0.58),transparent_30%),radial-gradient(circle_at_86%_0%,rgba(186,230,253,0.5),transparent_29%)]" />
          <div className="container relative grid gap-10 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
            <div className="max-w-2xl"><p className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3 py-1.5 text-xs font-semibold text-indigo-700"><Activity className="h-3.5 w-3.5" /> Public airfare intelligence</p><h1 className="mt-5 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">See India’s airfare market with confidence.</h1><p className="mt-5 max-w-xl leading-7 text-slate-600">AeroIndex turns tracked fare observations into transparent route trends, carrier comparisons, and index signals. Every metric identifies whether it is live, historical, or a local interface simulation.</p><Button onClick={() => document.getElementById("routes")?.scrollIntoView({ behavior: "smooth" })} className="mt-7 bg-slate-950 text-white hover:bg-slate-800">Explore routes <ArrowRight className="ml-1.5 h-4 w-4" /></Button></div>
            <article className="self-end rounded-2xl border border-white/80 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/15"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">National airfare index</p>{dashboard.isLoading ? <Loader2 className="mt-8 h-7 w-7 animate-spin text-slate-300" /> : dashboard.error ? <p className="mt-5 text-sm leading-6 text-rose-200">The latest index is temporarily unavailable.</p> : overview?.latestNationalIndex ? <><div className="mt-5 flex items-end gap-3"><p className="text-5xl font-semibold tracking-tight">{overview.latestNationalIndex.value.toFixed(1)}</p><span className="mb-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold">Base 100</span></div><div className="mt-5 flex justify-between border-t border-white/10 pt-4 text-sm"><span className="text-slate-400">As of {formatDate(overview.latestNationalIndex.asOfDate)}</span><span className={rising ? "text-amber-300" : "text-emerald-300"}>{rising ? <TrendingUp className="mr-1 inline h-4 w-4" /> : <TrendingDown className="mr-1 inline h-4 w-4" />}{Math.abs(overview.latestNationalIndex.changePercent).toFixed(1)}%</span></div></> : <p className="mt-5 text-sm leading-6 text-slate-300">A national snapshot appears after valid route-level calculations are available.</p>}</article>
          </div>
        </section>

        <section id="market" className="container py-10 sm:py-14">
          <DataModeIndicator dataMode={presentationDataMode} onOpenOperations={() => setLocation("/settings/integrations")} onToggleSimulation={() => setSimulationEnabled(value => !value)} />
          <SimulationPreview enabled={isSimulation} routeStatusScenario={simulationRouteStatus} onRouteStatusScenarioChange={setSimulationRouteStatus} />
          <div className="mb-5 mt-7"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">Market view</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Latest observation signals</h2></div>
          {dashboard.error ? <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">Market data is temporarily unavailable. <button onClick={() => dashboard.refetch()} className="font-semibold underline">Retry</button></div> : null}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Recent average fare" value={overview?.marketSnapshot.recentAverageFare ? inr.format(overview.marketSnapshot.recentAverageFare) : "—"} detail={observationDetail} icon={BarChart3} /><Metric label="Tracked observations" value={overview ? compact.format(overview.marketSnapshot.recentObservationCount) : "—"} detail={isSimulation ? "Historical values in a live-UI preview" : "Historical fare records available"} icon={Database} tone="emerald" /><Metric label="Market volatility" value={overview ? `${overview.marketSnapshot.recentVolatilityPercent.toFixed(1)}%` : "—"} detail="Recent normalized-fare dispersion" icon={Activity} tone="amber" /><Metric label="Open anomaly flags" value={overview ? String(overview.marketSnapshot.openAlerts) : "—"} detail="Pending operational review" icon={BellRing} /></div>
        </section>

        <section className="container grid gap-5 pb-10 lg:grid-cols-[1.2fr_0.8fr]">
          <Panel title="Historical market index" label="Index history">{indexState === "ready" ? <div className="h-52"><ResponsiveContainer width="100%" height="100%"><LineChart data={indexData} margin={{ left: -18, right: 8 }}><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} /><YAxis domain={["auto", "auto"]} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} /><Tooltip formatter={(value: number) => [value.toFixed(2), "Index"]} /><Line type="monotone" dataKey="index" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div> : <PanelMessage kind={indexState} message={indexState === "error" ? "Index history could not be loaded." : indexState === "empty" ? "No persisted index history is available yet." : "Loading index history…"} retry={indexState === "error" ? () => indexHistory.refetch() : undefined} />}</Panel>
          <Panel title="Recent anomaly flags" label="Alerts">{alertsState === "ready" ? <div className="divide-y divide-slate-100">{alerts.data!.slice(0, 3).map(alert => <div className="py-3" key={alert.id}><span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">{alert.severity}</span><p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-600">{alert.explanation}</p></div>)}</div> : <PanelMessage kind={alertsState} message={alertsState === "error" ? "The anomaly feed could not be loaded." : alertsState === "empty" ? "No anomaly flags are currently in this feed." : "Loading anomaly flags…"} retry={alertsState === "error" ? () => alerts.refetch() : undefined} />}</Panel>
        </section>

        <section id="routes" className="border-y border-slate-200 bg-white py-10 sm:py-14">
          <div className="container">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">Route intelligence</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">Compare the routes that matter</h2>
                <p className="mt-2 text-sm text-slate-600">Search by airport code, airport, or city. The analysis displays {isSimulation ? "a simulated live interface using historical values" : dataMode?.mode === "live" ? "live" : "validated historical"} data.</p>
              </div>
              <label className="relative block w-full sm:w-80">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search AMD, Mumbai, Delhi…" className="h-10 w-full rounded-xl border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" />
              </label>
            </div>
            <div className="mt-7 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
              <article className="overflow-hidden rounded-2xl border border-slate-200">
                <p className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Available routes</p>
                {routeState === "ready" ? (
                  <div className="divide-y divide-slate-100">
                    {routes.data!.items.map(route => (
                      <button key={route.id} onClick={() => setRouteId(route.id)} className={`flex w-full items-center justify-between px-4 py-4 text-left transition hover:bg-slate-50 ${routeId === route.id ? "bg-indigo-50/70" : "bg-white"}`}>
                        <span><b className="text-sm">{route.origin.iataCode} <span className="text-slate-400">→</span> {route.destination.iataCode}</b><span className="mt-1 block text-xs text-slate-500">{route.origin.city} to {route.destination.city}</span></span>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </button>
                    ))}
                  </div>
                ) : <PanelMessage kind={routeState} message={routeState === "error" ? "Route search is temporarily unavailable." : routeState === "empty" ? "No tracked route matches this search." : "Loading tracked routes…"} retry={routeState === "error" ? () => routes.refetch() : undefined} />}
              </article>
              <Panel title="Selected route" label={isSimulation ? "Simulation preview" : dataMode?.mode === "live" ? "Live analysis" : "Historical analysis"}>
                {analysisState === "ready" ? (
                  <>
                    <h3 className="text-xl font-semibold">{analysis.data!.route.origin.iataCode} → {analysis.data!.route.destination.iataCode}</h3>
                    <p className="mt-1 text-sm text-slate-500">{analysis.data!.route.origin.city} to {analysis.data!.route.destination.city} · {analysis.data!.route.distanceKm} km</p>
                    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4"><Datum label="Average" value={analysis.data!.averageFare ? inr.format(analysis.data!.averageFare) : "—"} /><Datum label="Lowest" value={analysis.data!.minimumFare ? inr.format(analysis.data!.minimumFare) : "—"} /><Datum label="Volatility" value={`${analysis.data!.volatilityPercent.toFixed(1)}%`} /><Datum label="Trend" value={`${Math.abs(analysis.data!.trend.percentChange).toFixed(1)}%`} /></div>
                    <p className="mt-6 text-xs text-slate-500">{isSimulation ? "Preview only—" : ""}{analysis.data!.observationCount} valid observations included.</p>
                  </>
                ) : <PanelMessage kind={analysisState} message={analysisState === "error" ? "Route analysis could not be loaded." : routeState === "empty" ? "Select an available route to view its analysis." : "Loading route analysis…"} retry={analysisState === "error" ? () => analysis.refetch() : undefined} />}
              </Panel>
            </div>
          </div>
        </section>

        <section id="alerts" className="container py-10 sm:py-14"><div className="mb-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">Carrier comparison</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Price position by carrier</h2></div><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.03]"><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"><tr><th className="px-5 py-3">Carrier</th><th className="px-5 py-3">Observations</th><th className="px-5 py-3">Average fare</th><th className="px-5 py-3">Range</th><th className="px-5 py-3">Volatility</th><th className="px-5 py-3">Trend</th></tr></thead><tbody className="divide-y divide-slate-100">{carrierState === "ready" ? carriers.data!.map(carrier => <tr key={carrier.carrierId}><td className="px-5 py-4 font-semibold">{carrier.carrierName} <span className="text-xs font-medium text-slate-400">{carrier.iataCode}</span></td><td className="px-5 py-4 text-slate-600">{carrier.observationCount}</td><td className="px-5 py-4 font-medium">{inr.format(carrier.averageFare)}</td><td className="px-5 py-4 text-slate-600">{inr.format(carrier.minimumFare)} – {inr.format(carrier.maximumFare)}</td><td className="px-5 py-4 text-slate-600">{carrier.volatilityPercent.toFixed(1)}%</td><td className="px-5 py-4 text-slate-600">{Math.abs(carrier.trend.percentChange).toFixed(1)}%</td></tr>) : <tr><td colSpan={6}><PanelMessage kind={carrierState} message={carrierState === "error" ? "Carrier comparison could not be loaded." : carrierState === "empty" ? "Carrier comparisons will appear as validated observations are ingested." : "Loading carrier comparison…"} retry={carrierState === "error" ? () => carriers.refetch() : undefined} /></td></tr>}</tbody></table></div></div></section>
      </main>
      <footer className="border-t border-slate-200 bg-white"><div className="container flex flex-col gap-2 py-6 text-xs text-slate-500 sm:flex-row sm:justify-between"><span>© AeroIndex India · Public airfare market intelligence</span><span data-testid="dashboard-data-mode-footer">{isSimulation ? "Simulation—no live data" : dataMode?.mode === "live" ? "Live licensed feed active" : "Validated historical data mode"}</span></div></footer>
    </div>
  );
}
