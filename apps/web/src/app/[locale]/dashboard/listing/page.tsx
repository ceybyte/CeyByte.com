import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { DashboardShell } from "@/features/dashboard/components/DashboardShell";
import { ListingTab } from "@/features/dashboard/components/ListingTab";

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
    <DashboardShell
      locale={locale}
      copy={{
        emptyTitle: t("empty.title"),
        emptyBody: t("empty.body"),
      }}
      renderOverview={({ listing, onListingUpdated }) => (
        <ListingTab
          listing={listing}
          onListingUpdated={onListingUpdated}
          copy={{
            listingTitle: t("listing.title"),
            listingPublic: t("listing.public"),
            listingSave: t("listing.save"),
            listingSaved: t("listing.saved"),
          }}
        />
      )}
    />
  );
}
