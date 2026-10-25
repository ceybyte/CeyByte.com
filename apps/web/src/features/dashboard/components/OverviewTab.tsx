"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  ExternalLink,
  Store,
  Sparkles,
  ArrowRight,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import type { LatestRelease, MerchantListing } from "../types";
import { updateListing } from "../api";
import { toast } from "sonner";

interface OverviewTabProps {
  locale: string;
  listing: MerchantListing;
  latestRelease: LatestRelease | null;
  onListingUpdated: (updated: MerchantListing) => void;
  copy: {
    overviewTitle: string;
    statusListed: string;
    statusPrivate: string;
    statusHidden: string;
    statusHiddenBody: string;
    supporter: string;
    updateAvailable: string;
    updateCta: string;
  };
}

export function OverviewTab({
  locale,
  listing,
  latestRelease,
  onListingUpdated,
  copy,
}: OverviewTabProps) {
  const [togglingVisibility, setTogglingVisibility] = useState(false);

  const handleToggleVisibility = async () => {
    setTogglingVisibility(true);
    const nextVal = !listing.isPublicOnMap;
    try {
      const updated = await updateListing({ isPublicOnMap: nextVal });
      onListingUpdated(updated);
      toast.success(
        nextVal
          ? "Shop is now visible on the public map."
          : "Shop hidden from the public map.",
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update visibility");
    } finally {
      setTogglingVisibility(false);
    }
  };

  const formattedSupporterDate = listing.supporterSince
    ? new Date(listing.supporterSince).toLocaleDateString(locale === "en" ? "en-US" : locale, {
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Hidden Status Warning Banner */}
      {listing.status === "hidden" && (
        <div className="p-4 rounded-lg bg-amber-950/40 border border-amber-800/60 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-amber-200">
              {copy.statusHidden}
            </h4>
            <p className="text-xs text-amber-300/80 mt-0.5 leading-relaxed">
              {copy.statusHiddenBody}
            </p>
          </div>
        </div>
      )}

      {/* Main Shop Summary Card */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <h2 className="text-2xl font-bold text-foreground tracking-tight">
                {listing.shopName}
              </h2>
              {listing.isSupporter && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>
                    {copy.supporter.replace("{monthYear}", formattedSupporterDate)}
                  </span>
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground flex items-center gap-2 capitalize">
              <span>{listing.category}</span>
              <span>·</span>
              <span>
                {listing.city}, {listing.district}
              </span>
            </p>
          </div>

          {/* Live Status Pill & Map Visibility Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            {listing.status === "hidden" ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>{copy.statusHidden}</span>
              </span>
            ) : listing.isPublicOnMap ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>{copy.statusListed}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                <span>{copy.statusPrivate}</span>
              </span>
            )}

            {listing.status !== "hidden" && (
              <button
                type="button"
                onClick={handleToggleVisibility}
                disabled={togglingVisibility}
                className="px-3 py-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border rounded text-xs font-medium flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                {togglingVisibility && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>{listing.isPublicOnMap ? "Hide from map" : "Show on map"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Details & Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 text-xs">
          <div>
            <span className="text-muted-foreground block mb-0.5">Contact</span>
            <span className="font-mono text-foreground">{listing.phone}</span>
            {listing.whatsapp && (
              <span className="block text-muted-foreground font-mono">
                WA: {listing.whatsapp}
              </span>
            )}
            {listing.telegram && (
              <span className="block text-muted-foreground font-mono">
                TG: {listing.telegram}
              </span>
            )}
          </div>

          <div>
            <span className="text-muted-foreground block mb-0.5">Location pin</span>
            <span className="font-mono text-foreground">
              {listing.lat.toFixed(4)}, {listing.lng.toFixed(4)}
            </span>
            <span className="block text-muted-foreground capitalize">
              Source: {listing.locationSource}
            </span>
          </div>

          <div className="flex flex-col justify-center sm:items-end gap-2">
            <Link
              href={`/${locale}/map?q=${encodeURIComponent(listing.shopName)}`}
              className="inline-flex items-center gap-1.5 text-cyan-400 hover:underline"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>View pin on live map</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <Link
              href={`/${locale}/dashboard/listing`}
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Edit listing details</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Release Notice Strip */}
      {latestRelease && (
        <div className="p-4 rounded-lg bg-card border border-border flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
              <Store className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">
                {copy.updateAvailable.replace("{version}", latestRelease.version)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Keep CB POS updated on your cashiering PC for the latest tax tables and fixes.
              </p>
            </div>
          </div>

          <Link
            href={`/${locale}/releases`}
            className="px-3 py-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border rounded text-xs font-medium whitespace-nowrap transition"
          >
            {copy.updateCta}
          </Link>
        </div>
      )}
    </div>
  );
}
