"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { GeoFeature, GeoFeatureCollection, MapFilterState } from "./map-types";

let memoryCache: GeoFeatureCollection | null = null;

export interface UseMerchantGeoResult {
  data: GeoFeatureCollection | null;
  rawFeatures: GeoFeature[];
  filteredFeatures: GeoFeature[];
  coveredDistricts: Set<string>;
  coveredCount: number;
  totalCount: number;
  filteredCount: number;
  districtCounts: Record<string, number>;
  isLoading: boolean;
  isError: boolean;
  reload: () => void;
}

export function useMerchantGeo(filters: MapFilterState): UseMerchantGeoResult {
  const [data, setData] = useState<GeoFeatureCollection | null>(memoryCache);
  const [isLoading, setIsLoading] = useState<boolean>(!memoryCache);
  const [isError, setIsError] = useState<boolean>(false);

  const fetchGeo = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);

    try {
      const res = await fetch("/api/merchants/geo", {
        headers: { Accept: "application/geo+json, application/json" },
      });

      if (!res.ok) {
        throw new Error(`Failed to load merchant geo data: ${res.status}`);
      }

      const collection = (await res.json()) as GeoFeatureCollection;
      memoryCache = collection;
      setData(collection);
    } catch {
      // Graceful fallback to static seed dataset if API worker is offline or in static export
      try {
        const fallbackRes = await fetch("/data/merchants-geo.json");
        if (fallbackRes.ok) {
          const fallbackData = (await fallbackRes.json()) as GeoFeatureCollection;
          memoryCache = fallbackData;
          setData(fallbackData);
          return;
        }
      } catch {
        // Fallback also failed
      }
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!memoryCache) {
      void fetchGeo();
    }
  }, [fetchGeo]);

  const rawFeatures = useMemo(() => data?.features ?? [], [data]);

  const { coveredDistricts, districtCounts } = useMemo(() => {
    const covered = new Set<string>();
    const counts: Record<string, number> = {};

    for (const f of rawFeatures) {
      const d = f.properties.district;
      if (d) {
        covered.add(d);
        counts[d] = (counts[d] ?? 0) + 1;
      }
    }

    return { coveredDistricts: covered, districtCounts: counts };
  }, [rawFeatures]);

  const filteredFeatures = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const targetDistrict = filters.district.toLowerCase();
    const targetCategory = filters.category.toLowerCase();
    const supportersOnly = filters.supportersOnly;

    return rawFeatures.filter((f) => {
      const p = f.properties;

      if (supportersOnly && !p.isSupporter) {
        return false;
      }

      if (targetDistrict !== "all" && p.district.toLowerCase() !== targetDistrict) {
        return false;
      }

      if (targetCategory !== "all" && p.category.toLowerCase() !== targetCategory) {
        return false;
      }

      if (q) {
        const matchName = p.shopName.toLowerCase().includes(q);
        const matchCity = p.city.toLowerCase().includes(q);
        if (!matchName && !matchCity) {
          return false;
        }
      }

      return true;
    });
  }, [rawFeatures, filters]);

  return {
    data,
    rawFeatures,
    filteredFeatures,
    coveredDistricts,
    coveredCount: coveredDistricts.size,
    totalCount: rawFeatures.length,
    filteredCount: filteredFeatures.length,
    districtCounts,
    isLoading,
    isError,
    reload: fetchGeo,
  };
}
