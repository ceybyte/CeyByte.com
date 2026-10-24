"use client";

// ConsentBar — fixed bottom bar shown until the user accepts or declines analytics.
// Sets consent cookie (1 year) which is read by AnalyticsProvider.
// No analytics fires before acceptance. Respects prefers-reduced-motion.
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

const COOKIE_NAME = "cbpos_consent";
const COOKIE_TTL = 60 * 60 * 24 * 365; // 1 year

function getConsentCookie(): "1" | "0" | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([01])`));
  return (match?.[1] as "1" | "0") ?? null;
}

function setConsentCookie(value: "1" | "0") {
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${COOKIE_TTL}; SameSite=Lax`;
}

export function ConsentBar() {
  const t = useTranslations("consent");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getConsentCookie() === null);
  }, []);

  function accept() {
    setConsentCookie("1");
    setVisible(false);
    // Notify AnalyticsProvider without a page reload.
    window.dispatchEvent(new Event("cbpos:consent"));
  }

  function decline() {
    setConsentCookie("0");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      className="border-hairline-grid bg-surface/95 motion-safe:animate-in motion-safe:slide-in-from-bottom-2 fixed right-0 bottom-0 left-0 z-50 border-t backdrop-blur-sm motion-safe:duration-300"
    >
      <div className="mx-auto flex max-w-[--content-max] flex-col gap-3 px-[--gutter] py-4 sm:flex-row sm:items-center sm:gap-6">
        <p className="text-muted flex-1 text-sm">
          {t("body")}{" "}
          <Link href="/legal/cookies" className="text-azure-text underline-offset-4 hover:underline">
            {t("learnMore")}
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" size="sm" onClick={decline}>
            {t("decline")}
          </Button>
          <Button variant="primary" size="sm" onClick={accept}>
            {t("accept")}
          </Button>
        </div>
      </div>
    </div>
  );
}
