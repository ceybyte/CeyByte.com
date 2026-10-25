"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { WhatNextView } from "@/components/gate/what-next-view";
import { DownloadForm } from "./download-form";

export function DownloadView({ locale }: { locale: string }) {
  const searchParams = useSearchParams();
  const isDone = searchParams.get("done") === "1";
  const ref = searchParams.get("ref");

  if (isDone) {
    return (
      <div className="border-hairline bg-surface rounded-lg border p-6 shadow-xl sm:p-8">
        <WhatNextView
          data={{
            downloadUrl: `/api/download/latest${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`,
            claimToken: "",
            release: {
              version: "1.3.0",
              exe_name: "CBPOSSetup-1.3.0.exe",
              exe_size: 52428800,
              exe_sha256: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
            },
          }}
        />
      </div>
    );
  }

  return <DownloadForm locale={locale} />;
}
