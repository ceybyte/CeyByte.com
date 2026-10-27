import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { ListingView } from "@/features/dashboard/components/ListingView";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function DashboardListingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "dash" });

  return (
    <ListingView
      locale={locale}
      copy={{
        listingTitle: t("listing.title"),
        listingPublic: t("listing.public"),
        listingSave: t("listing.save"),
        listingSaved: t("listing.saved"),
      }}
    />
  );
}
