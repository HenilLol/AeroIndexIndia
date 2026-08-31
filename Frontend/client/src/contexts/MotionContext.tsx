/** Style: Aviation Operations Room — user-controlled ambient motion keeps the analytical atmosphere accessible and deliberate. */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { trackEngagement } from "@/lib/engagement";
import { matchesShortcut, useShortcuts } from "@/contexts/ShortcutsContext";

type MotionContextValue = { ambientMotion: boolean; toggleAmbientMotion: (source?: "control" | "keyboard") => void; resetAmbientMotion: () => void };
const MotionContext = createContext<MotionContextValue | undefined>(undefined);
const MOTION_KEY = "aeroindex-ambient-motion";

function getInitialMotionPreference() {
  if (typeof window === "undefined") return true;
  const stored = window.localStorage.getItem(MOTION_KEY);
  if (stored !== null) return stored === "enabled";
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function MotionProvider({ children }: { children: ReactNode }) {
  const [ambientMotion, setAmbientMotion] = useState(getInitialMotionPreference);
  const [hasCustomPreference, setHasCustomPreference] = useState(() => typeof window !== "undefined" && window.localStorage.getItem(MOTION_KEY) !== null);
  const { shortcuts } = useShortcuts();
  const toggleAmbientMotion = (source: "control" | "keyboard" = "control") => { setHasCustomPreference(true); setAmbientMotion((current) => { const next = !current; trackEngagement("ambient_motion_toggled", { source, enabled: next, shortcut: source === "keyboard" ? "M" : undefined }); return next; }); };
  const resetAmbientMotion = () => { setHasCustomPreference(false); setAmbientMotion(!window.matchMedia("(prefers-reduced-motion: reduce)").matches); };

  useEffect(() => {
    document.documentElement.classList.toggle("motion-reduced", !ambientMotion);
    if (hasCustomPreference) window.localStorage.setItem(MOTION_KEY, ambientMotion ? "enabled" : "reduced");
    else window.localStorage.removeItem(MOTION_KEY);
  }, [ambientMotion, hasCustomPreference]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const key = typeof event.key === "string" ? event.key.toLowerCase() : "";
      if (!key || !matchesShortcut(event, shortcuts.ambientMotion) || isTypingTarget(event.target)) return;
      event.preventDefault();
      toggleAmbientMotion("keyboard");
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [shortcuts.ambientMotion]);

  return <MotionContext.Provider value={{ ambientMotion, toggleAmbientMotion, resetAmbientMotion }}>{children}</MotionContext.Provider>;
}

export function useMotion() {
  const context = useContext(MotionContext);
  if (!context) throw new Error("useMotion must be used within MotionProvider");
  return context;
}
