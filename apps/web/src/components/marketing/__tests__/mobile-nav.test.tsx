import { describe, expect, test, mock } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";

mock.module("next/navigation", () => ({
  useRouter: () => ({ push: () => {}, replace: () => {}, prefetch: () => {} }),
  usePathname: () => "/en",
  useSearchParams: () => new URLSearchParams(),
}));

mock.module("next-intl", () => ({
  useTranslations: (namespace?: string) => (key: string) => {
    if (namespace === "footer" || namespace === "footer.links") {
      const footerMap: Record<string, string> = {
        "col.product": "Product",
        "col.community": "Community",
        "col.legal": "Legal",
        mission: "Free point-of-sale software",
        download: "Download",
        releases: "Releases",
        docs: "Docs",
        shortcuts: "Keyboard shortcuts",
        map: "Merchant map",
        feedback: "Feedback",
        donate: "Donate",
        whatsapp: "WhatsApp community",
        blog: "Blog",
        merchantPortal: "Merchant portal",
        terms: "Terms",
        privacy: "Privacy",
        taxDisclaimer: "Tax disclaimer",
        dataSafety: "Data safety",
        cookies: "Cookies",
      };
      return footerMap[key] ?? key;
    }
    const navMap: Record<string, string> = {
      ariaLabel: "Main navigation",
      product: "Product",
      map: "Map",
      download: "Download CB POS",
      openMenu: "Open navigation menu",
      closeMenu: "Close navigation menu",
      signIn: "Sign in",
      dashboard: "Dashboard",
      signOut: "Sign out",
    };
    return navMap[key] ?? key;
  },
  useLocale: () => "en",
}));

mock.module("@/i18n/routing", () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  usePathname: () => "/",
}));

mock.module("@/components/gate/gate-context", () => ({
  useGate: () => ({ openGate: () => {} }),
}));

mock.module("@/components/ui/drawer", () => ({
  Drawer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerPortal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerClose: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

let mockSession: { data: unknown; isPending: boolean } = { data: null, isPending: false };

mock.module("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => mockSession,
    signOut: async () => {},
  },
}));

import { MobileNav } from "../mobile-nav";
import { SiteFooter } from "../site-footer";

describe("MobileNav and SiteFooter merchant entry points", () => {
  const dummyLinks = [{ href: "/", label: "Product" }];

  test("MobileNav renders 'Sign in' when unauthenticated", () => {
    mockSession = { data: null, isPending: false };
    const html = renderToString(<MobileNav navLinks={dummyLinks} />);

    expect(html).toContain("Sign in");
    expect(html).toContain('href="/login"');
    expect(html).not.toContain("Dashboard");
  });

  test("MobileNav renders 'Dashboard' and 'Sign out' when authenticated", () => {
    mockSession = { data: { user: { id: "1" } }, isPending: false };
    const html = renderToString(<MobileNav navLinks={dummyLinks} />);

    expect(html).toContain("Dashboard");
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain("Sign out");
  });

  test("SiteFooter includes Merchant portal link", () => {
    const html = renderToString(<SiteFooter />);

    expect(html).toContain("Merchant portal");
    expect(html).toContain('href="/dashboard"');
  });
});
