import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { DonationsTab } from "@/features/dashboard/components/DonationsTab";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function DashboardDonationsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "dash" });

  return (
    <DonationsTab
      locale={locale}
      copy={{
        donationsTitle: t("donations.title"),
      }}
    />
  );
}
