"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { FilterBar } from "./filter-bar";
import { DistrictGrid } from "./district-grid";
import { MerchantList } from "./merchant-list";
import type { GeoFeature, MapFilterState } from "./map-types";

interface NoWebglFallbackProps {
  features: GeoFeature[];
  coveredDistricts: Set<string>;
  districtCounts: Record<string, number>;
  filters: MapFilterState;
  onFilterChange: (filters: MapFilterState) => void;
  onResetFilters: () => void;
  isLoading: boolean;
}

export function NoWebglFallback({
  features,
  coveredDistricts,
  districtCounts,
  filters,
  onFilterChange,
  onResetFilters,
  isLoading,
}: NoWebglFallbackProps) {
  const t = useTranslations("map");

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      {/* Informational Banner */}
      <div className="border-hairline bg-surface text-text-muted flex items-start gap-3 rounded-md border p-4 text-xs">
        <AlertCircle className="text-azure mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <h2 className="text-text mb-1 text-sm font-semibold">{t("title")}</h2>
          <p>{t("noWebgl")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Filters & District Grid */}
        <div className="border-hairline bg-surface space-y-4 rounded-md border p-4 md:col-span-1">
          <FilterBar filters={filters} onFilterChange={onFilterChange} onResetFilters={onResetFilters} />
          <div className="px-4 pb-2">
            <h3 className="text-text mb-2 text-xs font-semibold">{t("coverage.title")}</h3>
            <DistrictGrid
              coveredDistricts={coveredDistricts}
              districtCounts={districtCounts}
              selectedDistrict={filters.district}
              onSelectDistrict={(districtId) => onFilterChange({ ...filters, district: districtId })}
            />
          </div>
        </div>

        {/* Results List */}
        <div className="border-hairline bg-surface flex h-[600px] flex-col overflow-hidden rounded-md border md:col-span-2">
          <div className="border-hairline bg-surface-elevated/40 text-text-muted border-b p-3 font-mono text-xs">
            {t("results.inView", { count: features.length })}
          </div>
          <MerchantList
            features={features}
            selectedShopId={null}
            onSelectShop={() => {}}
            isLoading={isLoading}
            onClearFilters={onResetFilters}
          />
        </div>
      </div>
    </div>
  );
}
