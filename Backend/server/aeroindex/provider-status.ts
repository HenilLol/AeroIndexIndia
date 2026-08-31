export type PublicDataMode = {
  mode: "live" | "historical" | "fallback";
  source: string;
  updatedAt: Date | null;
  warning: string | null;
};

let lastLiveSuccessAt: Date | null = null;
let lastLiveFailure: { at: Date; message: string } | null = null;

export function recordLiveProviderSuccess() {
  lastLiveSuccessAt = new Date();
  lastLiveFailure = null;
}

export function recordLiveProviderFailure(message: string) {
  lastLiveFailure = { at: new Date(), message: message.slice(0, 180) };
}

export function getPublicDataMode(): PublicDataMode {
  if (lastLiveFailure) {
    return { mode: "fallback", source: "validated historical AeroIndex observations", updatedAt: lastLiveFailure.at, warning: "Live provider data is temporarily unavailable; figures shown use the latest validated historical observations." };
  }
  if (lastLiveSuccessAt && Date.now() - lastLiveSuccessAt.getTime() <= 30 * 60_000) {
    return { mode: "live", source: "licensed provider feed", updatedAt: lastLiveSuccessAt, warning: null };
  }
  return { mode: "historical", source: "validated historical AeroIndex observations", updatedAt: null, warning: "Live provider updates are not active; figures shown use validated historical observations." };
}

export const __providerStatusTestables = {
  reset() { lastLiveSuccessAt = null; lastLiveFailure = null; },
};
