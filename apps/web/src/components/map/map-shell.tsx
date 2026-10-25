"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { ChevronUp, SlidersHorizontal, Plus } from "lucide-react";
import { useGate } from "@/components/gate/gate-context";
import { useMerchantGeo } from "./use-merchant-geo";
import { FilterBar } from "./filter-bar";
import { DistrictGrid } from "./district-grid";
import { MerchantList } from "./merchant-list";
import { NoWebglFallback } from "./no-webgl-fallback";
import { DISTRICT_MAP } from "./district-constants";
import { INITIAL_FILTERS, type MapFilterState } from "./map-types";
import { Drawer, DrawerContent, DrawerTrigger, DrawerTitle } from "@/components/ui/drawer";

// Lazy-load MapLibre GL instance without SSR
const MerchantMap = dynamic(() => import("./merchant-map").then((mod) => mod.MerchantMap), {
  ssr: false,
  loading: () => (
    <div className="bg-canvas flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="border-azure h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
        <span className="text-text-muted font-mono text-xs">Loading map...</span>
      </div>
    </div>
  ),
});

export function MapShell() {
  const t = useTranslations("map");
  const { openGate } = useGate();

  const [filters, setFilters] = useState<MapFilterState>(INITIAL_FILTERS);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<number | null>(null);
  const [flyToCoords, setFlyToCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isWebglSupported, setIsWebglSupported] = useState<boolean>(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  // WebGL context check
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const canvas = document.createElement("canvas");
      const supported = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
      );
      setIsWebglSupported(supported);
    } catch {
      setIsWebglSupported(false);
    }
  }, []);

  const {
    filteredFeatures,
    coveredDistricts,
    districtCounts,
    coveredCount,
    totalCount,
    filteredCount,
    isLoading,
    isError,
    reload,
  } = useMerchantGeo(filters);

  // Fly to district when selected from DistrictGrid
  const handleSelectDistrict = useCallback((districtId: string) => {
    setFilters((prev) => ({
      ...prev,
      district: districtId,
    }));

    if (districtId !== "all") {
      const info = DISTRICT_MAP.get(districtId);
      if (info) {
        setFlyToCoords({ lat: info.lat, lng: info.lng });
      }
    }
  }, []);

  const handleSelectShop = useCallback((shopId: string, coords: { lat: number; lng: number }) => {
    setSelectedShopId(shopId);
    setFlyToCoords(coords);
    // On mobile, close drawer to reveal pin and popup
    setIsMobileDrawerOpen(false);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  const handleAddShopClick = () => {
    openGate(1);
  };

  const countDisplay = useMemo(() => {
    if (
      visibleCount !== null &&
      !filters.search &&
      filters.district === "all" &&
      filters.category === "all" &&
      !filters.supportersOnly
    ) {
      return visibleCount;
    }
    return filteredCount;
  }, [visibleCount, filteredCount, filters]);

  // Non-WebGL Fallback view
  if (!isWebglSupported) {
    return (
      <NoWebglFallback
        features={filteredFeatures}
        coveredDistricts={coveredDistricts}
        districtCounts={districtCounts}
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={handleResetFilters}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="bg-canvas relative flex h-[calc(100vh-var(--header-h,64px))] w-full overflow-hidden">
      {/* Skip link for keyboard navigation (AC-04.3) */}
      <a
        href="#merchant-list-content"
        className="focus:bg-azure sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:px-3 focus:py-2 focus:text-white"
      >
        {t("skipToList")}
      </a>

      {/* Desktop Left Panel (360px wide, #252526 per DESIGN S03) */}
      <aside
        aria-label="Merchant map filters and directory"
        className="border-hairline bg-surface z-10 hidden w-[360px] shrink-0 flex-col overflow-hidden border-r md:flex"
      >
        {/* Panel Header */}
        <div className="border-hairline bg-surface border-b p-4">
          <h1 className="text-text text-base leading-tight font-semibold">{t("title")}</h1>
          <p className="text-text-muted mt-1 font-mono text-xs">
            {t("subtitle", { shops: totalCount, covered: coveredCount })}
          </p>
        </div>

        {/* Filter Bar */}
        <FilterBar filters={filters} onFilterChange={setFilters} onResetFilters={handleResetFilters} />

        {/* 5x5 District Coverage Grid */}
        <div className="border-hairline bg-surface/50 border-t px-4 py-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-text text-xs font-semibold">{t("coverage.title")}</span>
            <span className="text-text-muted font-mono text-[11px]">
              {t("coverage.legend", { covered: coveredCount })}
            </span>
          </div>
          <DistrictGrid
            coveredDistricts={coveredDistricts}
            districtCounts={districtCounts}
            selectedDistrict={filters.district}
            onSelectDistrict={handleSelectDistrict}
          />
        </div>

        {/* Live In-View Counter Header */}
        <div className="border-hairline bg-surface-elevated/40 text-text-muted flex items-center justify-between border-t border-b px-4 py-2 font-mono text-[11px]">
          <span>{t("results.inView", { count: countDisplay })}</span>
          {isError && (
            <button type="button" onClick={reload} className="text-azure text-xs hover:underline">
              {t("retry")}
            </button>
          )}
        </div>

        {/* Scrollable Merchant List */}
        <MerchantList
          features={filteredFeatures}
          selectedShopId={selectedShopId}
          onSelectShop={(id, coords) => {
            setSelectedShopId(id);
            setFlyToCoords(coords);
          }}
          isLoading={isLoading}
          onClearFilters={handleResetFilters}
        />

        {/* Panel Footer: Add My Shop CTA (Solitary Brand Green button AC-02.3) */}
        <div className="border-hairline bg-surface border-t p-3">
          <button
            type="button"
            onClick={handleAddShopClick}
            className="bg-brand-green hover:bg-brand-green/90 focus-visible:ring-brand-green flex h-9 w-full items-center justify-center gap-2 rounded-sm text-xs font-semibold text-black shadow-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <Plus className="h-4 w-4" />
            {t("addShop")}
          </button>
        </div>
      </aside>

      {/* Main Map Viewport */}
      <main className="relative h-full w-full flex-1 overflow-hidden">
        <MerchantMap
          features={filteredFeatures}
          selectedShopId={selectedShopId}
          onSelectShop={setSelectedShopId}
          onVisibleCountChange={setVisibleCount}
          flyToCoords={flyToCoords}
        />

        {/* Mobile Header Bar & Drawer Trigger (< md) */}
        <div className="absolute inset-x-3 top-3 z-10 flex items-center gap-2 md:hidden">
          <div className="border-hairline bg-surface/90 flex-1 rounded-sm border px-3 py-2 shadow-md backdrop-blur-md">
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder={t("search.placeholder")}
              aria-label={t("search.placeholder")}
              className="text-text placeholder:text-text-muted w-full bg-transparent text-xs focus:outline-none"
            />
          </div>

          <Drawer open={isMobileDrawerOpen} onOpenChange={setIsMobileDrawerOpen}>
            <DrawerTrigger asChild>
              <button
                type="button"
                aria-label="Open shop filters and results list"
                className="border-hairline bg-surface text-text hover:bg-surface-elevated flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border shadow-md"
              >
                <SlidersHorizontal className="text-azure h-4 w-4" />
              </button>
            </DrawerTrigger>

            <DrawerContent className="bg-surface border-hairline flex max-h-[85vh] flex-col border-t">
              <div className="border-hairline flex items-center justify-between border-b p-4">
                <div>
                  <DrawerTitle className="text-text text-sm font-semibold">{t("title")}</DrawerTitle>
                  <p className="text-text-muted mt-0.5 font-mono text-xs">
                    {t("subtitle", { shops: totalCount, covered: coveredCount })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddShopClick}
                  className="bg-brand-green rounded-sm px-3 py-1.5 text-xs font-semibold text-black"
                >
                  {t("addShop")}
                </button>
              </div>

              <div className="border-hairline overflow-x-auto border-b p-3">
                <DistrictGrid
                  coveredDistricts={coveredDistricts}
                  districtCounts={districtCounts}
                  selectedDistrict={filters.district}
                  onSelectDistrict={handleSelectDistrict}
                />
              </div>

              <div className="flex-1 overflow-y-auto">
                <MerchantList
                  features={filteredFeatures}
                  selectedShopId={selectedShopId}
                  onSelectShop={handleSelectShop}
                  isLoading={isLoading}
                  onClearFilters={handleResetFilters}
                />
              </div>
            </DrawerContent>
          </Drawer>
        </div>

        {/* Mobile Quick Peel Pullup Button (< md) */}
        <div className="absolute inset-x-4 bottom-4 z-10 md:hidden">
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="border-hairline bg-surface/90 text-text hover:bg-surface flex h-10 w-full items-center justify-center gap-2 rounded-sm border font-mono text-xs shadow-lg backdrop-blur-md"
          >
            <ChevronUp className="text-azure h-4 w-4" />
            <span>{t("results.inView", { count: countDisplay })}</span>
          </button>
        </div>
      </main>
    </div>
  );
}
