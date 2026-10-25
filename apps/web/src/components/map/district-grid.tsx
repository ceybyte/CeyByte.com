"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { SRI_LANKA_DISTRICTS } from "./district-constants";

interface DistrictGridProps {
  coveredDistricts: Set<string>;
  districtCounts: Record<string, number>;
  selectedDistrict: string;
  onSelectDistrict: (districtId: string) => void;
}

export function DistrictGrid({
  coveredDistricts,
  districtCounts,
  selectedDistrict,
  onSelectDistrict,
}: DistrictGridProps) {
  const tDistricts = useTranslations("districts");

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-5 gap-1.5" role="group" aria-label="District coverage grid">
        {SRI_LANKA_DISTRICTS.map((d) => {
          const isCovered = coveredDistricts.has(d.id);
          const isSelected = selectedDistrict.toLowerCase() === d.id.toLowerCase();
          const count = districtCounts[d.id] ?? 0;
          let localizedName = d.id;
          try {
            localizedName = tDistricts(d.id as never);
          } catch {
            localizedName = d.id;
          }

          const label = `${localizedName} — ${count} ${count === 1 ? "shop" : "shops"}`;

          return (
            <button
              key={d.id}
              type="button"
              onClick={() => onSelectDistrict(isSelected ? "all" : d.id)}
              title={label}
              aria-label={label}
              aria-pressed={isSelected}
              className={`flex h-9 items-center justify-center rounded-sm border text-center font-mono text-xs transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure ${
                isSelected
                  ? "border-azure bg-azure/20 font-bold text-azure-text ring-1 ring-azure"
                  : isCovered
                    ? "border-azure/35 bg-azure/5 font-medium text-azure-text hover:border-azure hover:bg-azure/15"
                    : "border-hairline bg-surface/30 text-text-muted/40 hover:border-hairline hover:text-text-muted"
              }`}
            >
              {d.code}
            </button>
          );
        })}
      </div>
    </div>
  );
}
