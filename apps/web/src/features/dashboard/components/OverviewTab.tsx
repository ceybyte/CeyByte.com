"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, ExternalLink, Store, Sparkles, ArrowRight, Loader2, AlertTriangle } from "lucide-react";
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

export function OverviewTab({ locale, listing, latestRelease, onListingUpdated, copy }: OverviewTabProps) {
  const [togglingVisibility, setTogglingVisibility] = useState(false);

  const handleToggleVisibility = async () => {
    setTogglingVisibility(true);
    const nextVal = !listing.isPublicOnMap;
    try {
      const updated = await updateListing({ isPublicOnMap: nextVal });
      onListingUpdated(updated);
      toast.success(nextVal ? "Shop is now visible on the public map." : "Shop hidden from the public map.");
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
    <div className="max-w-4xl space-y-6">
      {/* Hidden Status Warning Banner */}
      {listing.status === "hidden" && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-800/60 bg-amber-950/40 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <h4 className="text-sm font-semibold text-amber-200">{copy.statusHidden}</h4>
            <p className="mt-0.5 text-xs leading-relaxed text-amber-300/80">{copy.statusHiddenBody}</p>
          </div>
        </div>
      )}

      {/* Main Shop Summary Card */}
      <div className="bg-card border-border relative overflow-hidden rounded-lg border p-6 shadow-sm">
        <div className="border-border flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-1.5 flex items-center gap-2.5">
              <h2 className="text-foreground text-2xl font-bold tracking-tight">{listing.shopName}</h2>
              {listing.isSupporter && (
                <span className="inline-flex items-center gap-1.5 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-400">
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  <span>{copy.supporter.replace("{monthYear}", formattedSupporterDate)}</span>
                </span>
              )}
            </div>

            <p className="text-muted-foreground flex items-center gap-2 text-xs capitalize">
              <span>{listing.category}</span>
              <span>·</span>
              <span>
                {listing.city}, {listing.district}
              </span>
            </p>
          </div>

          {/* Live Status Pill & Map Visibility Toggle */}
          <div className="flex shrink-0 items-center gap-3">
            {listing.status === "hidden" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span>{copy.statusHidden}</span>
              </span>
            ) : listing.isPublicOnMap ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
                <span>{copy.statusListed}</span>
              </span>
            ) : (
              <span className="bg-muted text-muted-foreground border-border inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
                <span className="bg-muted-foreground h-1.5 w-1.5 rounded-full" />
                <span>{copy.statusPrivate}</span>
              </span>
            )}

            {listing.status !== "hidden" && (
              <button
                type="button"
                onClick={handleToggleVisibility}
                disabled={togglingVisibility}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border flex cursor-pointer items-center gap-1.5 rounded border px-3 py-1 text-xs font-medium transition disabled:opacity-50"
              >
                {togglingVisibility && <Loader2 className="h-3 w-3 animate-spin" />}
                <span>{listing.isPublicOnMap ? "Hide from map" : "Show on map"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Details & Quick Links */}
        <div className="grid grid-cols-1 gap-4 pt-5 text-xs sm:grid-cols-3">
          <div>
            <span className="text-muted-foreground mb-0.5 block">Contact</span>
            <span className="text-foreground font-mono">{listing.phone}</span>
            {listing.whatsapp && (
              <span className="text-muted-foreground block font-mono">WA: {listing.whatsapp}</span>
            )}
            {listing.telegram && (
              <span className="text-muted-foreground block font-mono">TG: {listing.telegram}</span>
            )}
          </div>

          <div>
            <span className="text-muted-foreground mb-0.5 block">Location pin</span>
            <span className="text-foreground font-mono">
              {listing.lat.toFixed(4)}, {listing.lng.toFixed(4)}
            </span>
            <span className="text-muted-foreground block capitalize">Source: {listing.locationSource}</span>
          </div>

          <div className="flex flex-col justify-center gap-2 sm:items-end">
            <Link
              href={`/${locale}/map?q=${encodeURIComponent(listing.shopName)}`}
              className="inline-flex items-center gap-1.5 text-cyan-400 hover:underline"
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>View pin on live map</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
            <Link
              href={`/${locale}/dashboard/listing`}
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
            >
              <Store className="h-3.5 w-3.5" />
              <span>Edit listing details</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Release Notice Strip */}
      {latestRelease && (
        <div className="bg-card border-border flex items-center justify-between gap-4 rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-cyan-500/20 bg-cyan-500/10">
              <Store className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-foreground text-xs font-medium">
                {copy.updateAvailable.replace("{version}", latestRelease.version)}
              </p>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                Keep CB POS updated on your cashiering PC for the latest tax tables and fixes.
              </p>
            </div>
          </div>

          <Link
            href={`/${locale}/releases`}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border rounded border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition"
          >
            {copy.updateCta}
          </Link>
        </div>
      )}
    </div>
  );
}
