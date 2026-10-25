"use client";

// Mobile navigation drawer — hamburger button → Vaul bottom drawer with nav links.
// Includes language switcher and Download CTA for mobile viewports.
import { useState } from "react";
import { Menu, X, Download, LayoutDashboard, LogOut } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerPortal, DrawerTrigger } from "@/components/ui/drawer";
import { Link } from "@/i18n/routing";
import { useGate } from "@/components/gate/gate-context";
import { authClient } from "@/lib/auth-client";
import { LanguageSwitcher } from "./language-switcher";

type NavLink = { readonly href: string; readonly label: string };

export function MobileNav({ navLinks }: { navLinks: readonly NavLink[] }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const { openGate } = useGate();
  const [open, setOpen] = useState(false);
  const { data: session, isPending: sessionPending } = authClient.useSession();

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="right">
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("openMenu")} className="md:hidden">
          <Menu strokeWidth={1.5} />
        </Button>
      </DrawerTrigger>

      <DrawerPortal>
        <DrawerContent className="bg-surface border-hairline fixed top-0 right-0 bottom-0 z-50 flex w-72 flex-col border-l outline-none">
          {/* Header */}
          <div className="border-hairline-grid flex h-[--header-h] items-center justify-between border-b px-5">
            <Logo size="sm" />
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" aria-label={t("closeMenu")}>
                <X strokeWidth={1.5} />
              </Button>
            </DrawerClose>
          </div>

          {/* Nav links */}
          <nav aria-label={t("ariaLabel")} className="flex flex-1 flex-col gap-1 px-3 py-4">
            {navLinks.map(({ href, label }) => (
              <DrawerClose asChild key={href}>
                <Link
                  href={href}
                  className="text-muted hover:bg-surface-elevated hover:text-text rounded-[--radius-sm] px-3 py-2.5 text-sm transition-colors duration-[--dur-hover]"
                >
                  {label}
                </Link>
              </DrawerClose>
            ))}

            {/* Merchant session link */}
            {!sessionPending &&
              (session ? (
                <>
                  <DrawerClose asChild>
                    <Link
                      href="/dashboard"
                      className="text-muted hover:bg-surface-elevated hover:text-text flex items-center gap-2 rounded-[--radius-sm] px-3 py-2.5 text-sm transition-colors duration-[--dur-hover]"
                    >
                      <LayoutDashboard className="size-4" />
                      <span>{t("dashboard")}</span>
                    </Link>
                  </DrawerClose>
                  <button
                    type="button"
                    onClick={async () => {
                      await authClient.signOut();
                      setOpen(false);
                    }}
                    className="text-muted hover:bg-surface-elevated hover:text-text flex w-full cursor-pointer items-center gap-2 rounded-[--radius-sm] px-3 py-2.5 text-left text-sm transition-colors duration-[--dur-hover]"
                  >
                    <LogOut className="size-4" />
                    <span>{t("signOut")}</span>
                  </button>
                </>
              ) : (
                <DrawerClose asChild>
                  <Link
                    href="/login"
                    className="text-muted hover:bg-surface-elevated hover:text-text rounded-[--radius-sm] px-3 py-2.5 text-sm transition-colors duration-[--dur-hover]"
                  >
                    {t("signIn")}
                  </Link>
                </DrawerClose>
              ))}
          </nav>

          {/* Bottom: language + download */}
          <div className="border-hairline-grid flex flex-col gap-3 border-t p-4">
            <LanguageSwitcher />
            <Button variant="primary" size="md" className="w-full" asChild>
              <a
                href={`/${locale}/download`}
                onClick={(e) => {
                  e.preventDefault();
                  setOpen(false);
                  openGate();
                }}
              >
                <Download strokeWidth={1.5} className="size-4" />
                {t("download")}
              </a>
            </Button>
          </div>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
}
