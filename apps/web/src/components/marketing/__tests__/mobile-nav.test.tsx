import { describe, expect, test, mock } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";

mock.module("next/navigation", () => ({
  useRouter: () => ({ push: () => {}, replace: () => {}, prefetch: () => {} }),
  usePathname: () => "/en",
  useSearchParams: () => new URLSearchParams(),
}));

import { NextIntlClientProvider } from "next-intl";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const enMessages = JSON.parse(readFileSync(resolve(process.cwd(), "../../messages/en.json"), "utf-8"));

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
    const html = renderToString(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <MobileNav navLinks={dummyLinks} />
      </NextIntlClientProvider>,
    );

    expect(html).toContain("Sign in");
    expect(html).toContain('href="/login"');
    expect(html).not.toContain("Dashboard");
  });

  test("MobileNav renders 'Dashboard' and 'Sign out' when authenticated", () => {
    mockSession = { data: { user: { id: "1" } }, isPending: false };
    const html = renderToString(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <MobileNav navLinks={dummyLinks} />
      </NextIntlClientProvider>,
    );

    expect(html).toContain("Dashboard");
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain("Sign out");
  });

  test("SiteFooter includes Merchant portal link", () => {
    const html = renderToString(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <SiteFooter />
      </NextIntlClientProvider>,
    );

    expect(html).toContain("Merchant portal");
    expect(html).toContain('href="/dashboard"');
  });
});
