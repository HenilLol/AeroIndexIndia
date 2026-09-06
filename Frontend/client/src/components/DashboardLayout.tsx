/** Style: Aviation Operations Room — a persistent analyst or admin command rail, telemetry header, and Aero Teal monitored-airspace signals. */
import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { Activity, BarChart3, BookOpen, ChartNoAxesCombined, CircleHelp, ClipboardCheck, Database, FileText, Gauge, Keyboard, LayoutDashboard, Menu, Radar, Route, Settings, ShieldCheck, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { Brand } from "@/components/Brand";
import { ThemeToggle } from "@/components/analytics";
import { trackEngagement } from "@/lib/engagement";
import { displayShortcut, matchesShortcut, useShortcuts } from "@/contexts/ShortcutsContext";

type LayoutProps = { children: ReactNode; title: string; eyebrow?: string; role?: "analyst" | "admin"; onOpenInsight: () => void };

const analystGroups = [
  { label: "Overview", items: [{ label: "Dashboard", path: "/app/dashboard", icon: LayoutDashboard }] },
  { label: "Airfare index", items: [{ label: "National index", path: "/app/national-index", icon: ChartNoAxesCombined }, { label: "Route analysis", path: "/app/route-analysis", icon: Route }, { label: "Booking window", path: "/app/booking-window", icon: Activity }, { label: "Real-time vs reference", path: "/app/reference-index", icon: BarChart3 }] },
  { label: "CPI intelligence", items: [{ label: "CPI compatibility", path: "/app/cpi-compatibility", icon: ShieldCheck }, { label: "Synthetic basket", path: "/app/synthetic-basket", icon: Radar }, { label: "Smart route selection", path: "/app/route-selection", icon: SlidersHorizontal }] },
  { label: "Airfare insights", items: [{ label: "Inflation heatmap", path: "/app/heatmap", icon: Gauge }, { label: "Anomaly monitor", path: "/app/anomaly-monitor", icon: Activity }, { label: "Price explanations", path: "/app/price-explanations", icon: CircleHelp }] },
  { label: "Data management", items: [{ label: "Data quality", path: "/app/data-quality", icon: ClipboardCheck }, { label: "Data explorer", path: "/app/data-explorer", icon: Database }, { label: "Audit trail", path: "/app/audit-trail", icon: FileText }] },
];

const adminGroups = [
  { label: "System control", items: [{ label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard }, { label: "Pipeline monitor", path: "/admin/pipeline", icon: Activity }, { label: "Ingestion jobs", path: "/admin/ingestion", icon: Database }, { label: "System health", path: "/admin/health", icon: Gauge }] },
  { label: "Governance", items: [{ label: "Users & permissions", path: "/admin/users", icon: ShieldCheck }, { label: "Audit logs", path: "/admin/audit-logs", icon: FileText }, { label: "Security", path: "/admin/security", icon: Radar }, { label: "Settings", path: "/admin/settings", icon: Settings }] },
];

export function DashboardLayout({ children, title, eyebrow = "AeroIndex India", role = "analyst", onOpenInsight }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { shortcuts } = useShortcuts();
  const groups = role === "admin" ? adminGroups : analystGroups;
  const isAdmin = role === "admin";
  useEffect(() => {
    if (isAdmin) return;
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName || "")) return;
      if (matchesShortcut(event, shortcuts.shortcutReference)) { event.preventDefault(); setShortcutsOpen((current) => { const next = !current; trackEngagement("analyst_shortcut_reference_toggled", { source: "keyboard", open: next, shortcut: shortcuts.shortcutReference }); return next; }); }
      if (matchesShortcut(event, shortcuts.signalDesk)) { event.preventDefault(); trackEngagement("analyst_shortcut_navigation", { shortcut: shortcuts.signalDesk, destination: "/app/dashboard" }); setLocation("/app/dashboard"); }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [isAdmin, setLocation, shortcuts.shortcutReference, shortcuts.signalDesk]);
  return <div className={`app-shell ${isAdmin ? "admin-shell" : ""}`}>
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
      <div className="sidebar-atmosphere" aria-hidden="true" />
      <div className="relative flex items-center justify-between px-5 pt-6">
        <Brand compact={false} onClick={() => setLocation(isAdmin ? "/admin/dashboard" : "/app/dashboard")} />
        <button className="icon-button lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X className="h-4 w-4" /></button>
      </div>
      {isAdmin ? <div className="admin-side-telemetry"><div className="flex items-center justify-between"><span>CONTROL PLANE</span><i /></div><strong>SYS-AIX / NODE-IND-01</strong><small>Operations rail online · 8 governed services</small><div className="admin-side-waypoints"><b>01</b><em /><b>02</b><em /><b>03</b></div></div> : <div className="relative mx-5 mt-6 rounded-xl border border-primary/20 bg-primary/7 px-3 py-2.5"><p className="text-[10px] font-bold tracking-[.16em] text-primary">ACTIVE WORKSPACE</p><p className="mt-1 text-xs font-semibold text-sidebar-foreground">MoSPI Data Analyst</p></div>}
      <nav className="sidebar-nav relative">{groups.map((group) => <div className="nav-group" key={group.label}><p>{group.label}</p>{group.items.map((item) => { const Icon = item.icon; const active = location === item.path; return <button key={item.path} className={`nav-item ${active ? "active" : ""}`} onClick={() => { setLocation(item.path); setMobileOpen(false); }}><Icon className="h-4 w-4" />{item.label}{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_9px_#5FE0CF]" />}</button> })}</div>)}</nav>
      <div className="sidebar-footer relative"><button onClick={() => setLocation("/")} className="nav-item"><BookOpen className="h-4 w-4" />Public product site</button>{isAdmin ? <button onClick={() => setLocation("/app/dashboard")} className="nav-item"><FileText className="h-4 w-4" />Analyst signal desk</button> : <button onClick={() => setLocation("/admin/dashboard")} className="nav-item"><ShieldCheck className="h-4 w-4" />System admin</button>}<p className="mt-3 px-3 text-[10px] text-muted-foreground">Built by The Gorillaz</p></div>
    </aside>
    <div className={`sidebar-scrim ${mobileOpen ? "visible" : ""}`} onClick={() => setMobileOpen(false)} />
    <main className="analysis-canvas"><header className="topbar"><div className="flex items-center gap-3"><button onClick={() => setMobileOpen(true)} className="icon-button lg:hidden" aria-label="Open navigation"><Menu className="h-4 w-4" /></button><div><p className="data-label">{eyebrow}</p><h1 className="mt-1 font-display text-xl font-semibold tracking-tight">{title}</h1></div></div><div className="flex items-center gap-2"><span className="hidden items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-xs font-medium text-primary md:flex"><span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_#5FE0CF]" />{isAdmin ? "Control plane online" : "Airspace signal active · MoSPI"}</span>{!isAdmin && <button className="shortcut-trigger" onClick={() => setShortcutsOpen((current) => { const next = !current; trackEngagement("analyst_shortcut_reference_toggled", { source: "control", open: next }); return next; })} aria-expanded={shortcutsOpen} aria-controls="analyst-shortcut-reference"><Keyboard className="h-3.5 w-3.5" /><span className="hidden sm:inline">Shortcuts</span><kbd>{displayShortcut(shortcuts.shortcutReference)}</kbd></button>}<ThemeToggle /><button onClick={onOpenInsight} className="aeroinsight-trigger"><Sparkles className="h-4 w-4" /><span className="hidden sm:inline">AeroInsight</span></button><button onClick={() => setLocation("/")} className="user-avatar" title="Return to public site">AI</button></div></header>{!isAdmin && <aside id="analyst-shortcut-reference" className={`analyst-shortcut-panel ${shortcutsOpen ? "open" : ""}`} aria-label="Available analyst keyboard shortcuts"><div className="shortcut-panel-head"><div><p className="data-label">Command reference</p><strong>Keyboard shortcuts</strong></div><button className="icon-button" onClick={() => setShortcutsOpen(false)} aria-label="Close keyboard shortcuts"><X className="h-3.5 w-3.5" /></button></div><div className="shortcut-list"><span><kbd>{displayShortcut(shortcuts.ambientMotion)}</kbd><em>Toggle ambient flight motion</em></span><span><kbd>{displayShortcut(shortcuts.signalDesk)}</kbd><em>Go to National Signal Desk</em></span><span><kbd>{displayShortcut(shortcuts.shortcutReference)}</kbd><em>Show or hide this reference</em></span><span><kbd>{displayShortcut(shortcuts.commandPalette)}</kbd><em>Open global command navigation</em></span></div><p>Shortcuts pause while typing or using selectors.</p></aside>}<section className="analysis-content">{children}</section></main>
  </div>;
}
