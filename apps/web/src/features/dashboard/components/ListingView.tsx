"use client";

import { useDashboard } from "./DashboardShell";
import { ListingTab } from "./ListingTab";
import { EmptyDashboard } from "./EmptyDashboard";
import type { ComponentProps } from "react";

type Copy = ComponentProps<typeof ListingTab>["copy"];

export function ListingView({ locale, copy }: { locale: string; copy: Copy }) {
  const { listing, onListingUpdated, refreshListing, emptyCopy } = useDashboard();

  if (!listing) {
    return <EmptyDashboard locale={locale} onClaimSuccess={refreshListing} copy={emptyCopy} />;
  }

  return <ListingTab listing={listing} onListingUpdated={onListingUpdated} copy={copy} />;
}
