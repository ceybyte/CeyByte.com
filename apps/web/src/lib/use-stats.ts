"use client";

import { useEffect, useState } from "react";

export type SiteStats = {
  districtsCovered: number;
  listedShops: number;
  supporters: number;
};

export type UseStatsResult = {
  stats: SiteStats | null;
  isLoading: boolean;
  isError: boolean;
};

let cachedStats: SiteStats | null = null;
let inFlightPromise: Promise<SiteStats | null> | null = null;

async function fetchStats(): Promise<SiteStats | null> {
  if (cachedStats) return cachedStats;
  if (inFlightPromise) return inFlightPromise;

  inFlightPromise = (async () => {
    try {
      const res = await fetch("/api/stats", {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        return null;
      }
      const json = (await res.json()) as { ok: boolean; data?: SiteStats };
      if (json && json.ok && json.data) {
        cachedStats = json.data;
        return json.data;
      }
      return null;
    } catch {
      return null;
    } finally {
      inFlightPromise = null;
    }
  })();

  return inFlightPromise;
}

/**
 * Client hook for fetching live telemetry stats from GET /api/stats (01-PRD §F-02, 02-TRD §4).
 * Edge cached at 300 s. Cached in-memory to prevent duplicate requests across components.
 */
export function useStats(): UseStatsResult {
  const [stats, setStats] = useState<SiteStats | null>(cachedStats);
  const [isLoading, setIsLoading] = useState<boolean>(!cachedStats);
  const [isError, setIsError] = useState<boolean>(false);

  useEffect(() => {
    if (cachedStats) {
      setStats(cachedStats);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    fetchStats()
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          setStats(data);
          setIsError(false);
        } else {
          setIsError(true);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setIsError(true);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { stats, isLoading, isError };
}
