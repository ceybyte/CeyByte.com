import { describe, expect, test, mock } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

mock.module("next/navigation", () => ({
  useRouter: () => ({
    push: () => {},
    replace: () => {},
  }),
}));

import { DocsSearchDialog } from "./search-dialog";

const enMessages = JSON.parse(readFileSync(resolve(process.cwd(), "../../messages/en.json"), "utf-8"));

describe("DocsSearchDialog (Orama Search Modal)", () => {
  test("renders accessible search modal dialog when open", () => {
    const html = renderToString(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <DocsSearchDialog open={true} onOpenChange={() => {}} locale="en" />
      </NextIntlClientProvider>,
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('placeholder="Search documentation..."');
    expect(html).toContain("↑↓ navigate");
    expect(html).toContain("↵ select");
    expect(html).toContain("esc close");
  });

  test("does not render into DOM when open is false", () => {
    const html = renderToString(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <DocsSearchDialog open={false} onOpenChange={() => {}} locale="en" />
      </NextIntlClientProvider>,
    );

    expect(html).toBe("");
  });
});
