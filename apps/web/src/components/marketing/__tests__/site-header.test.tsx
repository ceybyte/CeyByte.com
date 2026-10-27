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

// Mock @/i18n/routing
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

// Mock gate context
mock.module("@/components/gate/gate-context", () => ({
  useGate: () => ({ openGate: () => {} }),
}));

let mockSession: { data: unknown; isPending: boolean } = { data: null, isPending: false };

mock.module("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => mockSession,
    signOut: async () => {},
  },
}));

import { SiteHeader } from "../site-header";

describe("SiteHeader dynamic merchant auth entry", () => {
  test("renders 'Sign in' link pointing to /login when unauthenticated", () => {
    mockSession = { data: null, isPending: false };
    const html = renderToString(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <SiteHeader />
      </NextIntlClientProvider>,
    );

    expect(html).toContain("Sign in");
    expect(html).toContain('href="/login"');
    expect(html).not.toContain("Dashboard");
  });

  test("renders 'Dashboard' link pointing to /dashboard when authenticated", () => {
    mockSession = {
      data: { user: { id: "user_123", email: "merchant@example.com" } },
      isPending: false,
    };
    const html = renderToString(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <SiteHeader />
      </NextIntlClientProvider>,
    );
    expect(html).toContain("Dashboard");
    expect(html).toContain('href="/dashboard"');
    expect(html).not.toContain("Sign in");
  });

  test("renders master brand Logo without CB POS badge in nav", () => {
    mockSession = { data: null, isPending: false };
    const html = renderToString(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <SiteHeader />
      </NextIntlClientProvider>,
    );

    // Must NOT contain CB POS badge in the logo
    expect(html).not.toContain("CB&nbsp;POS");
    expect(html).toContain('aria-label="CeyByte"');
    expect(html).toContain("CeyByte");
  });
});
