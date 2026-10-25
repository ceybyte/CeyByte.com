"use client";

import React, { useRef, useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { MapPin, Locate, AlertCircle } from "lucide-react";
import { SRI_LANKA_BOUNDS } from "@cbpos/shared/enums";
import type { LocationSource } from "@cbpos/shared/enums";
import { Button } from "@/components/ui/button";

export const DISTRICT_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  ampara: { lat: 7.28, lng: 81.67 },
  anuradhapura: { lat: 8.31, lng: 80.4 },
  badulla: { lat: 6.99, lng: 81.05 },
  batticaloa: { lat: 7.71, lng: 81.7 },
  colombo: { lat: 6.9271, lng: 79.8612 },
  galle: { lat: 6.0535, lng: 80.221 },
  gampaha: { lat: 7.09, lng: 79.99 },
  hambantota: { lat: 6.12, lng: 81.12 },
  jaffna: { lat: 9.66, lng: 80.02 },
  kalutara: { lat: 6.58, lng: 79.96 },
  kandy: { lat: 7.2906, lng: 80.6337 },
  kegalle: { lat: 7.25, lng: 80.34 },
  kilinochchi: { lat: 9.38, lng: 80.4 },
  kurunegala: { lat: 7.48, lng: 80.36 },
  mannar: { lat: 8.98, lng: 79.9 },
  matale: { lat: 7.47, lng: 80.62 },
  matara: { lat: 5.95, lng: 80.53 },
  monaragala: { lat: 6.87, lng: 81.35 },
  mullaitivu: { lat: 9.26, lng: 80.81 },
  "nuwara-eliya": { lat: 6.97, lng: 80.78 },
  polonnaruwa: { lat: 7.94, lng: 81.0 },
  puttalam: { lat: 8.03, lng: 79.82 },
  ratnapura: { lat: 6.68, lng: 80.4 },
  trincomalee: { lat: 8.58, lng: 81.23 },
  vavuniya: { lat: 8.75, lng: 80.5 },
};

interface MiniMapProps {
  lat: number;
  lng: number;
  onChange: (coords: { lat: number; lng: number; source: LocationSource }) => void;
  error?: string;
}

export function MiniMap({ lat, lng, onChange, error }: MiniMapProps) {
  const t = useTranslations("gate");
  const containerRef = useRef<HTMLDivElement>(null);
  const [detectStatus, setDetectStatus] = useState<"idle" | "loading" | "denied" | "approx">("idle");

  const { minLat, maxLat, minLng, maxLng } = SRI_LANKA_BOUNDS;

  // Convert lat/lng to percentage within viewport (0 to 100%)
  const pinPercent = useMemo(() => {
    const clampedLat = Math.min(Math.max(lat, minLat), maxLat);
    const clampedLng = Math.min(Math.max(lng, minLng), maxLng);
    const x = ((clampedLng - minLng) / (maxLng - minLng)) * 100;
    const y = ((maxLat - clampedLat) / (maxLat - minLat)) * 100;
    return { x: Math.min(Math.max(x, 2), 98), y: Math.min(Math.max(y, 2), 98) };
  }, [lat, lng, minLat, maxLat, minLng, maxLng]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const clientX = e.clientX;
      const clientY = e.clientY;

      const updatePosition = (xPos: number, yPos: number) => {
        const xRel = Math.min(Math.max((xPos - rect.left) / rect.width, 0), 1);
        const yRel = Math.min(Math.max((yPos - rect.top) / rect.height, 0), 1);

        const newLng = minLng + xRel * (maxLng - minLng);
        const newLat = maxLat - yRel * (maxLat - minLat);

        onChange({
          lat: Number(newLat.toFixed(5)),
          lng: Number(newLng.toFixed(5)),
          source: "pin",
        });
      };

      updatePosition(clientX, clientY);

      const onPointerMove = (moveEv: PointerEvent) => {
        updatePosition(moveEv.clientX, moveEv.clientY);
      };

      const onPointerUp = () => {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    },
    [minLat, maxLat, minLng, maxLng, onChange],
  );

  const handleDetectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setDetectStatus("denied");
      return;
    }

    setDetectStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const uLat = pos.coords.latitude;
        const uLng = pos.coords.longitude;

        if (uLat >= minLat && uLat <= maxLat && uLng >= minLng && uLng <= maxLng) {
          onChange({
            lat: Number(uLat.toFixed(5)),
            lng: Number(uLng.toFixed(5)),
            source: "gps",
          });
          setDetectStatus("idle");
        } else {
          setDetectStatus("approx");
        }
      },
      () => {
        setDetectStatus("denied");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, [minLat, maxLat, minLng, maxLng, onChange]);

  return (
    <div className="flex flex-col gap-2">
      {/* Detect location secondary button */}
      <div className="flex items-center justify-between">
        <span className="text-text-muted text-xs">{t("pin.help")}</span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="text-xs"
          onClick={handleDetectLocation}
          loading={detectStatus === "loading"}
        >
          <Locate className="size-3.5" />
          <span>{t("detect.cta")}</span>
        </Button>
      </div>

      {/* Geolocation feedback note */}
      {detectStatus === "denied" && (
        <div className="border-warning/30 bg-surface-elevated flex items-start gap-2 rounded-sm border p-2 text-xs">
          <AlertCircle className="text-warning size-4 shrink-0 mt-0.5" />
          <span className="text-text-muted">{t("detect.denied")}</span>
        </div>
      )}

      {detectStatus === "approx" && (
        <div className="border-warning/30 bg-surface-elevated flex items-start gap-2 rounded-sm border p-2 text-xs">
          <AlertCircle className="text-warning size-4 shrink-0 mt-0.5" />
          <span className="text-text-muted">{t("detect.approx")}</span>
        </div>
      )}

      {/* Interactive Sri Lanka Map Container (200px tall) */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        role="application"
        aria-label="Sri Lanka location map. Click or drag to place your shop's pin."
        className="border-hairline bg-canvas relative h-[200px] w-full cursor-crosshair overflow-hidden rounded-md border select-none touch-none"
      >
        {/* Subtle coordinate grid lines */}
        <div className="pointer-events-none absolute inset-0 opacity-15">
          <div className="border-hairline-grid absolute inset-y-0 left-1/4 border-r border-dashed" />
          <div className="border-hairline-grid absolute inset-y-0 left-2/4 border-r border-dashed" />
          <div className="border-hairline-grid absolute inset-y-0 left-3/4 border-r border-dashed" />
          <div className="border-hairline-grid absolute inset-x-0 top-1/4 border-b border-dashed" />
          <div className="border-hairline-grid absolute inset-x-0 top-2/4 border-b border-dashed" />
          <div className="border-hairline-grid absolute inset-x-0 top-3/4 border-b border-dashed" />
        </div>

        {/* Stylized Sri Lanka SVG Map Silhouette */}
        <svg
          viewBox="0 0 100 160"
          preserveAspectRatio="xMidYMid meet"
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          {/* Sri Lanka Landmass Path */}
          <path
            d="M 52,12 C 48,15 45,20 44,26 C 40,28 36,32 35,38 C 34,44 38,50 37,58 C 34,66 31,76 30,86 C 30,98 33,108 38,118 C 42,126 47,136 53,142 C 58,146 63,144 67,138 C 73,130 76,118 78,106 C 80,94 82,82 78,70 C 75,60 70,52 68,42 C 67,32 68,22 62,15 C 58,10 55,10 52,12 Z"
            className="fill-surface-elevated stroke-hairline"
            strokeWidth="1.5"
          />
          {/* Jaffna Peninsula Feature */}
          <path
            d="M 44,20 C 46,14 49,8 54,6 C 58,8 60,14 56,18 Z"
            className="fill-surface-elevated stroke-hairline"
            strokeWidth="1.5"
          />
        </svg>

        {/* Draggable Azure Pin Marker with Animated Rim Glow */}
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full transition-all duration-75"
          style={{
            left: `${pinPercent.x}%`,
            top: `${pinPercent.y}%`,
          }}
        >
          {/* Pulse Ripple */}
          <span className="bg-azure absolute -bottom-1 left-1/2 size-3 -translate-x-1/2 animate-ping rounded-full opacity-60" />
          {/* Base Pin Anchor Dot */}
          <span className="bg-text absolute -bottom-0.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full shadow-sm" />
          {/* Pin Icon with Azure Gradient Fills */}
          <div className="bg-azure text-text flex size-7 items-center justify-center rounded-full shadow-lg ring-2 ring-white/20">
            <MapPin className="size-4 fill-current stroke-1" />
          </div>
        </div>

        {/* Coordinate Readout Badge in bottom-left */}
        <div className="bg-surface/90 border-hairline text-text-muted pointer-events-none absolute bottom-2 left-2 rounded px-2 py-0.5 font-mono text-[10px] backdrop-blur-xs">
          {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
        </div>
      </div>

      {error && <span className="text-error text-xs">{error}</span>}
    </div>
  );
}
