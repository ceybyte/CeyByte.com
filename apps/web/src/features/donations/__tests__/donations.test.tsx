import { describe, expect, test } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { BankDetailsCard } from "../components/BankDetailsCard";
import { SupportersWall } from "../components/SupportersWall";
import { TransparencyStrip } from "../components/TransparencyStrip";
import type { DonationPaymentOption, PublicSupporter } from "../types";

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
    // Strict Single Green Button Rule: no green button classes (#39FF14 or bg-emerald-500/bg-[#39FF14])
    expect(html).not.toContain("#39FF14");
    expect(html).not.toContain("bg-[#39FF14]");
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
});
