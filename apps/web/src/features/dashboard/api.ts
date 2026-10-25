import type { DashboardDonation, DashboardTicket, LatestRelease, MerchantListing } from "./types";

const API_BASE = "";

export async function fetchDashboardListing(): Promise<{
  listing: MerchantListing | null;
  latestRelease: LatestRelease | null;
}> {
  const res = await fetch(`${API_BASE}/api/me/listing`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("UNAUTHENTICATED");
    }
    throw new Error(`Failed to load listing: ${res.status}`);
  }

  const json = (await res.json()) as {
    ok: boolean;
    data: { listing: MerchantListing | null; latestRelease: LatestRelease | null };
  };
  return json.data;
}

export async function updateListing(data: Partial<MerchantListing>): Promise<MerchantListing> {
  const res = await fetch(`${API_BASE}/api/me/listing`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errJson = (await res.json().catch(() => ({}))) as { error?: { code?: string } };
    throw new Error(errJson.error?.code || `Update failed: ${res.status}`);
  }

  const json = (await res.json()) as { ok: boolean; data: { listing: MerchantListing } };
  return json.data.listing;
}

export async function claimListingFallback(params: {
  phone?: string;
  claimToken?: string;
}): Promise<{ claimed: boolean; merchantId: string }> {
  const res = await fetch(`${API_BASE}/api/me/claim`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errJson = (await res.json().catch(() => ({}))) as { error?: { code?: string } };
    throw new Error(errJson.error?.code || `Claim failed: ${res.status}`);
  }

  const json = (await res.json()) as {
    ok: boolean;
    data: { claimed: boolean; merchantId: string };
  };
  return json.data;
}

export async function fetchMyTickets(): Promise<DashboardTicket[]> {
  const res = await fetch(`${API_BASE}/api/me/tickets`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch tickets: ${res.status}`);
  }

  const json = (await res.json()) as { ok: boolean; data: { tickets: DashboardTicket[] } };
  return json.data.tickets;
}

export async function fetchMyDonations(): Promise<DashboardDonation[]> {
  const res = await fetch(`${API_BASE}/api/me/donations`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch donations: ${res.status}`);
  }

  const json = (await res.json()) as { ok: boolean; data: { donations: DashboardDonation[] } };
  return json.data.donations;
}

export async function updateLanguage(locale: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/me/settings/language`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ locale }),
  });

  if (!res.ok) {
    throw new Error(`Failed to update language: ${res.status}`);
  }
}

export async function deleteAccount(confirmShopName: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/me/account`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ confirmShopName }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: { code?: string } };
    throw new Error(err.error?.code || "Deletion failed");
  }
}
