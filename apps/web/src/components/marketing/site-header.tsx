"use client";

// SiteHeader — sticky 64px bar per 03-DESIGN §8.11 and 06 §3.1.
// Desktop: Logo | nav links | LanguageSwitcher · ThemeToggle · Download CTA.
// Mobile: Logo | language switcher | hamburger → Drawer nav.
// The Download CTA hides while the hero CTA is in view (IntersectionObserver on #hero-cta, Phase 5).
import { useLocale, useTranslations } from "next-intl";
import { Download } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/brand/theme-toggle";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { useGate } from "@/components/gate/gate-context";
import { LanguageSwitcher } from "./language-switcher";
import { MobileNav } from "./mobile-nav";

export function SiteHeader() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const { openGate } = useGate();

  const navLinks = [
    { href: "/" as const, label: t("product") },
    { href: "/map" as const, label: t("map") },
    { href: "/docs" as const, label: t("docs") },
    { href: "/releases" as const, label: t("releases") },
    { href: "/donate" as const, label: t("donate") },
  ] as const;

  return (
    <header
      className="border-hairline-grid bg-surface/80 sticky top-0 z-40 h-[--header-h] w-full border-b backdrop-blur-md"
      aria-label="Site header"
    >
      <div className="mx-auto flex h-full max-w-[--content-max] items-center gap-4 px-[--gutter]">
        {/* Logo */}
        <Link href="/" aria-label="CB POS — home" className="shrink-0 rounded-[--radius-sm]">
          <Logo size="md" />
        </Link>

        {/* Desktop nav */}
        <nav
          aria-label={t("ariaLabel")}
          className="hidden md:flex md:flex-1 md:items-center md:gap-6 md:pl-4"
        >
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-muted hover:text-text focus-visible:text-text text-sm transition-colors duration-[--dur-hover]"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher className="hidden sm:flex" />

          <ThemeToggle toLight="Switch to light theme" toDark="Switch to dark theme" />

          {/* Download CTA — hidden on mobile (nav drawer has it), hidden when hero CTA visible (Phase 5 IntersectionObserver) */}
          <Button
            variant="primary"
            size="sm"
            id="header-download-cta"
            className="hidden md:inline-flex"
            asChild
          >
            <a
              href={`/${locale}/download`}
              onClick={(e) => {
                e.preventDefault();
                openGate();
              }}
            >
              <Download strokeWidth={1.5} className="size-4" />
              {t("download")}
            </a>
          </Button>

          {/* Mobile hamburger */}
          <MobileNav navLinks={navLinks} />
        </div>
      </div>
    </header>
  );
}
