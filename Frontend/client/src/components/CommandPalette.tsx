/** Style: Aviation Operations Room — global command navigation is compact, keyboard-first, and grouped by product context. */
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Activity, BarChart3, BookOpen, ChartNoAxesCombined, Database, Gauge, LayoutDashboard, LogIn, Radar, Route, Settings, ShieldCheck, Sparkles, UserPlus } from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@/components/ui/command";
import { trackEngagement } from "@/lib/engagement";
import { displayShortcut, matchesShortcut, useShortcuts } from "@/contexts/ShortcutsContext";

type CommandRoute = { label: string; path: string; icon: React.ElementType; workspace: "public" | "analyst" | "admin" };
const commands: CommandRoute[] = [
  { label: "Public landing", path: "/", icon: Sparkles, workspace: "public" }, { label: "Sign in", path: "/login", icon: LogIn, workspace: "public" }, { label: "Request access", path: "/signup", icon: UserPlus, workspace: "public" }, { label: "Visual style guide", path: "/style-guide", icon: BookOpen, workspace: "public" },
  { label: "National Signal Desk", path: "/app/dashboard", icon: LayoutDashboard, workspace: "analyst" }, { label: "National Airfare Index", path: "/app/national-index", icon: ChartNoAxesCombined, workspace: "analyst" }, { label: "Route Analysis", path: "/app/route-analysis", icon: Route, workspace: "analyst" }, { label: "Inflation Heatmap", path: "/app/heatmap", icon: Gauge, workspace: "analyst" }, { label: "Anomaly Monitor", path: "/app/anomaly-monitor", icon: Activity, workspace: "analyst" }, { label: "Data Explorer", path: "/app/data-explorer", icon: Database, workspace: "analyst" },
  { label: "System Control", path: "/admin/dashboard", icon: LayoutDashboard, workspace: "admin" }, { label: "Pipeline Monitor", path: "/admin/pipeline", icon: Activity, workspace: "admin" }, { label: "Ingestion Jobs", path: "/admin/ingestion", icon: Database, workspace: "admin" }, { label: "System Health", path: "/admin/health", icon: Gauge, workspace: "admin" }, { label: "Access Governance", path: "/admin/users", icon: ShieldCheck, workspace: "admin" }, { label: "Control Configuration", path: "/admin/settings", icon: Settings, workspace: "admin" }, { label: "Security Controls", path: "/admin/security", icon: Radar, workspace: "admin" },
];

const labels: Record<CommandRoute["workspace"], string> = { public: "Public product", analyst: "Analyst signal desk", admin: "System control" };

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { shortcuts } = useShortcuts();
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (matchesShortcut(event, shortcuts.commandPalette)) { event.preventDefault(); setOpen((current) => { const next = !current; if (next) trackEngagement("command_palette_opened", { trigger: "keyboard", shortcut: shortcuts.commandPalette }); return next; }); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts.commandPalette]);
  const go = (command: CommandRoute) => { trackEngagement("command_palette_navigation", { destination: command.path, workspace: command.workspace }); setLocation(command.path); setOpen(false); };
  return <CommandDialog open={open} onOpenChange={setOpen} title="AeroIndex command navigation" description="Navigate between public product, analyst, and system control workspaces." className="command-palette-dialog"><CommandInput placeholder="Search routes and workspaces…" /><CommandList><CommandEmpty>No command route found.</CommandEmpty>{(["public", "analyst", "admin"] as const).map((workspace, index) => <div key={workspace}>{index > 0 && <CommandSeparator />}<CommandGroup heading={labels[workspace]}>{commands.filter((command) => command.workspace === workspace).map((command) => { const Icon = command.icon; return <CommandItem key={command.path} value={`${command.label} ${command.workspace}`} onSelect={() => go(command)}><Icon className="h-4 w-4" /><span>{command.label}</span><CommandShortcut>{workspace === "analyst" ? "SIGNAL" : workspace === "admin" ? "CONTROL" : "PUBLIC"}</CommandShortcut></CommandItem>; })}</CommandGroup></div>)}</CommandList><div className="command-palette-footer"><kbd>{displayShortcut(shortcuts.commandPalette)}</kbd><p>Navigate every AeroIndex context</p></div></CommandDialog>;
}
