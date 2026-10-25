"use client";

import { useDashboard } from "./DashboardShell";
import { OverviewTab } from "./OverviewTab";
import type { ComponentProps } from "react";

type Copy = ComponentProps<typeof OverviewTab>["copy"];

export function OverviewView({ locale, copy }: { locale: string; copy: Copy }) {
  const { listing, latestRelease, onListingUpdated } = useDashboard();
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
