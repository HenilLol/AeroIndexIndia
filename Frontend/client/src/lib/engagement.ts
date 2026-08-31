/** Style: Aviation Operations Room — restrained local event telemetry stores only non-sensitive interaction context. */
export type EngagementProperties = Record<string, string | number | boolean | undefined>;
type EngagementEvent = { name: string; properties: EngagementProperties; at: string };
const STORE_KEY = "aeroindex-engagement-events";
const MAX_EVENTS = 80;

export function trackEngagement(name: string, properties: EngagementProperties = {}) {
  if (typeof window === "undefined") return;
  const event: EngagementEvent = { name, properties, at: new Date().toISOString() };
  try {
    const current = JSON.parse(window.localStorage.getItem(STORE_KEY) || "[]") as EngagementEvent[];
    window.localStorage.setItem(STORE_KEY, JSON.stringify([...current, event].slice(-MAX_EVENTS)));
  } catch { /* Keep interaction behavior working if local storage is unavailable. */ }
  const umami = (window as Window & { umami?: { track?: (eventName: string, props?: EngagementProperties) => void } }).umami;
  umami?.track?.(name, properties);
  window.dispatchEvent(new CustomEvent("aeroindex:engagement", { detail: event }));
}
