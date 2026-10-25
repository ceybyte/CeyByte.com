import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { buildMetadata } from "@/lib/metadata";
import { WhatNextView } from "@/components/gate/what-next-view";
import { DownloadForm } from "./download-form";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: "/download",
    title: "Download CB POS for Windows",
    description:
      "Download the free point-of-sale installer for Windows 10 or later. Works offline, bills fast, handles Sri Lankan VAT & SSCL.",
  });
}

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ done?: string; ref?: string }>;
};

export default async function DownloadPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { done, ref } = await searchParams;
  setRequestLocale(locale);

  const isDone = done === "1";

  return (
    <div className="bg-canvas min-h-[calc(100vh-var(--header-h))] py-12 px-4 sm:py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {isDone ? (
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
        ) : (
          <DownloadForm locale={locale} />
        )}
      </div>
    </div>
  );
}
