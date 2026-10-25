import { describe, expect, test } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ShortcutsTable } from "./shortcuts-table";

const enMessages = JSON.parse(readFileSync(resolve(process.cwd(), "../../messages/en.json"), "utf-8"));

describe("Printable Shortcuts Table", () => {
  test("renders all key cashiering shortcut categories and keys from fact ID [B1]", () => {
    const html = renderToString(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ShortcutsTable />
      </NextIntlClientProvider>,
    );

    // Categories
    expect(html).toContain("Item Search &amp; Quantities");
    expect(html).toContain("Payment &amp; Tendering");
    expect(html).toContain("Cart Management");

    // Shortcut Keys
    expect(html).toContain("F3");
    expect(html).toContain("F5");
    expect(html).toContain("F10");
    expect(html).toContain("F12");
    expect(html).toContain("F6");
    expect(html).toContain("F7");
    expect(html).toContain("Delete");
    expect(html).toContain("Esc");
  });
});
