import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Logo } from "@/components/brand/logo";
import { Crosshair } from "@/components/brand/crosshair";

export function SiteFooter() {
  const t = useTranslations("footer");
  const tn = useTranslations("nav");
  const fl = useTranslations("footer.links");
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-hairline-grid bg-surface-legal relative border-t px-[--gutter] py-8 transition-all"
      aria-label="Site footer"
    >
      {/* Corner crosshairs */}
      <Crosshair className="text-hairline-grid absolute top-0 left-4 -translate-y-1/2" />
      <Crosshair className="text-hairline-grid absolute top-0 right-4 -translate-y-1/2" />
      <Crosshair className="text-hairline-grid absolute bottom-0 left-4 translate-y-1/2" />
      <Crosshair className="text-hairline-grid absolute right-4 bottom-0 translate-y-1/2" />

      <div className="mx-auto max-w-[--content-max]">
        {/* Row 1: Brand & Mission | Essential Navigation Links */}
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <Link href="/" className="focus-visible:outline-azure w-fit rounded-[--radius-sm]">
              <Logo size="sm" showProductBadge={false} />
            </Link>
            <span className="text-hairline-grid hidden sm:inline" aria-hidden="true">
              |
            </span>
            <p className="text-muted max-w-md text-xs leading-relaxed">{t("mission")}</p>
          </div>

          <nav
            aria-label="Footer navigation"
            className="text-muted flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium"
          >
            <Link href="/features" className="hover:text-azure-text transition-colors duration-[--dur-hover]">
              {tn("features")}
            </Link>
            <Link href="/docs" className="hover:text-azure-text transition-colors duration-[--dur-hover]">
              {tn("docs")}
            </Link>
            <Link href="/releases" className="hover:text-azure-text transition-colors duration-[--dur-hover]">
              {tn("releases")}
            </Link>
            <a
              href="https://chat.whatsapp.com/BS73D23VD74BbseKuoC1BM"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-azure-text transition-colors duration-[--dur-hover]"
            >
              WhatsApp
            </a>
            <a
              href="https://facebook.com/CeylonByte"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-azure-text transition-colors duration-[--dur-hover]"
            >
              Facebook
            </a>
            <Link
              href="/legal/terms"
              className="hover:text-azure-text transition-colors duration-[--dur-hover]"
            >
              {fl("terms")}
            </Link>
            <Link
              href="/legal/privacy"
              className="hover:text-azure-text transition-colors duration-[--dur-hover]"
            >
              {fl("privacy")}
            </Link>
          </nav>
        </div>

        {/* Row 2: Copyright | Engineered In Sri Lanka badge */}
        <div className="border-hairline-grid text-muted mt-6 flex flex-col items-center justify-between gap-3 border-t pt-4 font-mono text-[11px] sm:flex-row">
          <div className="flex flex-wrap items-center gap-3">
            <span>{t("copyright", { year })}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true"></span>
            <span className="text-text-secondary tracking-wider uppercase">{t("engineeredInSL")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
