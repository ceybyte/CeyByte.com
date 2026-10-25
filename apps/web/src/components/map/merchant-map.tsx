/* eslint-disable no-restricted-syntax */
"use client";

import React, { useEffect, useRef, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import * as pmtiles from "pmtiles";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import "maplibre-gl/dist/maplibre-gl.css";
import { buildBasemapStyle } from "./style";
import { formatPopupHtml } from "./map-popup";
import { MapControls } from "./map-controls";
import type { GeoFeature } from "./map-types";

type MapLibreMap = maplibregl.Map;
type GeoJSONSource = maplibregl.GeoJSONSource;
type LngLatBoundsLike = maplibregl.LngLatBoundsLike;

// Sri Lanka geographic boundaries (01-PRD §FR-04.1)
const SRI_LANKA_MAX_BOUNDS: LngLatBoundsLike = [
  [79.4, 5.7], // southwest [lng, lat]
  [82.1, 10.1], // northeast [lng, lat]
];

const SRI_LANKA_CENTER: [number, number] = [80.7, 7.87];
const DEFAULT_ZOOM = 7.3;

// Register PMTiles protocol globally once
let protocolRegistered = false;
function ensurePmtilesProtocol() {
  if (!protocolRegistered) {
    const protocol = new pmtiles.Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
    protocolRegistered = true;
  }
}

interface MerchantMapProps {
  features: GeoFeature[];
  selectedShopId: string | null;
  onSelectShop: (shopId: string | null) => void;
  onVisibleCountChange?: (count: number) => void;
  flyToCoords?: { lat: number; lng: number } | null;
}

export function MerchantMap({
  features,
  selectedShopId,
  onSelectShop,
  onVisibleCountChange,
  flyToCoords,
}: MerchantMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const { resolvedTheme } = useTheme();
  const t = useTranslations("map");
  const tCategories = useTranslations("categories");

  const prefersReducedMotion = useCallback(() => {
    return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Labels for localized popup HTML
  const getPopupLabels = useCallback(() => {
    return {
      since: t("popup.since"),
      supporter: t("popup.supporter"),
      directions: t("popup.directions"),
      report: t("popup.report"),
    };
  }, [t]);

  // Updates visible features count on map movement
  const updateVisibleCount = useCallback(() => {
    const map = mapRef.current;
    if (!map || !onVisibleCountChange) return;

    try {
      const bounds = map.getBounds();
      let visibleCount = 0;

      for (const f of features) {
        const [lng, lat] = f.geometry.coordinates;
        if (bounds.contains([lng, lat])) {
          visibleCount++;
        }
      }

      onVisibleCountChange(visibleCount);
    } catch {
      // Ignore calculation errors during teardown
    }
  }, [features, onVisibleCountChange]);

  // Add source and layers to MapLibre instance
  const setupLayers = useCallback(
    (map: MapLibreMap) => {
      if (map.getSource("merchants")) {
        return;
      }

      map.addSource("merchants", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features,
        },
        cluster: true,
        clusterRadius: 50,
        clusterMaxZoom: 13,
        clusterProperties: {
          has_supporter: ["any", ["==", ["get", "isSupporter"], true]],
          supporter_count: ["+", ["case", ["==", ["get", "isSupporter"], true], 1, 0]],
        },
      });

      // Cluster circles with stepped radius and supporter gold ring (DESIGN §8.9)
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "merchants",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": ["case", ["get", "has_supporter"], "#2A2A2D", "#222225"],
          "circle-stroke-color": ["case", ["get", "has_supporter"], "#FFD700", "#0393DD"],
          "circle-stroke-width": ["case", ["get", "has_supporter"], 2, 1],
          "circle-radius": [
            "step",
            ["get", "point_count"],
            18,
            10,
            24,
            100,
            32,
          ],
        },
      });

      // Cluster count labels (mono)
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "merchants",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["Noto Sans Regular", "Inter Regular"],
          "text-size": 12,
        },
        paint: {
          "text-color": "#FFFFFF",
        },
      });

      // Unclustered point soft halo
      map.addLayer({
        id: "unclustered-point-halo",
        type: "circle",
        source: "merchants",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": [
            "case",
            ["==", ["get", "isSupporter"], true],
            "#FFD700",
            "#0393DD",
          ],
          "circle-radius": 18,
          "circle-blur": 0.6,
          "circle-opacity": 0.25,
        },
      });

      // Unclustered point pin (standard azure 10px vs supporter gold 12px)
      map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "merchants",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": [
            "case",
            ["==", ["get", "isSupporter"], true],
            "#FFD700",
            "#0393DD",
          ],
          "circle-radius": [
            "case",
            ["==", ["get", "isSupporter"], true],
            6,
            5,
          ],
          "circle-stroke-color": "#18181B",
          "circle-stroke-width": 2,
        },
      });

      // Cluster expansion on click
      map.on("click", "clusters", async (e) => {
        const clusterFeatures = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
        const clusterId = clusterFeatures[0]?.properties?.cluster_id;
        const source = map.getSource("merchants") as GeoJSONSource;

        if (clusterId && source && typeof source.getClusterExpansionZoom === "function") {
          try {
            const zoom = await source.getClusterExpansionZoom(clusterId);
            const coords = (clusterFeatures[0]?.geometry as unknown as { coordinates: [number, number] })?.coordinates;
            if (coords) {
              if (prefersReducedMotion()) {
                map.jumpTo({ center: coords, zoom });
              } else {
                map.easeTo({ center: coords, zoom, duration: 400 });
              }
            }
          } catch {
            // Expansion zoom failed
          }
        }
      });

      // Open popup on point click
      map.on("click", "unclustered-point", (e) => {
        const pointFeatures = map.queryRenderedFeatures(e.point, { layers: ["unclustered-point"] });
        const feat = pointFeatures[0];
        if (!feat || !feat.properties) return;

        const coords = (feat.geometry as unknown as { coordinates: [number, number] }).coordinates.slice() as [number, number];
        const p = feat.properties;

        let localizedCat = p.category;
        try {
          localizedCat = tCategories(p.category as never);
        } catch {
          localizedCat = p.category;
        }

        const popupData = {
          id: p.id,
          shopName: p.shopName,
          category: localizedCat,
          district: p.district,
          city: p.city,
          isSupporter: Boolean(p.isSupporter),
          since: p.since,
          lat: coords[1],
          lng: coords[0],
        };

        if (popupRef.current) {
          popupRef.current.remove();
        }

        const popup = new maplibregl.Popup({
          closeButton: true,
          closeOnClick: false,
          maxWidth: "280px",
          offset: 12,
        })
          .setLngLat(coords)
          .setHTML(formatPopupHtml(popupData, getPopupLabels()))
          .addTo(map);

        popupRef.current = popup;
        onSelectShop(p.id);

        popup.on("close", () => {
          onSelectShop(null);
        });
      });

      // Pointer cursors on hover
      map.on("mouseenter", "clusters", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "clusters", () => {
        map.getCanvas().style.cursor = "";
      });
      map.on("mouseenter", "unclustered-point", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "unclustered-point", () => {
        map.getCanvas().style.cursor = "";
      });

      map.on("moveend", updateVisibleCount);
      updateVisibleCount();
    },
    [features, onSelectShop, prefersReducedMotion, getPopupLabels, tCategories, updateVisibleCount],
  );

  // Initialize MapLibre map on mount
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    ensurePmtilesProtocol();

    const theme = (resolvedTheme === "light" ? "light" : "dark") as "dark" | "light";
    const style = buildBasemapStyle(theme);

    const map = new maplibregl.Map({
      container: containerRef.current,
      style,
      center: SRI_LANKA_CENTER,
      zoom: DEFAULT_ZOOM,
      minZoom: 6.5,
      maxZoom: 16,
      maxBounds: SRI_LANKA_MAX_BOUNDS,
      attributionControl: {
        compact: false,
        customAttribution: "© OpenStreetMap contributors · Protomaps",
      },
      dragRotate: false,
      touchPitch: false,
      pitchWithRotate: false,
    });

    mapRef.current = map;

    map.on("load", () => {
      setupLayers(map);
    });

    return () => {
      if (popupRef.current) {
        popupRef.current.remove();
      }
      map.remove();
      mapRef.current = null;
    };
  }, [resolvedTheme, setupLayers]);

  // Sync data whenever filtered features change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const source = map.getSource("merchants") as GeoJSONSource | undefined;
    if (source && typeof source.setData === "function") {
      source.setData({
        type: "FeatureCollection",
        features,
      });
      updateVisibleCount();
    }
  }, [features, updateVisibleCount]);

  // Respond to programmatic fly-to requests (e.g. from district grid or list click)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyToCoords) return;

    const targetCenter: [number, number] = [flyToCoords.lng, flyToCoords.lat];

    if (prefersReducedMotion()) {
      map.jumpTo({ center: targetCenter, zoom: 11 });
    } else {
      map.flyTo({ center: targetCenter, zoom: 11, duration: 600 });
    }
  }, [flyToCoords, prefersReducedMotion]);

  // Open popup when selectedShopId changes from external source (e.g. shop list item click)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedShopId) return;

    const feat = features.find((f) => f.properties.id === selectedShopId);
    if (!feat) return;

    const coords = feat.geometry.coordinates;
    const p = feat.properties;

    let localizedCat = p.category;
    try {
      localizedCat = tCategories(p.category as never);
    } catch {
      localizedCat = p.category;
    }

    const popupData = {
      id: p.id,
      shopName: p.shopName,
      category: localizedCat,
      district: p.district,
      city: p.city,
      isSupporter: p.isSupporter,
      since: p.since,
      lat: coords[1],
      lng: coords[0],
    };

    if (popupRef.current) {
      popupRef.current.remove();
    }

    const popup = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: false,
      maxWidth: "280px",
      offset: 12,
    })
      .setLngLat(coords)
      .setHTML(formatPopupHtml(popupData, getPopupLabels()))
      .addTo(map);

    popupRef.current = popup;

    if (prefersReducedMotion()) {
      map.jumpTo({ center: coords, zoom: Math.max(map.getZoom(), 12) });
    } else {
      map.flyTo({ center: coords, zoom: Math.max(map.getZoom(), 12), duration: 500 });
    }

    popup.on("close", () => {
      onSelectShop(null);
    });
  }, [selectedShopId, features, prefersReducedMotion, getPopupLabels, tCategories, onSelectShop]);

  const handleZoomIn = () => {
    const map = mapRef.current;
    if (!map) return;
    map.zoomIn({ duration: 200 });
  };

  const handleZoomOut = () => {
    const map = mapRef.current;
    if (!map) return;
    map.zoomOut({ duration: 200 });
  };

  const handleResetBounds = () => {
    const map = mapRef.current;
    if (!map) return;
    if (prefersReducedMotion()) {
      map.jumpTo({ center: SRI_LANKA_CENTER, zoom: DEFAULT_ZOOM });
    } else {
      map.flyTo({ center: SRI_LANKA_CENTER, zoom: DEFAULT_ZOOM, duration: 600 });
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-canvas">
      <div ref={containerRef} className="h-full w-full" aria-label="Interactive map of Sri Lanka" />
      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetBounds={handleResetBounds}
      />
    </div>
  );
}
