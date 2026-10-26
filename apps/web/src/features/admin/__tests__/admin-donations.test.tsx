import { describe, expect, test, mock } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { DonationsQueue } from "../components/donations-queue";
import { DonationSettings } from "../components/donation-settings";
import { SlipPreviewModal } from "../components/slip-preview-modal";
import type { AdminDonation } from "../api";
import type { DonationPaymentOptionItem } from "@cbpos/shared";

// Mock next/navigation
mock.module("next/navigation", () => ({
  usePathname: () => "/admin/donations",
  useRouter: () => ({ push: () => {} }),
}));

describe("Admin Donations UI Components", () => {
  const mockDonation: AdminDonation = {
    id: "dn-1",
    referenceCode: "CB-DN-ABC123",
    amountCents: 500000,
    displayName: "Perera Grocery",
    isAnonymous: false,
    publicMessage: "Supporting open source POS",
    showAmountPublicly: true,
    contactPrivate: "0771234567",
    merchantId: "m-1",
    merchantShopName: "Perera Grocery Store",
    merchantPhone: "+94771234567",
    status: "pending",
    slipKey: "slips/CB-DN-ABC123/slip.png",
    txnReference: "FT123456",
    rejectionReason: null,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const mockSettings: DonationPaymentOptionItem[] = [
    {
      id: "bank-1",
      accountName: "CeyByte Foundation",
      accountNumber: "100012345678",
      bankName: "Commercial Bank",
      branchName: "Kollupitiya",
      qrImageKey: "qr/combank.png",
      isEnabled: true,
      notes: "Include ref code in remarks",
    },
  ];

  test("DonationsQueue renders donations table, filter tabs, and action buttons", () => {
    const html = renderToString(
      <DonationsQueue
        initialDonations={[mockDonation]}
        total={1}
      />,
    );

    expect(html).toContain("Donations Queue");
    expect(html).toContain("CB-DN-ABC123");
    expect(html).toContain("Rs. 5,000");
    expect(html).toContain("Perera Grocery Store");
    expect(html).toContain("Pending Review");
    expect(html).toContain("View Slip");
    expect(html).toContain("Approve");
    expect(html).toContain("Reject");
  });

  test("DonationSettings renders bank accounts management form and add button", () => {
    const html = renderToString(
      <DonationSettings initialSettings={mockSettings} />,
    );

    expect(html).toContain("Donation Payment Options");
    expect(html).toContain("Commercial Bank");
    expect(html).toContain("100012345678");
    expect(html).toContain("CeyByte Foundation");
    expect(html).toContain("Add Bank Account");
    expect(html).toContain("Save Payment Options");
  });

  test("SlipPreviewModal renders sandboxed preview container with slip URL", () => {
    const html = renderToString(
      <SlipPreviewModal
        isOpen={true}
        onClose={() => {}}
        slipUrl="https://example.com/slip.png"
        contentType="image/png"
        referenceCode="CB-DN-ABC123"
      />,
    );

    expect(html).toContain("CB-DN-ABC123");
    expect(html).toContain("https://example.com/slip.png");
  });
});
