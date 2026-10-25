import { describe, expect, test, mock } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";

mock.module("next/navigation", () => ({
  useRouter: () => ({ push: () => {}, replace: () => {}, prefetch: () => {} }),
  usePathname: () => "/en/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

import { EmptyDashboard } from "./components/EmptyDashboard";
import { OverviewTab } from "./components/OverviewTab";
import type { MerchantListing } from "./types";

const mockListing: MerchantListing = {
  id: "m_test_123",
  publicId: "m_abc123",
  shopName: "Perera Stores",
  category: "grocery",
  district: "kurunegala",
  city: "Kurunegala",
  lat: 7.4863,
  lng: 80.3623,
  locationSource: "pin",
  isPublicOnMap: true,
  status: "listed",
  isSupporter: true,
  supporterSince: 1787097600000,
  phone: "0771234567",
  whatsapp: "+94771234567",
  telegram: "@perera_stores",
  fullName: "Kamal Perera",
  createdAt: 1787097600000,
  updatedAt: 1787097600000,
};

const mockCopy = {
  overviewTitle: "Your shop",
  statusListed: "Shown on the map",
  statusPrivate: "Not shown on the map",
  statusHidden: "We're reviewing it",
  statusHiddenBody: "We're taking a quick look at your listing. You can keep editing it while we do.",
  supporter: "Gold Supporter since {monthYear}",
  updateAvailable: "Version {version} of CB POS is ready.",
  updateCta: "See what's new",
};

describe("S13 Merchant Dashboard Overview (F-09)", () => {
  test("renders EmptyDashboard when no shop is linked", () => {
    const html = renderToString(
      <EmptyDashboard
        locale="en"
        onClaimSuccess={() => {}}
        copy={{
          emptyTitle: "There's no shop linked to this account yet",
          emptyBody:
            "Download CB POS from this browser to add your shop, or contact us if you've already registered it.",
        }}
      />,
    );

    expect(html).toContain("There&#x27;s no shop linked to this account yet");
    expect(html).toContain("Download CB POS");
    expect(html).toContain("Claim with phone number");
  });

  test("renders OverviewTab with shop name, status pill, and supporter badge", () => {
    const html = renderToString(
      <OverviewTab
        locale="en"
        listing={mockListing}
        latestRelease={{ version: "1.3.1" }}
        onListingUpdated={() => {}}
        copy={mockCopy}
      />,
    );

    expect(html).toContain("Perera Stores");
    expect(html).toContain("grocery");
    expect(html).toContain("Kurunegala");
    expect(html).toContain("Shown on the map");
    expect(html).toContain("Hide from map");
    expect(html).toContain("Gold Supporter");
    expect(html).toContain("Version 1.3.1 of CB POS is ready.");
  });

  test("renders warning banner when listing is hidden by admin moderation", () => {
    const hiddenListing: MerchantListing = {
      ...mockListing,
      status: "hidden",
      isPublicOnMap: false,
    };

    const html = renderToString(
      <OverviewTab
        locale="en"
        listing={hiddenListing}
        latestRelease={null}
        onListingUpdated={() => {}}
        copy={mockCopy}
      />,
    );

    expect(html).toContain("We&#x27;re reviewing it");
    expect(html).toContain("We&#x27;re taking a quick look at your listing.");
    expect(html).not.toContain("Hide from map");
  });
});
