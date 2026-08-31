/** Style: Aviation Operations Room — shortcut mappings are a controlled user preference, with clear validation and predictable command behavior. */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ShortcutAction = "commandPalette" | "ambientMotion" | "signalDesk" | "shortcutReference";
export type ShortcutMap = Record<ShortcutAction, string>;
type ShortcutUpdate = { ok: true } | { ok: false; message: string };
type ShortcutsContextValue = { shortcuts: ShortcutMap; updateShortcut: (action: ShortcutAction, value: string) => ShortcutUpdate; resetShortcuts: () => void };

export const DEFAULT_SHORTCUTS: ShortcutMap = { commandPalette: "Ctrl+K", ambientMotion: "M", signalDesk: "G", shortcutReference: "?" };
const STORAGE_KEY = "aeroindex-shortcut-map";
const ShortcutContext = createContext<ShortcutsContextValue | undefined>(undefined);

function normalizeShortcut(value: string) {
  const pieces = value.trim().replaceAll("command", "cmd").replaceAll("control", "ctrl").split("+").map((piece) => piece.trim().toLowerCase()).filter(Boolean);
  const key = pieces.pop() || "";
  const modifiers = Array.from(new Set(pieces.map((piece) => piece === "cmd" ? "Cmd" : piece === "ctrl" ? "Ctrl" : piece === "alt" ? "Alt" : piece === "shift" ? "Shift" : ""))).filter(Boolean);
  const displayKey = key.length === 1 ? key.toUpperCase() : key;
  return [...modifiers, displayKey].join("+");
}

function readShortcuts(): ShortcutMap {
  if (typeof window === "undefined") return DEFAULT_SHORTCUTS;
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}") as Partial<ShortcutMap>;
    const merged = { ...DEFAULT_SHORTCUTS, ...stored };
    return (Object.keys(DEFAULT_SHORTCUTS) as ShortcutAction[]).reduce((result, action) => ({ ...result, [action]: normalizeShortcut(merged[action]) || DEFAULT_SHORTCUTS[action] }), {} as ShortcutMap);
  } catch { return DEFAULT_SHORTCUTS; }
}

export function matchesShortcut(event: KeyboardEvent, shortcut: string) {
  const key = typeof event.key === "string" ? event.key.toLowerCase() : "";
  const pieces = shortcut.toLowerCase().split("+");
  const expectedKey = pieces.at(-1) || "";
  return Boolean(key && key === expectedKey && pieces.includes("ctrl") === Boolean(event.ctrlKey) && pieces.includes("cmd") === Boolean(event.metaKey) && pieces.includes("alt") === Boolean(event.altKey));
}

export function displayShortcut(shortcut: string) { return shortcut.replaceAll("+", " + "); }

export function ShortcutsProvider({ children }: { children: ReactNode }) {
  const [shortcuts, setShortcuts] = useState<ShortcutMap>(readShortcuts);
  useEffect(() => { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts)); }, [shortcuts]);
  const updateShortcut = (action: ShortcutAction, value: string): ShortcutUpdate => {
    const normalized = normalizeShortcut(value);
    const parts = normalized.split("+");
    const key = parts.at(-1) || "";
    const command = action === "commandPalette";
    if (!key || (key.length !== 1 && key !== "?")) return { ok: false, message: "Use one letter or ? as the command key." };
    if (command && !parts.some((part) => part === "Ctrl" || part === "Cmd")) return { ok: false, message: "Command navigation requires Ctrl+ or Cmd+ to remain available while typing." };
    if (!command && parts.length > 1) return { ok: false, message: "Analyst shortcuts use a single key to keep the command rail concise." };
    if ((Object.keys(shortcuts) as ShortcutAction[]).some((item) => item !== action && shortcuts[item].toLowerCase() === normalized.toLowerCase())) return { ok: false, message: "Each shortcut must have a unique mapping." };
    setShortcuts((current) => ({ ...current, [action]: normalized }));
    return { ok: true };
  };
  const resetShortcuts = () => setShortcuts(DEFAULT_SHORTCUTS);
  return <ShortcutContext.Provider value={{ shortcuts, updateShortcut, resetShortcuts }}>{children}</ShortcutContext.Provider>;
}

export function useShortcuts() { const context = useContext(ShortcutContext); if (!context) throw new Error("useShortcuts must be used within ShortcutsProvider"); return context; }
