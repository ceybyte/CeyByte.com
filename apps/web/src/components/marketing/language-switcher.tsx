"use client";

// Language switcher: compact EN · සිං · தமி buttons (03-DESIGN §8.11).
// Sets NEXT_LOCALE cookie (1 year, SameSite=Lax) and navigates to the same path in the new locale.
// Event: locale_changed {from, to} (04-APP_FLOW §7).
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import type { Locale } from "@/i18n/routing";
import { capture } from "@/components/providers/analytics-provider";
import { cn } from "@/lib/utils";

const LANGUAGES: Record<Locale, { short: string; full: string }> = {
  en: { short: "EN", full: "English" },
  si: { short: "සිං", full: "සිංහල" },
  ta: { short: "தமி", full: "தமிழ்" },
};

export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(next: Locale) {
    if (next === locale) return;
    // Persist in cookie so the Worker can redirect / on the next visit (01-PRD §FR-01.2).
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; SameSite=Lax`;
    capture("locale_changed", { from: locale, to: next });

    // Preserve query parameters (01-PRD §FR-01.3).
    const search = typeof window !== "undefined" ? window.location.search : "";
    const target = `${pathname}${search}`;
    router.replace(target, { locale: next });
  }

  return (
    <nav aria-label={t("langSwitcher")} className={cn("flex items-center gap-0", className)}>
      {(Object.keys(LANGUAGES) as Locale[]).map((lang, i) => (
        <span key={lang} className="flex items-center">
          {i > 0 && (
            <span className="text-hairline mx-1 select-none" aria-hidden>
              ·
            </span>
          )}
          <button
            type="button"
            onClick={() => switchLocale(lang)}
            aria-current={lang === locale ? "true" : undefined}
            aria-label={LANGUAGES[lang].full}
            title={LANGUAGES[lang].full}
            className={cn(
              "font-mono text-xs leading-none transition-colors duration-[--dur-hover]",
              "rounded-[--radius-sm] px-0.5 focus-visible:outline-2 focus-visible:outline-offset-2",
              lang === locale ? "text-text font-semibold" : "text-muted hover:text-text",
            )}
          >
            {LANGUAGES[lang].short}
          </button>
        </span>
      ))}
    </nav>
  );
}
