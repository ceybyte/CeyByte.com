"use client";

import { useDashboard } from "./DashboardShell";
import { ListingTab } from "./ListingTab";
import type { ComponentProps } from "react";

type Copy = ComponentProps<typeof ListingTab>["copy"];

export function ListingView({ copy }: { copy: Copy }) {
  const { listing, onListingUpdated } = useDashboard();
  return <ListingTab listing={listing} onListingUpdated={onListingUpdated} copy={copy} />;
}
