import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { buildMetadata } from "@/lib/metadata";
import { TicketDetailClient } from "./ticket-client";

export function generateStaticParams() {
  const params: Array<{ locale: string; number: string }> = [];
  for (const locale of routing.locales) {
    // "ticket" is the shell rewritten to by Cloudflare Worker for dynamic CB-* paths
    params.push({ locale, number: "ticket" });
    params.push({ locale, number: "CB-0001" });
    params.push({ locale, number: "CB-0142" });
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; number: string }>;
}): Promise<Metadata> {
  const { locale, number } = await params;
  return buildMetadata({
    locale,
    path: `/feedback/${number}`,
    title: `Ticket ${number}`,
    description: `Status, progression timeline, and Ceybyte team updates for ticket ${number}.`,
  });
}

export default async function FeedbackDetailPage({
  params,
}: {
  params: Promise<{ locale: string; number: string }>;
}) {
  const { locale, number } = await params;
  setRequestLocale(locale);

  return <TicketDetailClient initialNumber={number} locale={locale} />;
}
