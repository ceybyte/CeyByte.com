"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Search, X, Star } from "lucide-react";
import { BUSINESS_CATEGORIES } from "@cbpos/shared/enums";
import { SRI_LANKA_DISTRICTS } from "./district-constants";
import { Switch } from "@/components/ui/switch";
import type { MapFilterState } from "./map-types";

interface FilterBarProps {
  filters: MapFilterState;
  onFilterChange: (filters: MapFilterState) => void;
  onResetFilters: () => void;
}

export function FilterBar({ filters, onFilterChange, onResetFilters }: FilterBarProps) {
  const t = useTranslations("map");
  const tDistricts = useTranslations("districts");
  const tCategories = useTranslations("categories");

  const hasActiveFilters =
    filters.search.trim() !== "" ||
    filters.district !== "all" ||
    filters.category !== "all" ||
    filters.supportersOnly;

  return (
    <div className="space-y-3 p-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="text-text-muted pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <input
          id="map-filter-search"
          name="search"
          type="text"
          value={filters.search}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          placeholder={t("search.placeholder")}
          aria-label={t("search.placeholder")}
          className="border-hairline bg-surface-elevated/50 text-text placeholder:text-text-muted/60 focus:border-azure focus:ring-azure h-9 w-full rounded-sm border pr-8 pl-9 text-xs focus:ring-1 focus:outline-none"
        />
        {filters.search && (
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, search: "" })}
            aria-label="Clear search"
            className="text-text-muted hover:text-text absolute top-1/2 right-2.5 -translate-y-1/2"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* District & Category Selects */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <select
            id="map-filter-district"
            name="district"
            value={filters.district}
            onChange={(e) => onFilterChange({ ...filters, district: e.target.value })}
            aria-label={t("filter.district")}
            className="border-hairline bg-surface-elevated/50 text-text focus:border-azure focus:ring-azure h-8 w-full rounded-sm border px-2 text-xs focus:ring-1 focus:outline-none"
          >
            <option value="all">{t("allDistricts")}</option>
            {SRI_LANKA_DISTRICTS.map((d) => {
              let label: string = d.id;
              try {
                label = (tDistricts as (k: string) => string)(d.id);
              } catch {
                label = d.id;
              }
              return (
                <option key={d.id} value={d.id}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>

        <div className="space-y-1">
          <select
            id="map-filter-category"
            name="category"
            value={filters.category}
            onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
            aria-label={t("filter.category")}
            className="border-hairline bg-surface-elevated/50 text-text focus:border-azure focus:ring-azure h-8 w-full rounded-sm border px-2 text-xs focus:ring-1 focus:outline-none"
          >
            <option value="all">{t("allCategories")}</option>
            {BUSINESS_CATEGORIES.map((cat) => {
              let label: string = cat;
              try {
                label = (tCategories as (k: string) => string)(cat);
              } catch {
                label = cat;
              }
              return (
                <option key={cat} value={cat}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Gold Supporters Toggle & Clear Filters */}
      <div className="flex items-center justify-between pt-1">
        <label className="text-text flex cursor-pointer items-center gap-2 text-xs select-none">
          <Switch
            id="map-filter-supporters"
            name="supportersOnly"
            checked={filters.supportersOnly}
            onCheckedChange={(checked) => onFilterChange({ ...filters, supportersOnly: Boolean(checked) })}
            size="sm"
            aria-label={t("filter.supporters")}
          />
          <span className="flex items-center gap-1 text-xs font-medium">
            <Star className="fill-gold text-gold h-3 w-3" />
            {t("filter.supporters")}
          </span>
        </label>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-text-muted hover:text-text text-[11px] underline underline-offset-2 transition-colors"
          >
            {t("results.clearFilters")}
          </button>
        )}
      </div>
    </div>
  );
}
