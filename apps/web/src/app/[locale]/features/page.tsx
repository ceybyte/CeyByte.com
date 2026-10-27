import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { buildMetadata } from "@/lib/metadata";
import { FeaturesHero } from "@/components/features/features-hero";
import { CategorySwitcher } from "@/components/features/category-switcher";
import { FeaturesSpecMatrix } from "@/components/features/features-spec-matrix";
import { FinalBannerSection } from "@/components/home/final-banner-section";

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
    path: "/features",
    title: "Features by Shop Type · CB POS",
    description:
      "Explore CB POS features for Sri Lankan grocery stores, pharmacies, hardware shops, and retail counters. Offline billing, zero subscriptions, automated VAT/SSCL.",
  });
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function FeaturesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="bg-canvas min-h-[calc(100vh-var(--header-h))]">
      <FeaturesHero />
      <CategorySwitcher />
      <FeaturesSpecMatrix />
      <FinalBannerSection />
    </div>
  );
}
