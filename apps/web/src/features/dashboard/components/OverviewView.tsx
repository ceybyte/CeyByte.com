"use client";

import { useDashboard } from "./DashboardShell";
import { OverviewTab } from "./OverviewTab";
import { EmptyDashboard } from "./EmptyDashboard";
import type { ComponentProps } from "react";

type Copy = ComponentProps<typeof OverviewTab>["copy"];

export function OverviewView({ locale, copy }: { locale: string; copy: Copy }) {
  const { listing, latestRelease, onListingUpdated, refreshListing, emptyCopy } = useDashboard();

  if (!listing) {
    return <EmptyDashboard locale={locale} onClaimSuccess={refreshListing} copy={emptyCopy} />;
  }

  return (
    <OverviewTab
      locale={locale}
      listing={listing}
      latestRelease={latestRelease}
      onListingUpdated={onListingUpdated}
      copy={copy}
    />
  );
}
