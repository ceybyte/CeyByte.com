import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { DashboardShell } from "@/features/dashboard/components/DashboardShell";
import { SettingsTab } from "@/features/dashboard/components/SettingsTab";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function DashboardSettingsPage({ params }: Props) {
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
      renderOverview={({ listing }) => (
        <SettingsTab
          locale={locale}
          listing={listing}
          copy={{
            language: t("settings.language"),
            deleteTitle: t("settings.delete.title"),
            deleteBody: t("settings.delete.body"),
            deleteConfirm: t("settings.delete.confirm"),
            deleteCta: t("settings.delete.cta"),
          }}
        />
      )}
    />
  );
}
