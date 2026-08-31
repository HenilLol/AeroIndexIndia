/** Style: Aviation Operations Room — separated public/auth thresholds feeding a connected, dark analyst command center. */
import { useEffect, useState } from "react";
import { Route, Switch, useLocation } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { MotionProvider } from "@/contexts/MotionContext";
import { ShortcutsProvider } from "@/contexts/ShortcutsContext";
import { CommandPalette } from "@/components/CommandPalette";
import { ROUTES, type RouteRecord } from "@/data/mockData";
import { useAeroIndexData } from "@/hooks/useAeroIndexData";
import AuthPage from "@/pages/AuthPage";
import LandingPage from "@/pages/LandingPage";
import NotFound from "@/pages/NotFound";
import StyleGuidePage from "@/pages/StyleGuidePage";
import { AnalystDashboard, DataWorkspace, IndexWorkspace, InsightsWorkspace, RouteDetailPage } from "@/pages/WorkspacePages";
import { AdminOverviewPage, AdminSettingsPage, AuditLogsPage, IngestionJobsPage, PipelineMonitorPage, SecurityPage, SystemHealthPage, UsersPermissionsPage } from "@/pages/AdminPages";

function AnalystWorkspace() {
  const [location] = useLocation();
  const live = useAeroIndexData();
  const [routes, setRoutes] = useState<RouteRecord[]>(ROUTES);
  const [selectedRoute, setSelectedRoute] = useState<RouteRecord>(ROUTES[0]);
  useEffect(() => {
    if (live.routes.length === 0) return;
    setRoutes(current => live.routes.map(route => {
      const previous = current.find(item => item.id === route.id);
      return { ...route, included: previous?.included ?? route.included };
    }));
    setSelectedRoute(current => live.routes.find(route => route.id === current.id) || live.routes[0]);
  }, [live.routes]);
  const [insightOpen, setInsightOpen] = useState(false);
  const updateRoute = (route: RouteRecord) => { setRoutes((current) => current.map((item) => item.id === route.id ? { ...item, included: !item.included } : item)); setSelectedRoute((current) => current.id === route.id ? { ...current, included: !current.included } : current); };
  const shared = { dashboardData: live.data?.dashboard, routes, selectedRoute, onSelectRoute: setSelectedRoute, onToggleBasket: updateRoute, insightOpen, onOpenInsight: () => setInsightOpen(true), onCloseInsight: () => setInsightOpen(false) };
  if (live.isLoading && live.routes.length === 0) return <DashboardLayout title="National Signal Desk" onOpenInsight={() => setInsightOpen(true)}><div className="surface p-8"><p className="data-label">AeroIndex India / live connection</p><h2 className="mt-2 font-display text-2xl font-semibold">Loading market data…</h2><p className="mt-2 text-sm text-muted-foreground">Connecting the existing dashboard to the AeroIndex backend.</p></div></DashboardLayout>;
  if (live.error && live.routes.length === 0) return <DashboardLayout title="National Signal Desk" onOpenInsight={() => setInsightOpen(true)}><div className="surface p-8"><p className="data-label text-[#ee7e65]">Backend connection error</p><h2 className="mt-2 font-display text-2xl font-semibold">Unable to connect to AeroIndex backend.</h2><p className="mt-2 text-sm text-muted-foreground">{live.error}</p><button onClick={() => void live.refresh()} className="button-primary mt-5">Retry connection</button></div></DashboardLayout>;
  const titleMap: Record<string, string> = { "/app/dashboard": "National Signal Desk", "/app/national-index": "National Airfare Index", "/app/route-analysis": "Route Analysis", "/app/booking-window": "Booking Window Analysis", "/app/reference-index": "Real-Time vs Reference", "/app/cpi-compatibility": "CPI Compatibility", "/app/synthetic-basket": "India Synthetic Airfare Basket", "/app/route-selection": "Smart Route Selection", "/app/heatmap": "Airfare Inflation Heatmap", "/app/anomaly-monitor": "Anomaly Monitor", "/app/price-explanations": "Explainable Price Changes", "/app/data-quality": "Data Quality", "/app/data-explorer": "Data Explorer", "/app/audit-trail": "Data Audit Trail" };
  return <DashboardLayout title={titleMap[location] || "National Signal Desk"} onOpenInsight={() => setInsightOpen(true)}><Switch><Route path="/app/dashboard">{() => <AnalystDashboard {...shared} />}</Route><Route path="/app/national-index">{() => <IndexWorkspace {...shared} kind="national" />}</Route><Route path="/app/route-analysis">{() => <RouteDetailPage {...shared} />}</Route><Route path="/app/booking-window">{() => <IndexWorkspace {...shared} kind="booking" />}</Route><Route path="/app/reference-index">{() => <IndexWorkspace {...shared} kind="reference" />}</Route><Route path="/app/cpi-compatibility">{() => <IndexWorkspace {...shared} kind="compatibility" />}</Route><Route path="/app/synthetic-basket">{() => <IndexWorkspace {...shared} kind="basket" />}</Route><Route path="/app/route-selection">{() => <IndexWorkspace {...shared} kind="selection" />}</Route><Route path="/app/heatmap">{() => <InsightsWorkspace {...shared} kind="heatmap" />}</Route><Route path="/app/anomaly-monitor">{() => <InsightsWorkspace {...shared} kind="anomaly" />}</Route><Route path="/app/price-explanations">{() => <InsightsWorkspace {...shared} kind="explanations" />}</Route><Route path="/app/data-quality">{() => <DataWorkspace {...shared} kind="quality" />}</Route><Route path="/app/data-explorer">{() => <DataWorkspace {...shared} kind="explorer" />}</Route><Route path="/app/audit-trail">{() => <DataWorkspace {...shared} kind="audit" />}</Route><Route>{() => <AnalystDashboard {...shared} />}</Route></Switch></DashboardLayout>;
}

function AdministratorWorkspace() {
  const [location] = useLocation();
  const [insightOpen, setInsightOpen] = useState(false);
  const titleMap: Record<string, string> = { "/admin/dashboard": "System Control", "/admin/pipeline": "Pipeline Monitor", "/admin/ingestion": "Ingestion Jobs", "/admin/health": "System Health", "/admin/users": "Users & Permissions", "/admin/audit-logs": "Audit Logs", "/admin/security": "Security", "/admin/settings": "Settings" };
  const shared = { routes: ROUTES, selectedRoute: ROUTES[3], insightOpen, onOpenInsight: () => setInsightOpen(true), onCloseInsight: () => setInsightOpen(false) };
  return <DashboardLayout role="admin" title={titleMap[location] || "System Control"} eyebrow="AeroIndex India / System Admin" onOpenInsight={() => setInsightOpen(true)}><Switch><Route path="/admin/dashboard">{() => <AdminOverviewPage {...shared} />}</Route><Route path="/admin/pipeline">{() => <PipelineMonitorPage {...shared} />}</Route><Route path="/admin/ingestion">{() => <IngestionJobsPage {...shared} />}</Route><Route path="/admin/health">{() => <SystemHealthPage {...shared} />}</Route><Route path="/admin/users">{() => <UsersPermissionsPage {...shared} />}</Route><Route path="/admin/audit-logs">{() => <AuditLogsPage {...shared} />}</Route><Route path="/admin/security">{() => <SecurityPage {...shared} />}</Route><Route path="/admin/settings">{() => <AdminSettingsPage {...shared} />}</Route><Route>{() => <AdminOverviewPage {...shared} />}</Route></Switch></DashboardLayout>;
}

function Router() {
  return <Switch><Route path="/" component={LandingPage} /><Route path="/style-guide" component={StyleGuidePage} /><Route path="/login">{() => <AuthPage mode="login" />}</Route><Route path="/signup">{() => <AuthPage mode="signup" />}</Route><Route path="/app/:rest*">{() => <AnalystWorkspace />}</Route><Route path="/admin/:rest*">{() => <AdministratorWorkspace />}</Route><Route component={NotFound} /></Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="dark" switchable><ShortcutsProvider><MotionProvider><TooltipProvider><Toaster /><Router /><CommandPalette /></TooltipProvider></MotionProvider></ShortcutsProvider></ThemeProvider></ErrorBoundary>;
}
