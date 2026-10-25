import { Suspense } from "react";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { buildMetadata } from "@/lib/metadata";
import { AuthView } from "@/features/auth/components/AuthView";

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
    path: "/login",
    title: "Sign in — CB POS",
    description: "Sign in or create an account to manage your CB POS merchant listing and feedback.",
  });
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LoginPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="bg-canvas min-h-[calc(100vh-var(--header-h))] px-4 py-12 sm:px-6 sm:py-20 lg:px-8 flex items-center justify-center relative">
      <Suspense
        fallback={
          <div className="w-full max-w-[420px] h-[400px] rounded-lg bg-card border border-border animate-pulse" />
        }
      >
        <AuthView locale={locale} />
      </Suspense>
    </div>
  );
}
