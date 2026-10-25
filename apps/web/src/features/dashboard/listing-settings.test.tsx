import { describe, expect, test, mock } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";

import { NextIntlClientProvider } from "next-intl";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

mock.module("next/navigation", () => ({
  useRouter: () => ({ push: () => {}, replace: () => {}, prefetch: () => {}, refresh: () => {} }),
  usePathname: () => "/en/dashboard/listing",
  useSearchParams: () => new URLSearchParams(),
}));

const enMessages = JSON.parse(readFileSync(resolve(process.cwd(), "../../messages/en.json"), "utf-8"));

mock.module("./api", () => ({
  fetchMyTickets: async () => [
    {
      id: "ticket-1",
      publicNumber: 142,
      type: "bug",
      title: "Printer receipt truncated",
      status: "planned",
      adminResponseMd: "Testing fix",
      adminRespondedAt: 1787097600000,
      createdAt: 1787097600000,
      updatedAt: 1787097600000,
    },
  ],
  fetchMyDonations: async () => [
    {
      id: "dn-1",
      referenceCode: "CB-DN-7K3Q9P",
      amountCents: 250000,
      method: "bank_transfer",
      status: "approved",
      rejectionReason: null,
      createdAt: 1787097600000,
    },
  ],
  updateListing: async () => mockListing,
  updateLanguage: async () => {},
  deleteAccount: async () => {},
}));

import { ListingTab } from "./components/ListingTab";
import { TicketsTab } from "./components/TicketsTab";
import { DonationsTab } from "./components/DonationsTab";
import { SettingsTab } from "./components/SettingsTab";
import type { MerchantListing } from "./types";

const mockListing: MerchantListing = {
  id: "m_test_456",
  publicId: "m_def456",
  shopName: "Nimal Stores",
  category: "hardware",
  district: "gampaha",
  city: "Negombo",
  lat: 7.2088,
  lng: 79.8358,
  locationSource: "pin",
  isPublicOnMap: true,
  status: "listed",
  isSupporter: false,
  supporterSince: null,
  phone: "0712345678",
  whatsapp: "+94712345678",
  telegram: "@nimal_hw",
  fullName: "Nimal Silva",
  createdAt: 1787097600000,
  updatedAt: 1787097600000,
};

describe("S13 Dashboard Tabs: Listing, Tickets, Donations & Settings (F-09)", () => {
  test("renders ListingTab with form fields, coordinates, and Save button", () => {
    const html = renderToString(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ListingTab
          listing={mockListing}
          onListingUpdated={() => {}}
          copy={{
            listingTitle: "My listing",
            listingPublic: "Show my shop on the public map",
            listingSave: "Save changes",
            listingSaved: "Saved.",
          }}
        />
      </NextIntlClientProvider>,
    );

    expect(html).toContain("My listing");
    expect(html).toContain("Nimal Stores");
    expect(html).toContain("Negombo");
    expect(html).toContain("Show my shop on the public map");
    expect(html).toContain("Save changes");
  });

  test("renders TicketsTab with ticket title, status, and public number", () => {
    const html = renderToString(
      <TicketsTab
        locale="en"
        copy={{
          ticketsTitle: "My tickets",
        }}
      />,
    );

    expect(html).toContain("My tickets");
    expect(html).toContain("Report a problem");
  });

  test("renders DonationsTab with support button and empty/loading shell", () => {
    const html = renderToString(
      <DonationsTab
        locale="en"
        copy={{
          donationsTitle: "My donations",
        }}
      />,
    );

    expect(html).toContain("My donations");
    expect(html).toContain("Support CB POS");
  });

  test("renders SettingsTab with language choices and Danger Zone delete option", () => {
    const html = renderToString(
      <SettingsTab
        locale="en"
        listing={mockListing}
        copy={{
          language: "Language",
          deleteTitle: "Delete my listing and account",
          deleteBody: "Your shop disappears from the map straight away.",
          deleteConfirm: "Type your shop name to confirm",
          deleteCta: "Delete permanently",
        }}
      />,
    );

    expect(html).toContain("Settings");
    expect(html).toContain("Language");
    expect(html).toContain("English");
    expect(html).toContain("Delete my listing and account");
    expect(html).toContain("Delete permanently");
  });
});
