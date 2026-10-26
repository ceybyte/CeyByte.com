export interface OverviewData {
  merchants: number;
  pendingSlips: number;
  openTickets: number;
  districtsCovered: number;
  todayDownloads: number;
  sparkline: number[];
}

export interface AdminMerchant {
  id: string;
  publicId: string;
  fullName: string;
  shopName: string;
  category: string;
  district: string;
  city: string;
  lat: number;
  lng: number;
  phone: string | null;
  whatsapp?: string | null;
  telegram?: string | null;
  status: "listed" | "hidden" | "rejected";
  isPublicOnMap: boolean;
  isSupporter: boolean;
  supporterSince?: string | null;
  createdAt: string | number;
  updatedAt: string | number;
}

export interface AdminDocCategory {
  id: string;
  slug: string;
  nameEn: string;
  nameSi?: string;
  nameTa?: string;
  sortOrder: number;
}

export interface AdminDocArticle {
  id: string;
  categorySlug: string;
  slug: string;
  locale: string;
  title: string;
  summary?: string;
  bodyMd: string;
  status: "draft" | "published";
  sortOrder: number;
  publishedAt?: string | number | null;
  createdAt: string | number;
  updatedAt: string | number;
}

export interface AdminRelease {
  id: string;
  version: string;
  channel: "stable" | "beta";
  title: string;
  notesMd: string;
  minOs: string;
  releaseDate: string;
  publishedAt: string | number;
  exeName: string;
  exeUrl: string;
  exeSize: number;
  exeSha256: string;
  isLatest: boolean;
  isYanked: boolean;
  source: string;
  syncedAt?: string | number | null;
}

export interface AdminAuditEntry {
  id: string;
  actorUserId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  diff?: Record<string, unknown> | null;
  ipHash?: string | null;
  createdAt: string | number;
}

export class AdminApiError extends Error {
  status?: number;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
    credentials: "same-origin",
  });

  if (res.status === 404 || res.status === 401 || res.status === 403) {
    const error = new AdminApiError("Admin access unauthorized or not found");
    error.status = res.status;
    throw error;
  }

  if (!res.ok) {
    const errJson = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(errJson?.error?.message || `Request failed with ${res.status}`);
  }

  const json = (await res.json()) as { data: T };
  return json.data;
}

export async function fetchOverview(): Promise<OverviewData> {
  return request<OverviewData>("/api/admin/overview");
}

export async function fetchMerchants(params?: {
  search?: string;
  district?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: AdminMerchant[] }> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.district && params.district !== "all") query.set("district", params.district);
  if (params?.status && params.status !== "all") query.set("status", params.status);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));

  const qs = query.toString();
  return request<{ items: AdminMerchant[] }>(`/api/admin/merchants${qs ? `?${qs}` : ""}`);
}

export async function fetchMerchant(id: string): Promise<AdminMerchant> {
  return request<AdminMerchant>(`/api/admin/merchants/${id}`);
}

export async function revealMerchantContact(id: string): Promise<{
  id: string;
  fullName: string;
  phone: string;
  whatsapp?: string | null;
  telegram?: string | null;
}> {
  return request(`/api/admin/merchants/${id}/reveal`, { method: "POST" });
}

export async function updateMerchant(
  id: string,
  body: {
    status?: "listed" | "hidden" | "rejected";
    isPublicOnMap?: boolean;
    isSupporter?: boolean;
  },
): Promise<AdminMerchant> {
  return request<AdminMerchant>(`/api/admin/merchants/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function fetchDocsCategories(): Promise<{ items: AdminDocCategory[] }> {
  return request<{ items: AdminDocCategory[] }>("/api/admin/docs/categories");
}

export async function fetchDocArticle(id: string): Promise<AdminDocArticle> {
  return request<AdminDocArticle>(`/api/admin/docs/articles/${id}`);
}

export async function updateDocArticle(
  id: string,
  body: {
    title?: string;
    summary?: string;
    bodyMd?: string;
    status?: "draft" | "published";
  },
): Promise<AdminDocArticle> {
  return request<AdminDocArticle>(`/api/admin/docs/articles/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function publishDocArticle(id: string): Promise<{ published: boolean }> {
  return request<{ published: boolean }>(`/api/admin/docs/articles/${id}/publish`, {
    method: "POST",
  });
}

export async function fetchReleases(): Promise<{ items: AdminRelease[] }> {
  return request<{ items: AdminRelease[] }>("/api/admin/releases");
}

export async function syncReleases(): Promise<{ synced: boolean; releaseCount?: number }> {
  return request<{ synced: boolean; releaseCount?: number }>("/api/admin/releases/sync", {
    method: "POST",
  });
}

export async function updateRelease(
  id: string,
  body: { isYanked?: boolean; notesMd?: string },
): Promise<AdminRelease> {
  return request<AdminRelease>(`/api/admin/releases/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function fetchAuditLog(): Promise<{ items: AdminAuditEntry[] }> {
  return request<{ items: AdminAuditEntry[] }>("/api/admin/audit");
}

export async function triggerRebuild(reason?: string): Promise<{ queued: boolean; reason?: string }> {
  return request<{ queued: boolean; reason?: string }>("/api/admin/rebuild", {
    method: "POST",
    body: JSON.stringify({ reason: reason || "admin_manual" }),
  });
}

export interface AdminFeedbackTicket {
  id: string;
  publicNumber: number;
  formattedNumber: string;
  draftId?: string | null;
  type: "bug" | "feature" | "question" | "listing_report";
  title: string;
  bodyMd: string;
  appVersion?: string | null;
  windowsVersion?: string | null;
  severity?: "crash" | "blocks_billing" | "wrong_output" | "cosmetic" | null;
  status: "open" | "triaged" | "planned" | "in_progress" | "shipped" | "closed" | "duplicate" | "wont_fix";
  isPublic: boolean;
  voteCount: number;
  crashLogKey?: string | null;
  crashLogUrl?: string | null;
  screenshotKey?: string | null;
  screenshotPrivateUrl?: string | null;
  screenshotPublicKey?: string | null;
  contactPrivate?: string | null;
  reporterUserId?: string | null;
  reportedMerchantId?: string | null;
  duplicateOfId?: string | null;
  resolvedInReleaseId?: string | null;
  releaseVersion?: string | null;
  adminResponseMd?: string | null;
  adminRespondedAt?: string | number | null;
  createdAt: string | number;
  updatedAt: string | number;
}

export async function fetchAdminFeedback(params?: {
  status?: string;
  type?: string;
  search?: string;
}): Promise<{ items: AdminFeedbackTicket[] }> {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.type) q.set("type", params.type);
  if (params?.search) q.set("search", params.search);
  const query = q.toString();
  return request<{ items: AdminFeedbackTicket[] }>(`/api/admin/feedback${query ? `?${query}` : ""}`);
}

export async function updateAdminFeedback(
  id: string,
  body: {
    status?: string;
    severity?: string | null;
    adminResponseMd?: string | null;
    duplicateOfId?: string | null;
    resolvedInReleaseId?: string | null;
    isPublic?: boolean;
    approveScreenshot?: boolean;
  },
): Promise<AdminFeedbackTicket> {
  return request<AdminFeedbackTicket>(`/api/admin/feedback/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export interface AdminDonation {
  id: string;
  referenceCode: string;
  amountCents: number;
  displayName: string | null;
  isAnonymous: boolean;
  publicMessage: string | null;
  showAmountPublicly: boolean;
  contactPrivate: string | null;
  merchantId: string | null;
  merchantShopName?: string | null;
  merchantPhone?: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  slipKey: string | null;
  txnReference: string | null;
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | number | null;
  createdAt: string | number;
  updatedAt: string | number;
}

export interface AdminDonationsListResponse {
  items: AdminDonation[];
  total: number;
  page?: number;
  pageSize?: number;
}

export async function fetchAdminDonations(params?: {
  status?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<AdminDonationsListResponse> {
  const q = new URLSearchParams();
  if (params?.status && params.status !== "all") q.set("status", params.status);
  if (params?.page) q.set("page", String(params.page));
  if (params?.pageSize) q.set("pageSize", String(params.pageSize));
  if (params?.search) q.set("search", params.search);
  const query = q.toString();
  return request<AdminDonationsListResponse>(`/api/admin/donations${query ? `?${query}` : ""}`);
}

export async function fetchDonationSlipUrl(
  id: string,
): Promise<{ url: string; expiresAt: number; contentType: string }> {
  return request<{ url: string; expiresAt: number; contentType: string }>(
    `/api/admin/donations/${encodeURIComponent(id)}/slip-url`,
  );
}

export async function approveDonation(
  id: string,
  body?: { approveMessage?: boolean },
): Promise<{ id: string; status: "approved" }> {
  return request<{ id: string; status: "approved" }>(
    `/api/admin/donations/${encodeURIComponent(id)}/approve`,
    {
      method: "POST",
      body: JSON.stringify(body || {}),
    },
  );
}

export async function rejectDonation(
  id: string,
  reason: string,
): Promise<{ id: string; status: "rejected" }> {
  return request<{ id: string; status: "rejected" }>(
    `/api/admin/donations/${encodeURIComponent(id)}/reject`,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    },
  );
}

import type { DonationPaymentOptionItem } from "@cbpos/shared";

export async function fetchDonationPaymentSettings(): Promise<DonationPaymentOptionItem[]> {
  return request<DonationPaymentOptionItem[]>("/api/admin/donations/settings");
}

export async function updateDonationPaymentSettings(
  settings: DonationPaymentOptionItem[],
): Promise<DonationPaymentOptionItem[]> {
  return request<DonationPaymentOptionItem[]>("/api/admin/donations/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}

