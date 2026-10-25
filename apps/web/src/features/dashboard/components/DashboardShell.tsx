"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { DashboardNav } from "./DashboardNav";
import { EmptyDashboard } from "./EmptyDashboard";
import { fetchDashboardListing } from "../api";
import type { LatestRelease, MerchantListing } from "../types";
import { Loader2 } from "lucide-react";

interface DashboardShellProps {
  locale: string;
  children?: React.ReactNode;
  renderOverview?: (props: {
    listing: MerchantListing;
    latestRelease: LatestRelease | null;
    onListingUpdated: (updated: MerchantListing) => void;
  }) => React.ReactNode;
  copy: {
    emptyTitle: string;
    emptyBody: string;
  };
}

export function DashboardShell({
  locale,
  children,
  renderOverview,
  copy,
}: DashboardShellProps) {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [listing, setListing] = useState<MerchantListing | null>(null);
  const [latestRelease, setLatestRelease] = useState<LatestRelease | null>(null);
  const [loadingListing, setLoadingListing] = useState(true);

  const loadListing = async () => {
    try {
      setLoadingListing(true);
      const res = await fetchDashboardListing();
      setListing(res.listing);
      setLatestRelease(res.latestRelease);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "UNAUTHENTICATED") {
        router.push(`/${locale}/login`);
      }
    } finally {
      setLoadingListing(false);
    }
  };

  useEffect(() => {
    if (!sessionPending && !session) {
      router.push(`/${locale}/login`);
      return;
    }

    if (session) {
      loadListing();
    }
  }, [session, sessionPending]);

  if (sessionPending || loadingListing) {
    return (
      <div className="min-h-[calc(100vh-var(--header-h))] flex items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
          <span className="text-xs font-mono uppercase tracking-widest">
            Loading dashboard...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-canvas min-h-[calc(100vh-var(--header-h))] flex flex-col md:flex-row">
      <DashboardNav locale={locale} />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {!listing ? (
          <EmptyDashboard
            locale={locale}
            onClaimSuccess={loadListing}
            copy={copy}
          />
        ) : renderOverview ? (
          renderOverview({
            listing,
            latestRelease,
            onListingUpdated: (updated) => setListing(updated),
          })
        ) : (
          children
        )}
      </main>
    </div>
  );
}
