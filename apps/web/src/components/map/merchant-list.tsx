"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Star, MapPinOff } from "lucide-react";
import type { GeoFeature } from "./map-types";

interface MerchantListProps {
  features: GeoFeature[];
  selectedShopId: string | null;
  onSelectShop: (shopId: string, coords: { lat: number; lng: number }) => void;
  isLoading: boolean;
  onClearFilters?: () => void;
}

export function MerchantList({
  features,
  selectedShopId,
  onSelectShop,
  isLoading,
  onClearFilters,
}: MerchantListProps) {
  const t = useTranslations("map");
  const tCategories = useTranslations("categories");

  if (isLoading) {
    return (
      <div className="flex-1 space-y-2 overflow-y-auto p-4" aria-busy="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="border-hairline bg-surface-elevated/40 h-18 animate-pulse rounded-sm border p-3"
          >
            <div className="bg-surface-elevated h-4 w-3/4 rounded" />
            <div className="bg-surface-elevated mt-2 h-3 w-1/2 rounded" />
            <div className="bg-surface-elevated mt-2 h-2.5 w-1/3 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (features.length === 0) {
    return (
      <div className="text-text-muted flex flex-1 flex-col items-center justify-center p-6 text-center">
        <MapPinOff className="text-text-muted/50 mb-2 h-8 w-8" />
        <p className="mb-3 text-xs">{t("results.noMatch")}</p>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="text-azure text-xs font-medium hover:underline"
          >
            {t("results.clearFilters")}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      id="merchant-list-content"
      role="region"
      aria-label="Merchant shops list"
      className="divide-hairline flex-1 divide-y overflow-y-auto"
    >
      {features.map((f) => {
        const p = f.properties;
        const [lng, lat] = f.geometry.coordinates;
        const isSelected = selectedShopId === p.id;

        let localizedCat = p.category;
        try {
          localizedCat = tCategories(p.category as never);
        } catch {
          localizedCat = p.category;
        }

        const sinceText = t("popup.since", { monthYear: p.since });

        return (
          <div
            key={p.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelectShop(p.id, { lat, lng })}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectShop(p.id, { lat, lng });
              }
            }}
            aria-pressed={isSelected}
            className={`focus-visible:bg-surface-elevated cursor-pointer p-3.5 text-left transition-colors focus-visible:outline-none ${
              isSelected ? "bg-azure/10 border-l-azure border-l-2" : "hover:bg-surface-elevated/60"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="text-text text-xs leading-snug font-semibold break-words">{p.shopName}</div>
              {p.isSupporter && (
                <span
                  title={t("popup.supporter")}
                  className="border-gold/40 bg-gold/10 text-gold flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium"
                >
                  <Star className="fill-gold text-gold h-2.5 w-2.5" />
                  <span className="hidden sm:inline">{t("popup.supporter")}</span>
                </span>
              )}
            </div>

            <div className="text-text-muted mt-1 text-[11px]">
              {localizedCat} &middot; {p.city}
            </div>

            <div className="text-text-muted/80 mt-1 font-mono text-[10px]">{sinceText}</div>
          </div>
        );
      })}
    </div>
  );
}
