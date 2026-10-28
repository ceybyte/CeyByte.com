"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { ChevronUp, ChevronDown, SlidersHorizontal, Plus, Search, X } from "lucide-react";
import { Figure } from "@/components/brand/figure";
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
  const [isFiltersExpanded, setIsFiltersExpanded] = useState<boolean>(false);

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

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.district !== "all") count++;
    if (filters.category !== "all") count++;
    if (filters.supportersOnly) count++;
    return count;
  }, [filters]);

  // Non-WebGL Fallback view
  if (!isWebglSupported) {
    return (
      <div className="bg-canvas flex min-h-[calc(100vh-var(--header-h,64px))] w-full flex-col">
        {/* Full-width Hero Header matching Releases, Donate, and Feedback */}
        <section className="border-hairline bg-surface/30 relative overflow-hidden border-b py-10 sm:py-14">
          <div className="pointer-events-none absolute -top-12 -right-12 w-80 opacity-15 sm:w-96">
            <Figure name="terrain" intensity={0.4} />
          </div>

          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-3xl">
                <span className="text-azure-text font-mono text-xs font-semibold tracking-wider uppercase">
                  {t("coverage.title")}
                </span>
                <h1 className="text-display text-text mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                  {t("title")}
                </h1>
                <p className="text-muted mt-3 text-base leading-relaxed sm:text-lg">
                  {t("subtitle", { shops: totalCount, covered: coveredCount })}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  onClick={handleAddShopClick}
                  className="bg-primary hover:bg-primary-hover active:bg-primary-press text-primary-foreground focus-visible:outline-text inline-flex cursor-pointer items-center gap-2 rounded-sm px-4 py-2.5 text-xs font-bold transition-all focus-visible:ring-2 focus-visible:outline-none"
                >
                  <Plus className="h-4 w-4" />
                  <span>{t("addShop")}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <NoWebglFallback
          features={filteredFeatures}
          coveredDistricts={coveredDistricts}
          districtCounts={districtCounts}
          filters={filters}
          onFilterChange={setFilters}
          onResetFilters={handleResetFilters}
          isLoading={isLoading}
        />
      </div>
    );
  }

  return (
    <div className="bg-canvas flex min-h-[calc(100vh-var(--header-h,64px))] w-full flex-col">
      {/* Skip link for keyboard navigation (AC-04.3) */}
      <a
        href="#merchant-list-content"
        className="focus:bg-azure sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:px-3 focus:py-2 focus:text-white"
      >
        {t("skipToList")}
      </a>

      {/* Full-width Hero Header matching Releases, Donate, and Feedback */}
      <section className="border-hairline bg-surface/30 relative overflow-hidden border-b py-10 sm:py-14">
        <div className="pointer-events-none absolute -top-12 -right-12 w-80 opacity-15 sm:w-96">
          <Figure name="terrain" intensity={0.4} />
        </div>

        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-3xl">
              <span className="text-azure-text font-mono text-xs font-semibold tracking-wider uppercase">
                {t("coverage.title")}
              </span>
              <h1 className="text-display text-text mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                {t("title")}
              </h1>
              <p className="text-muted mt-3 text-base leading-relaxed sm:text-lg">
                {t("subtitle", { shops: totalCount, covered: coveredCount })}
              </p>
            </div>

            {/* Action CTA Button */}
            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={handleAddShopClick}
                className="bg-primary hover:bg-primary-hover active:bg-primary-press text-primary-foreground focus-visible:outline-text inline-flex cursor-pointer items-center gap-2 rounded-sm px-4 py-2.5 text-xs font-bold transition-all focus-visible:ring-2 focus-visible:outline-none"
              >
                <Plus className="h-4 w-4" />
                <span>{t("addShop")}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Map & Directory Shell */}
      <div className="relative flex h-[700px] min-h-0 min-h-[550px] w-full overflow-hidden lg:h-[calc(100vh-var(--header-h,76px)-160px)]">
        {/* Desktop Left Panel (360px wide) */}
        <aside
          aria-label="Merchant map filters and directory"
          className="border-hairline bg-surface z-10 hidden h-full min-h-0 w-[360px] shrink-0 flex-col overflow-hidden border-r md:flex"
        >
          {/* Compact Top Bar: Search and Filter Toggle */}
          <div className="border-hairline bg-surface flex flex-col border-b">
            <div className="flex items-center justify-between gap-2 p-3">
              <div className="relative flex-1">
                <Search className="text-text-muted pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
                <input
                  id="map-desktop-search"
                  name="search"
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder={t("search.placeholder")}
                  aria-label={t("search.placeholder")}
                  className="border-hairline bg-surface-elevated/50 text-text placeholder:text-text-muted/60 focus:border-azure focus:ring-azure h-8 w-full rounded-sm border pr-7 pl-8 text-xs focus:ring-1 focus:outline-none"
                />
                {filters.search && (
                  <button
                    type="button"
                    onClick={() => setFilters({ ...filters, search: "" })}
                    aria-label="Clear search"
                    className="text-text-muted hover:text-text absolute top-1/2 right-2 -translate-y-1/2"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                className={`border-hairline flex h-8 cursor-pointer items-center gap-1.5 rounded-sm border px-2.5 text-xs font-medium transition-colors ${
                  isFiltersExpanded || activeFilterCount > 0
                    ? "border-azure/50 bg-azure/10 text-azure-text"
                    : "bg-surface-elevated/50 text-text-muted hover:text-text hover:bg-surface-elevated"
                }`}
                title={t("coverage.title")}
                aria-label={t("coverage.title")}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {activeFilterCount > 0 && (
                  <span className="bg-azure/20 text-azure-text py-0.2 rounded-full px-1.5 font-mono text-[10px] font-semibold">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown
                  className={`h-3 w-3 transition-transform duration-200 ${isFiltersExpanded ? "rotate-180" : ""}`}
                />
              </button>
            </div>

            {/* Collapsible Filters & 5x5 District Coverage Grid */}
            {isFiltersExpanded && (
              <div className="border-hairline bg-surface/95 border-t transition-all">
                <FilterBar
                  filters={filters}
                  onFilterChange={setFilters}
                  onResetFilters={handleResetFilters}
                />

                <div className="border-hairline bg-surface/50 border-t px-4 py-2.5">
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
              </div>
            )}
          </div>

          {/* Live In-View Counter Header */}
          <div className="border-hairline bg-surface-elevated/40 text-text-muted flex items-center justify-between border-b px-4 py-2 font-mono text-[11px]">
            <div className="flex items-center gap-2">
              <span>{t("results.inView", { count: countDisplay })}</span>
              {filters.district !== "all" && (
                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, district: "all" }))}
                  className="border-hairline bg-surface text-azure-text hover:border-azure flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px]"
                  title="Clear district filter"
                >
                  <span className="capitalize">{filters.district}</span>
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
            {isError && (
              <button
                type="button"
                onClick={reload}
                className="text-azure cursor-pointer text-xs hover:underline"
              >
                {t("retry")}
              </button>
            )}
          </div>

          {/* Scrollable Merchant List - Gets Full Vertical Space */}
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

          {/* Panel Footer: Add My Shop CTA */}
          <div className="border-hairline bg-surface border-t p-3">
            <button
              type="button"
              onClick={handleAddShopClick}
              className="bg-primary hover:bg-primary-hover active:bg-primary-press text-primary-foreground focus-visible:outline-text flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-sm text-xs font-bold transition-all focus-visible:ring-2 focus-visible:outline-none"
            >
              <Plus className="h-4 w-4" />
              {t("addShop")}
            </button>
          </div>
        </aside>

        {/* Main Map Viewport */}
        <div className="relative h-full min-h-0 w-full flex-1 overflow-hidden">
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
                id="map-mobile-search"
                name="search"
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
                  className="border-hairline bg-surface text-text hover:bg-surface-elevated flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-sm border shadow-md"
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
                    className="bg-primary hover:bg-primary-hover active:bg-primary-press text-primary-foreground focus-visible:outline-text cursor-pointer rounded-sm px-3 py-1.5 text-xs font-bold transition-all"
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
              className="border-hairline bg-surface/90 text-text hover:bg-surface flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-sm border font-mono text-xs shadow-lg backdrop-blur-md"
            >
              <ChevronUp className="text-azure h-4 w-4" />
              <span>{t("results.inView", { count: countDisplay })}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
