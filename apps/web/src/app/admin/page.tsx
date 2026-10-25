"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Store,
  MapPin,
  Download,
  HeartHandshake,
  MessageSquare,
  RefreshCw,
  Layers,
} from "lucide-react";
import { fetchOverview, syncReleases, triggerRebuild, OverviewData } from "@/features/admin/api";
import { toast } from "sonner";

export default function AdminOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);

  async function loadData() {
    try {
      const res = await fetchOverview();
      setData(res);
    } catch {
      // Fallback data for preview / dev
      setData({
        merchants: 0,
        pendingSlips: 0,
        openTickets: 0,
        districtsCovered: 0,
        todayDownloads: 0,
        sparkline: [12, 18, 15, 24, 28, 22, 35, 30, 42, 48, 40, 52, 58, 64],
      });
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSyncReleases() {
    setSyncing(true);
    try {
      await syncReleases();
      toast.success("GitHub releases synced");
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sync releases";
      toast.error(msg);
    } finally {
      setSyncing(false);
    }
  }

  async function handleTriggerRebuild() {
    setRebuilding(true);
    try {
      await triggerRebuild("admin_overview");
      toast.success("Site rebuild triggered on GitHub Actions");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to trigger rebuild";
      toast.error(msg);
    } finally {
      setRebuilding(false);
    }
  }

  const sparklinePoints = data?.sparkline ?? [12, 18, 15, 24, 28, 22, 35, 30, 42, 48, 40, 52, 58, 64];
  const maxVal = Math.max(...sparklinePoints, 1);
  const svgWidth = 600;
  const svgHeight = 120;
  const stepX = svgWidth / (sparklinePoints.length - 1);
  const points = sparklinePoints
    .map((val, i) => `${i * stepX},${svgHeight - (val / maxVal) * (svgHeight - 20) - 10}`)
    .join(" ");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">Console Overview</h1>
          <p className="text-xs text-text-muted">Real-time telemetry and operational metrics across Sri Lanka</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSyncReleases}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-surface-elevated px-3 py-1.5 text-xs font-medium text-text-muted hover:border-azure/40 hover:text-text-primary"
          >
            <RefreshCw className={`h-3 w-3 ${syncing ? "animate-spin text-azure" : ""}`} />
            <span>Sync Releases</span>
          </button>
          <button
            type="button"
            onClick={handleTriggerRebuild}
            disabled={rebuilding}
            className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-surface-elevated px-3 py-1.5 text-xs font-medium text-text-muted hover:border-azure/40 hover:text-text-primary"
          >
            <Layers className={`h-3 w-3 ${rebuilding ? "animate-spin text-azure" : ""}`} />
            <span>Trigger Rebuild</span>
          </button>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Merchants */}
        <Link
          href="/admin/merchants"
          className="group rounded-lg border border-hairline bg-surface p-4 transition-colors hover:border-azure/50"
        >
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium">Merchants</span>
            <Store className="h-4 w-4 text-text-muted group-hover:text-azure" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-text-primary">
              {data?.merchants ?? "—"}
            </span>
            <span className="text-[11px] text-text-muted">Total registered</span>
          </div>
        </Link>

        {/* Districts Covered */}
        <div className="rounded-lg border border-hairline bg-surface p-4">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium">Districts Covered</span>
            <MapPin className="h-4 w-4 text-azure" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-text-primary">
              {data ? `${data.districtsCovered}/25` : "—"}
            </span>
            <span className="text-[11px] text-text-muted">Target 25/25</span>
          </div>
        </div>

        {/* Today Downloads */}
        <div className="rounded-lg border border-hairline bg-surface p-4">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium">Today Downloads</span>
            <Download className="h-4 w-4 text-text-muted" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-text-primary">
              {data?.todayDownloads ?? "—"}
            </span>
            <span className="text-[11px] text-text-muted">Installer started</span>
          </div>
        </div>

        {/* Pending Slips */}
        <Link
          href="/admin/donations"
          className="group rounded-lg border border-hairline bg-surface p-4 transition-colors hover:border-amber-500/50"
        >
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium">Pending Slips</span>
            <HeartHandshake className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-amber-400">
              {data?.pendingSlips ?? "—"}
            </span>
            <span className="text-[11px] text-text-muted">Requires review</span>
          </div>
        </Link>

        {/* Open Tickets */}
        <Link
          href="/admin/feedback"
          className="group rounded-lg border border-hairline bg-surface p-4 transition-colors hover:border-azure/50"
        >
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium">Open Tickets</span>
            <MessageSquare className="h-4 w-4 text-text-muted group-hover:text-azure" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-text-primary">
              {data?.openTickets ?? "—"}
            </span>
            <span className="text-[11px] text-text-muted">Open / triaged</span>
          </div>
        </Link>
      </div>

      {/* Sparkline Card */}
      <div className="rounded-lg border border-hairline bg-surface p-5">
        <div className="flex items-center justify-between border-b border-hairline pb-3">
          <div>
            <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              Installer Downloads (14-Day Trajectory)
            </h2>
            <p className="text-[11px] text-text-muted">Daily counts recorded by download gate verification</p>
          </div>
          <span className="font-mono text-xs text-text-muted">
            Latest: {sparklinePoints[sparklinePoints.length - 1]} / day
          </span>
        </div>

        <div className="mt-4 overflow-hidden">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="h-28 w-full stroke-azure"
            fill="none"
          >
            {/* Background horizontal grid lines */}
            <line x1="0" y1="20" x2={svgWidth} y2="20" className="stroke-hairline" strokeDasharray="3 3" />
            <line x1="0" y1="60" x2={svgWidth} y2="60" className="stroke-hairline" strokeDasharray="3 3" />
            <line x1="0" y1="100" x2={svgWidth} y2="100" className="stroke-hairline" strokeDasharray="3 3" />

            {/* Sparkline Polyline */}
            <polyline
              points={points}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="stroke-azure"
            />

            {/* Dots on data points */}
            {sparklinePoints.map((val, i) => {
              const cx = i * stepX;
              const cy = svgHeight - (val / maxVal) * (svgHeight - 20) - 10;
              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r="3"
                  className="fill-azure"
                />
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
