"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, RefreshCw } from "lucide-react";

export interface ReleaseTimelineItem {
  id: string;
  version: string;
  release_date: string;
  changelog?: string;
  is_latest?: boolean | number;
  is_yanked?: boolean | number;
}

export function ChangelogTimeline({
  releases,
  staticLatestVersion,
}: {
  releases: ReleaseTimelineItem[];
  staticLatestVersion: string;
}) {
  const t = useTranslations("releases");
  const [newerVersion, setNewerVersion] = useState<string | null>(null);

  // Check client-side against GET /api/releases/latest for updates
  useEffect(() => {
    let active = true;
    fetch("/api/releases/latest")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!active || !json?.ok || !json.data?.version) return;
        const apiVersion = json.data.version;
        if (apiVersion !== "0.0.0-dev" && apiVersion !== staticLatestVersion) {
          setNewerVersion(apiVersion);
        }
      })
      .catch(() => {
        // ignore network error
      });

    return () => {
      active = false;
    };
  }, [staticLatestVersion]);

  return (
    <div className="space-y-6">
      {/* Newer Version Alert Banner if API has newer release */}
      {newerVersion && (
        <div className="border-azure/40 bg-azure/10 flex items-center justify-between rounded-lg border p-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <RefreshCw className="text-azure-text size-4 animate-spin" />
            <span className="text-text font-medium">{t("newerAvailable", { version: newerVersion })}</span>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-azure-text hover:text-text font-semibold underline underline-offset-2"
          >
            Reload
          </button>
        </div>
      )}

      {/* Timeline Header */}
      <div>
        <h2 className="text-display text-text text-xl font-bold sm:text-2xl">{t("changelog")}</h2>
      </div>

      {/* Vertical Hairline Timeline */}
      <div className="border-hairline relative ml-3 space-y-8 border-l pl-6 sm:ml-4 sm:pl-8">
        {releases.map((rel) => {
          const isLatest = Boolean(rel.is_latest);
          const isYanked = Boolean(rel.is_yanked);

          return (
            <div key={rel.id || rel.version} className="group relative">
              {/* Timeline Node Dot */}
              <div
                className={`bg-canvas absolute top-1.5 -left-[31px] size-3.5 rounded-full border-2 transition-colors sm:-left-[39px] ${
                  isYanked
                    ? "border-error bg-error/20"
                    : isLatest
                      ? "border-azure bg-azure"
                      : "border-hairline bg-surface-elevated"
                }`}
              />

              {/* Version & Date Header */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className={`font-mono text-base font-bold sm:text-lg ${
                    isYanked ? "text-text-muted line-through" : "text-text"
                  }`}
                >
                  v{rel.version}
                </span>

                {isLatest && !isYanked && (
                  <span className="bg-azure/10 text-azure-text border-azure/30 rounded border px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider uppercase">
                    {t("latest")}
                  </span>
                )}

                {isYanked && (
                  <span className="bg-error/10 text-error border-error/30 rounded border px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider uppercase">
                    Withdrawn
                  </span>
                )}

                <span className="text-text-muted text-xs">{rel.release_date}</span>
              </div>

              {/* Yanked Warning Banner */}
              {isYanked && (
                <div className="border-error/40 bg-error/10 text-error mt-2 flex items-center gap-2 rounded-md border p-2.5 text-xs">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{t("yanked")}</span>
                </div>
              )}

              {/* Changelog Notes */}
              {rel.changelog && (
                <div className="border-hairline bg-surface text-text-muted mt-3 rounded-lg border p-4 text-xs leading-relaxed sm:text-sm">
                  <div className="prose prose-invert text-text-muted max-w-none text-xs whitespace-pre-line sm:text-sm">
                    {rel.changelog}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
