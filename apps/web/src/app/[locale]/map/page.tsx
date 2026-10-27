import { Suspense } from "react";
import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { buildMetadata } from "@/lib/metadata";
import { MapShell } from "@/components/map/map-shell";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "map.meta" });
  return buildMetadata({
    locale,
    path: "/map",
    title: t("title"),
    description: t("description"),
    ogImage: "/map-teaser.png",
  });
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function MapPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="bg-canvas relative min-h-[calc(100vh-var(--header-h))] w-full">
      <Suspense
        fallback={
          <div className="bg-canvas flex h-96 w-full items-center justify-center">
            <div className="border-hairline border-t-azure h-8 w-8 animate-spin rounded-full border-2" />
          </div>
        }
      >
        <MapShell />
      </Suspense>
    </div>
  );
}
