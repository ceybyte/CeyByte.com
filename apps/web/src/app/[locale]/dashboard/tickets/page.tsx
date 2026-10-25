import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { DashboardShell } from "@/features/dashboard/components/DashboardShell";
import { TicketsTab } from "@/features/dashboard/components/TicketsTab";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function DashboardTicketsPage({ params }: Props) {
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
      renderOverview={() => (
        <TicketsTab
          locale={locale}
          copy={{
            ticketsTitle: t("tickets.title"),
          }}
        />
      )}
    />
  );
}
