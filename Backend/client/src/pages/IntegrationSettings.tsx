import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { SecureIntegrationSettingsPanel } from "@/components/SecureIntegrationSettingsPanel";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

export default function IntegrationSettings() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const isAdmin = user?.role === "admin";
  const skyscanner = trpc.aeroIndex.admin.providers.skyscannerStatus.useQuery(undefined, { enabled: isAdmin });
  const aviationEdge = trpc.aeroIndex.admin.providers.aviationEdgeStatus.useQuery(undefined, { enabled: isAdmin });

  if (loading) return <div className="grid min-h-screen place-items-center bg-slate-50"><Loader2 className="h-7 w-7 animate-spin text-slate-400" /></div>;
  if (!user) return <AccessMessage title="Administrator sign-in required" detail="Secure provider settings are available only after you sign in as an AeroIndex administrator." action="Continue with OAuth" onClick={() => startLogin()} />;
  if (!isAdmin) return <AccessMessage title="Administrator access required" detail="Your account does not have the administrator role needed to view provider settings." action="Return to market view" onClick={() => setLocation("/")} />;

  return <DashboardLayout><SecureIntegrationSettingsPanel onBack={() => setLocation("/operations")} providers={[
    { name: "Skyscanner Flights Live Prices", purpose: "Licensed fare offers for future live-price observations and fare-index ingestion.", configured: Boolean(skyscanner.data?.configured), enabled: Boolean(skyscanner.data?.enabled), note: skyscanner.data?.reason ?? "Checking server-side provider status…" },
    { name: "Aviation Edge Flight Tracker", purpose: "Licensed airline routes, airport timetable, and flight-status enrichment; it does not change fare-index data.", configured: Boolean(aviationEdge.data?.configured), enabled: Boolean(aviationEdge.data?.enabled), note: aviationEdge.data?.reason ?? "Checking server-side provider status…" },
  ]} /></DashboardLayout>;
}

function AccessMessage({ title, detail, action, onClick }: { title: string; detail: string; action: string; onClick: () => void }) {
  return <div className="grid min-h-screen place-items-center bg-slate-50 p-6"><div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-950/5"><ShieldAlert className="mx-auto h-9 w-9 text-amber-600" /><h1 className="mt-4 text-2xl font-semibold tracking-tight">{title}</h1><p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p><Button onClick={onClick} className="mt-6 bg-slate-950 text-white hover:bg-slate-800"><ShieldCheck className="mr-2 h-4 w-4" />{action}</Button></div></div>;
}
