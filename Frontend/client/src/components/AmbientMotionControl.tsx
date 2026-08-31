/** Style: Aviation Operations Room — the ambient setting uses explicit state, native keyboard access, and a concise operational tooltip. */
import { useMotion } from "@/contexts/MotionContext";

type AmbientMotionControlProps = { presentation?: boolean; onSaved?: (enabled: boolean) => void };

export function AmbientMotionControl({ presentation = false, onSaved }: AmbientMotionControlProps) {
  const { ambientMotion, toggleAmbientMotion } = useMotion();
  const tooltipId = presentation ? "style-guide-motion-tooltip" : "settings-motion-tooltip";
  const state = ambientMotion ? "enabled" : "reduced";
  return <div className={`ambient-motion-control ${presentation ? "presentation-control" : ""}`}><button onClick={() => { toggleAmbientMotion("control"); onSaved?.(!ambientMotion); }} className={`control-switch ${ambientMotion ? "on" : ""}`} aria-label={`Ambient flight motion ${state}. Press M to toggle.`} aria-describedby={tooltipId} aria-keyshortcuts="M" aria-pressed={ambientMotion}><i /></button><span id={tooltipId} role="tooltip" className="ambient-motion-tooltip">{ambientMotion ? "Ambient aircraft, cloud, and route motion is enabled." : "Ambient aircraft, cloud, and route motion is reduced."} Press <kbd>M</kbd> to toggle. Your choice is saved on this device.</span><span className="sr-only" aria-live="polite">Ambient flight motion is {state}. Shortcut: M.</span></div>;
}
