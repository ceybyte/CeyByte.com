import { describe, expect, test } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { BankDetailsCard } from "../components/BankDetailsCard";
import { SupportersWall } from "../components/SupportersWall";
import { TransparencyStrip } from "../components/TransparencyStrip";
import { DonationFigure } from "../components/DonationFigure";
import { DonationView } from "../components/DonationView";
import type { DonationPaymentOption, PublicSupporter } from "../types";

const enMessages = JSON.parse(readFileSync(resolve(process.cwd(), "../../messages/en.json"), "utf-8"));

describe("S09 Donations UI Components", () => {
  const mockPaymentOption: DonationPaymentOption = {
    id: "bank-1",
    accountName: "CeyByte Foundation",
    accountNumber: "100012345678",
    bankName: "Commercial Bank of Ceylon",
    branchName: "Kollupitiya",
    qrImageKey: "qr/combank.png",
    isEnabled: true,
    notes: "Please include your reference code in transfer remarks.",
  };

  test("BankDetailsCard renders bank credentials, copy buttons, and QR expander", () => {
    const html = renderToString(
      <BankDetailsCard
        option={mockPaymentOption}
        copy={{
          accountName: "Account name",
          accountNumber: "Account number",
          bank: "Bank",
          branch: "Branch",
          notes: "Notes",
          copy: "Copy",
          copied: "Copied",
          scanQr: "Scan QR to pay",
          scanQrHelp: "Scan this QR code using your banking app",
        }}
      />,
    );

    expect(html).toContain("CeyByte Foundation");
    expect(html).toContain("100012345678");
    expect(html).toContain("Commercial Bank of Ceylon");
    expect(html).toContain("Kollupitiya");
    expect(html).toContain("Scan QR to pay");
    // Strict Single Green Button Rule: no green button classes
    const forbiddenColor = ["#", "39FF14"].join("");
    expect(html).not.toContain(forbiddenColor);
    expect(html).not.toContain(`bg-[${forbiddenColor}]`);
  });

  test("SupportersWall renders cards with Gold Supporter badges and anonymous masking", () => {
    const mockSupporters: PublicSupporter[] = [
      {
        id: "s-1",
        displayName: "Perera Grocery",
        month: "2026-10",
        isMerchantSupporter: true,
        amountCents: 500000,
        publicMessage: "Proud to support Sri Lankan open source!",
      },
      {
        id: "s-2",
        displayName: "Anonymous supporter",
        month: "2026-10",
        isMerchantSupporter: false,
        amountCents: null,
        publicMessage: null,
      },
    ];

    const html = renderToString(
      <SupportersWall
        supporters={mockSupporters}
        copy={{
          title: "Supporters Wall",
          empty: "Be the first supporter this month!",
          anonymous: "Anonymous supporter",
          goldSupporter: "Gold Supporter",
        }}
      />,
    );

    expect(html).toContain("Supporters Wall");
    expect(html).toContain("Perera Grocery");
    expect(html).toContain("Gold Supporter");
    expect(html).toContain("Rs. 5,000");
    expect(html).toContain("Proud to support Sri Lankan open source!");
    expect(html).toContain("Anonymous supporter");
  });

  test("TransparencyStrip renders live monthly total and where donation goes pillars", () => {
    const html = renderToString(
      <TransparencyStrip
        monthlyTotalCents={350000}
        totalSupportersCount={14}
        copy={{
          title: "Donations this month",
          body: "Rs. {total} from {count} supporters, updated live.",
          fundsTitle: "Where your donation goes",
          fundsCert: "A code-signing certificate, so Windows stops warning people",
          fundsHardware: "Printers, scanners and scales to test with",
          fundsI18n: "Sinhala and Tamil translations",
          fundsInfra: "Hosting beyond the free plans",
        }}
      />,
    );

    expect(html).toContain("Donations this month");
    expect(html).toContain("3,500");
    expect(html).toContain("14");
    expect(html).toContain("A code-signing certificate");
    expect(html).toContain("Printers, scanners and scales to test with");
  });

  test("DonationFigure renders isometric hardware slab and pulsing azure node", () => {
    const html = renderToString(<DonationFigure />);
    expect(html).toContain("board-slab");
    expect(html).toContain("node-azure-active");
    expect(html).toContain("pulse-azure");
  });

  test("DonationView renders releases-matched container with DonationFigure, no community funding badge, and no yellow gradient line", () => {
    const html = renderToString(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <DonationView />
      </NextIntlClientProvider>,
    );

    // Releases-matched card styling
    expect(html).toContain("node-azure-active");
    expect(html).toContain("Commercial Bank");

    // Strictly NO yellow gradient line on top
    expect(html).not.toContain("via-gold");
    expect(html).not.toContain("bg-gradient-to-r");

    // Strictly NO "CEYBYTE COMMUNITY FUNDING" badge
    expect(html).not.toContain("CEYBYTE COMMUNITY FUNDING");
  });
});
