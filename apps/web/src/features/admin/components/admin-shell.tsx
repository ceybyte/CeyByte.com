"use client";

import React, { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { AdminTopbar } from "./admin-topbar";
import { AdminNav } from "./admin-nav";
import { fetchOverview, OverviewData } from "../api";
import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewData | null>(null);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      // In dev or test environments, allow bypass if header/cookie or test mock is set
      try {
        const data = await fetchOverview();
        if (mounted) {
          setOverview(data);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (mounted) {
          // Strict 404 for non-admins visiting /admin (AC-08.1)
          const status = (err as { status?: number })?.status;
          if (status === 404 || status === 401 || status === 403) {
            notFound();
          } else {
            // In dev mode without running API server or during static build
            setLoading(false);
          }
        }
      }
    }

    checkAuth();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-canvas text-text-muted flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="text-azure h-6 w-6 animate-spin" />
          <span className="font-mono text-xs">Authenticating admin session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-canvas text-text-primary flex min-h-screen flex-col antialiased">
      <AdminTopbar />
      <div className="flex flex-1">
        <AdminNav
          counts={{
            merchants: overview?.merchants,
            donations: overview?.pendingSlips,
            feedback: overview?.openTickets,
          }}
        />
        <main className="flex-1 overflow-x-auto p-6">{children}</main>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}
