// SiteFooter — 4-column dark legal footer (03-DESIGN, 06 §3.8).
// bg-surface-legal, hairline top, crosshair marks at corners.
// Version and SHA are build-time env vars injected by next.config.ts.
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Logo } from "@/components/brand/logo";
import { Crosshair } from "@/components/brand/crosshair";
import { ThemeToggle } from "@/components/brand/theme-toggle";
import { LanguageSwitcher } from "./language-switcher";

// Injected at build time: NEXT_PUBLIC_GIT_SHA (7-char), NEXT_PUBLIC_APP_VERSION.
const GIT_SHA = process.env.NEXT_PUBLIC_GIT_SHA ?? "dev";
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "";

export function SiteFooter() {
  const t = useTranslations("footer");
  const fl = useTranslations("footer.links");
  const year = new Date().getFullYear();

  return (
    <footer className="border-hairline-grid bg-surface-legal relative border-t" aria-label="Site footer">
      {/* Corner crosshairs */}
      <Crosshair className="text-hairline-grid absolute top-0 left-4 -translate-y-1/2" />
      <Crosshair className="text-hairline-grid absolute top-0 right-4 -translate-y-1/2" />
      <Crosshair className="text-hairline-grid absolute bottom-0 left-4 translate-y-1/2" />
      <Crosshair className="text-hairline-grid absolute right-4 bottom-0 translate-y-1/2" />

      <div className="mx-auto max-w-[--content-max] px-[--gutter] py-12">
        {/* 4-column grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Col 1: Brand */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="w-fit rounded-[--radius-sm]">
              <Logo size="sm" />
            </Link>
            <p className="text-muted text-sm leading-relaxed">{t("mission")}</p>
            {APP_VERSION && (
              <p className="text-muted font-mono text-xs">
                {t("latest", { version: APP_VERSION, channel: "stable" })}
              </p>
            )}
          </div>

          {/* Col 2: Product */}
          <FooterCol title={t("col.product")}>
            <FooterLink href="/">
              <span>{fl("download")}</span>
            </FooterLink>
            <FooterLink href="/releases">
              <span>{fl("releases")}</span>
            </FooterLink>
            <FooterLink href="/docs">
              <span>{fl("docs")}</span>
            </FooterLink>
            <FooterLink href="/docs/shortcuts/print">
              <span>{fl("shortcuts")}</span>
            </FooterLink>
          </FooterCol>

          {/* Col 3: Community */}
          <FooterCol title={t("col.community")}>
            <FooterLink href="/map">
              <span>{fl("map")}</span>
            </FooterLink>
            <FooterLink href="/feedback">
              <span>{fl("feedback")}</span>
            </FooterLink>
            <FooterLink href="/donate">
              <span>{fl("donate")}</span>
            </FooterLink>
            <FooterLink href="/blog">
              <span>{fl("blog")}</span>
            </FooterLink>
            <FooterLink href="/dashboard">
              <span>{fl("merchantPortal")}</span>
            </FooterLink>
            <a
              href="https://chat.whatsapp.com/BS73D23VD74BbseKuoC1BM"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-azure-text text-sm transition-colors duration-[--dur-hover]"
            >
              {fl("whatsapp")}
            </a>
          </FooterCol>

          {/* Col 4: Legal */}
          <FooterCol title={t("col.legal")}>
            <FooterLink href="/legal/terms">
              <span>{fl("terms")}</span>
            </FooterLink>
            <FooterLink href="/legal/privacy">
              <span>{fl("privacy")}</span>
            </FooterLink>
            <FooterLink href="/legal/tax-disclaimer">
              <span>{fl("taxDisclaimer")}</span>
            </FooterLink>
            <FooterLink href="/legal/data-safety">
              <span>{fl("dataSafety")}</span>
            </FooterLink>
            <FooterLink href="/legal/cookies">
              <span>{fl("cookies")}</span>
            </FooterLink>
          </FooterCol>
        </div>

        {/* Divider & Bottom bar per 03-DESIGN §8.11 */}
        <div className="border-hairline-grid mt-10 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted max-w-prose text-xs leading-relaxed">{t("legalLine")}</p>
          <div className="flex shrink-0 flex-wrap items-center gap-4 sm:justify-end">
            <LanguageSwitcher ariaLabel="Choose language (footer)" />
            <ThemeToggle toLight="Switch to light theme" toDark="Switch to dark theme" />
            <div className="flex flex-col items-start gap-1 sm:items-end">
              <p className="text-muted text-xs">{t("copyright", { year })}</p>
              <p className="text-2xs text-muted font-mono">{t("build", { sha: GIT_SHA })}</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted text-xs font-semibold tracking-widest uppercase">{title}</p>
      <nav aria-label={title} className="flex flex-col gap-2">
        {children}
      </nav>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href as Parameters<typeof Link>[0]["href"]}
      className="text-muted hover:text-azure-text text-sm transition-colors duration-[--dur-hover]"
    >
      {children}
    </Link>
  );
}
