import { Suspense } from "react";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { buildMetadata } from "@/lib/metadata";
import { DownloadForm } from "./download-form";
import { DownloadView } from "./download-view";

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
};

export default async function DownloadPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="bg-canvas min-h-[calc(100vh-var(--header-h))] py-12 px-4 sm:py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Suspense fallback={<DownloadForm locale={locale} />}>
          <DownloadView locale={locale} />
        </Suspense>
      </div>
    </div>
  );
}
