import React, { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, LockKeyhole, Radio, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { integrationSettingsGuidance } from "@/lib/aeroindex-ui";

export type ProviderSettingsSummary = {
  name: string;
  purpose: string;
  configured: boolean;
  enabled: boolean;
  note: string;
};

const activationSteps = [
  {
    title: "Save licensed provider credentials securely",
    detail: <>Open <b>{integrationSettingsGuidance.secureSettingsPath}</b> and add only provider-issued server variables. This application never accepts or displays a key value.</>,
  },
  {
    title: "Return to Operations and validate access",
    detail: <>Use the protected provider validation control to check the configured server-side credential. Validation sends no secret to the browser and does not activate ingestion by itself.</>,
  },
  {
    title: "Activate only after a successful validation",
    detail: <>Confirm the approved provider coverage and enable the bounded live connector. Until then, AeroIndex remains in validated historical mode; the dashboard badges make that state explicit.</>,
  },
] as const;

function getInitialTourStep() {
  if (typeof window === "undefined") return 0;
  const step = Number(new URLSearchParams(window.location.search).get("activationStep"));
  return Number.isInteger(step) && step >= 1 && step <= activationSteps.length ? step - 1 : 0;
}

export function SecureIntegrationSettingsPanel({ providers, onBack }: { providers: ProviderSettingsSummary[]; onBack: () => void }) {
  const [tourOpen, setTourOpen] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("activationTour") === "1");
  const [stepIndex, setStepIndex] = useState(getInitialTourStep);
  const activeStep = activationSteps[stepIndex];

  function openTour() {
    setStepIndex(0);
    setTourOpen(true);
  }

  return (
    <main data-testid="secure-integration-settings" className="mx-auto max-w-5xl space-y-6 pb-10">
      <header className="rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-xl shadow-slate-950/10 sm:px-8">
        <div className="flex items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 text-indigo-200"><LockKeyhole className="h-5 w-5" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-200">Secure integration settings</p><h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em]">Provider credentials stay outside the app</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">AeroIndex can show provider readiness and validate server-side access, but it deliberately never renders an API-key input or stored key value in the browser.</p></div></div>
      </header>

      <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 text-indigo-950 sm:p-6"><div className="flex gap-3"><KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-indigo-700" /><div><h2 className="font-semibold">Save provider keys later</h2><p className="mt-1 text-sm leading-6">Open <b>{integrationSettingsGuidance.secureSettingsPath}</b>, enter the provider-issued key using its server variable, then return to Operations to validate gateway access. The form is intentionally managed outside this app so that the key never reaches the browser bundle, source tree, or public API.</p><p className="mt-3 text-xs font-medium text-indigo-800">Skyscanner: <code>SKYSCANNER_API_KEY</code> · Aviation Edge: <code>AVIATION_EDGE_API_KEY</code></p></div></div></section>

      <section data-testid="activation-onboarding" className="rounded-2xl border border-violet-200 bg-violet-50/70 p-5 shadow-sm shadow-violet-950/[0.03] sm:p-6">
        {!tourOpen ? (
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-violet-700">New administrator?</p><h2 className="mt-1 text-lg font-semibold text-slate-950">Take the secure activation tour</h2><p className="mt-1 text-sm leading-6 text-slate-600">A three-step guide explains how to move from historical data to a validated live connector without exposing credentials in the app.</p></div><Button data-testid="start-activation-tour" type="button" onClick={openTour} className="shrink-0 bg-violet-700 text-white hover:bg-violet-800">Start guided activation <ArrowRight className="ml-2 h-4 w-4" /></Button></div>
        ) : (
          <div aria-live="polite"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-violet-700">Activation guide · Step {stepIndex + 1} of {activationSteps.length}</p><h2 data-testid="activation-tour-title" className="mt-1 text-lg font-semibold text-slate-950">{activeStep.title}</h2></div><Button type="button" variant="ghost" size="sm" onClick={() => setTourOpen(false)} className="text-slate-600 hover:bg-white/70">Dismiss tour</Button></div><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">{activeStep.detail}</p><div className="mt-5 flex flex-wrap items-center justify-between gap-3"><div aria-label="Activation guide progress" className="flex gap-1.5">{activationSteps.map((step, index) => <span key={step.title} aria-current={index === stepIndex ? "step" : undefined} className={`h-1.5 w-8 rounded-full ${index <= stepIndex ? "bg-violet-600" : "bg-violet-200"}`} />)}</div><div className="flex gap-2">{stepIndex > 0 ? <Button type="button" variant="outline" size="sm" onClick={() => setStepIndex(index => index - 1)}><ArrowLeft className="mr-1.5 h-4 w-4" />Back</Button> : null}{stepIndex < activationSteps.length - 1 ? <Button type="button" size="sm" onClick={() => setStepIndex(index => index + 1)} className="bg-violet-700 text-white hover:bg-violet-800">Next <ArrowRight className="ml-1.5 h-4 w-4" /></Button> : <Button type="button" size="sm" onClick={() => setTourOpen(false)} className="bg-emerald-700 text-white hover:bg-emerald-800"><CheckCircle2 className="mr-1.5 h-4 w-4" />Finish tour</Button>}</div></div></div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">{providers.map(provider => <article key={provider.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03]"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Licensed provider</p><h2 className="mt-1 text-lg font-semibold text-slate-950">{provider.name}</h2></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${provider.enabled ? "bg-emerald-50 text-emerald-700" : provider.configured ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{provider.enabled ? "Enabled" : provider.configured ? "Ready to validate" : "Key not configured"}</span></div><p className="mt-3 text-sm leading-6 text-slate-600">{provider.purpose}</p><p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">{provider.note}</p></article>)}</section>

      <section className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><p className="text-sm leading-6 text-slate-600"><b className="text-slate-900">Security boundary:</b> no secret input, key value, or key-update API is present in this page. Provider validation always runs server-side after secure configuration.</p></div><Button variant="outline" onClick={onBack}><Radio className="mr-2 h-4 w-4" />Back to operations</Button></section>
    </main>
  );
}
