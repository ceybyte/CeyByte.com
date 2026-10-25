// Locale root layout — wraps every /{locale}/* page.
// Static rendering: generateStaticParams emits en/si/ta at build time; setRequestLocale enables
// next-intl hooks in Server Components without middleware. (03-TRD §4, next-intl static export docs)
import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { fontVariables } from "../fonts";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { MotionProvider } from "@/components/motion/motion-provider";
import { AnalyticsProvider } from "@/components/providers/analytics-provider";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ConsentBar } from "@/components/ui/consent-bar";
import { Toaster } from "@/components/ui/sonner";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { OfflineBanner } from "@/components/providers/offline-banner";
import "../globals.css";
import { GateProvider } from "@/components/gate/gate-context";
import { DownloadGateModal } from "@/components/gate/download-gate-modal";
import { buildMetadata } from "@/lib/metadata";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const base = buildMetadata({
    locale,
    path: "/",
    title: "CB\u00a0POS: free point-of-sale for Sri Lankan shops",
    description:
      "Free Windows point-of-sale software that bills without the internet, works out 18% VAT and 2.5% SSCL from the shelf price, and prints Sinhala, Tamil or English receipts.",
  });
  return {
    ...base,
    title: {
      default: "CB\u00a0POS: free point-of-sale for Sri Lankan shops",
      template: "%s · CB\u00a0POS",
    },
    robots: { index: true, follow: true },
    other: { "content-language": locale },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Validate locale segment; unknown slugs get a 404.
  if (!hasLocale(routing.locales, locale)) notFound();

  // Required for static rendering of Server Components that call next-intl hooks.
  setRequestLocale(locale);

  // Load messages server-side; NextIntlClientProvider passes them to client islands.
  const messages = await getMessages();

  return (
    <html lang={locale} className={fontVariables} suppressHydrationWarning>
      <body className="flex min-h-svh flex-col overflow-x-clip">
        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>
            <MotionProvider>
              <AnalyticsProvider>
                <GateProvider>
                  {/* Skip link (CLAUDE.md §1.10 — keyboard-first) */}
                  <a
                    href="#main-content"
                    className="focus:bg-primary focus:text-primary-foreground sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-[--radius-sm] focus:px-4 focus:py-2 focus:text-sm focus:font-bold"
                  >
                    Skip to content
                  </a>

                  {/* Offline indicator (lazy — runs in the browser only) */}
                  <OfflineBanner />

                  <SiteHeader />

                  <main id="main-content" className="flex-1">
                    {children}
                  </main>

                  <SiteFooter />

                  <DownloadGateModal />
                  <ConsentBar />
                  <Toaster position="bottom-right" />
                  <SmoothScroll />
                </GateProvider>
              </AnalyticsProvider>
            </MotionProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
