import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { DashboardShell } from "@/features/dashboard/components/DashboardShell";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: "Merchant Dashboard — CB POS",
  description: "Manage your CB POS merchant listing, visibility, tickets, and donations.",
};

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
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
    >
      {children}
    </DashboardShell>
  );
}
