import { useCallback, useEffect, useState } from "react";
import { loadLiveAeroIndex } from "@/services/api";
import type { RouteRecord } from "@/data/mockData";

type LiveData = Awaited<ReturnType<typeof loadLiveAeroIndex>>;

const refreshMs = Math.max(15_000, Number(import.meta.env.VITE_API_REFRESH_MS || 60_000));

export function useAeroIndexData() {
  const [data, setData] = useState<LiveData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const next = await loadLiveAeroIndex();
      setData(next);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to connect to AeroIndex backend.");
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), refreshMs);
    return () => window.clearInterval(timer);
  }, [refresh]);
  return { data, error, isLoading, refresh, routes: (data?.routes || []) as RouteRecord[] };
}
