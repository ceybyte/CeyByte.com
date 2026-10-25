"use client";

import { createContext, useContext, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { DashboardNav } from "./DashboardNav";
import { EmptyDashboard } from "./EmptyDashboard";
import { fetchDashboardListing } from "../api";
import type { LatestRelease, MerchantListing } from "../types";
import { Loader2 } from "lucide-react";

export interface DashboardContextValue {
  listing: MerchantListing;
  latestRelease: LatestRelease | null;
  onListingUpdated: (updated: MerchantListing) => void;
  refreshListing: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used within DashboardShell");
  }
  return ctx;
}

interface DashboardShellProps {
  locale: string;
  children: React.ReactNode;
  copy: {
    emptyTitle: string;
    emptyBody: string;
  };
}

export function DashboardShell({ locale, children, copy }: DashboardShellProps) {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [listing, setListing] = useState<MerchantListing | null>(null);
  const [latestRelease, setLatestRelease] = useState<LatestRelease | null>(null);
  const [loadingListing, setLoadingListing] = useState(true);

  const loadListing = useCallback(async () => {
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
  }, [locale, router]);

  useEffect(() => {
    if (!sessionPending && !session) {
      router.push(`/${locale}/login`);
      return;
    }

    if (session) {
      void loadListing();
    }
  }, [session, sessionPending, locale, router, loadListing]);

  if (sessionPending || loadingListing) {
    return (
      <div className="bg-canvas flex min-h-[calc(100vh-var(--header-h))] items-center justify-center">
        <div className="text-muted-foreground flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
          <span className="font-mono text-xs tracking-widest uppercase">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-canvas flex min-h-[calc(100vh-var(--header-h))] flex-col md:flex-row">
      <DashboardNav locale={locale} />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {!listing ? (
          <EmptyDashboard locale={locale} onClaimSuccess={loadListing} copy={copy} />
        ) : (
          <DashboardContext.Provider
            value={{
              listing,
              latestRelease,
              onListingUpdated: (updated) => setListing(updated),
              refreshListing: loadListing,
            }}
          >
            {children}
          </DashboardContext.Provider>
        )}
      </main>
    </div>
  );
}
