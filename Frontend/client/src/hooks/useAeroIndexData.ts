import { useCallback, useEffect, useState } from "react";
import { computeDefaultDashboard, loadLiveAeroIndex } from "@/services/api";
import { ROUTES, type RouteRecord } from "@/data/mockData";

export type LiveData = Awaited<ReturnType<typeof loadLiveAeroIndex>>;

const initialData: LiveData = {
  dashboard: computeDefaultDashboard(ROUTES),
  routes: ROUTES,
  fares: { items: [] },
  indexHistory: [],
  alerts: [],
  isLive: false,
};

const refreshMs = Math.max(15_000, Number(import.meta.env.VITE_API_REFRESH_MS || 60_000));

export function useAeroIndexData() {
  const [data, setData] = useState<LiveData>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const next = await loadLiveAeroIndex();
      setData(next);
      setError(null);
    } catch (cause) {
      // Retain the real & precise dataset if background refresh encounters an issue
      setError(cause instanceof Error ? cause.message : null);
      setData((prev) => prev || initialData);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), refreshMs);
    return () => window.clearInterval(timer);
  }, [refresh]);

  return {
    data,
    error,
    isLoading,
    refresh,
    routes: (data?.routes && data.routes.length > 0 ? data.routes : ROUTES) as RouteRecord[],
  };
}
