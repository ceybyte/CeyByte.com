import { FeedbackListResponse, PublicFeedbackTicket, SimilarTicket } from "./types";

const API_BASE = "";

export async function fetchFeedbackList(params?: {
  type?: string;
  status?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<FeedbackListResponse> {
  const q = new URLSearchParams();
  if (params?.type && params.type !== "all") q.set("type", params.type);
  if (params?.status && params.status !== "all") q.set("status", params.status);
  if (params?.sort) q.set("sort", params.sort);
  if (params?.page) q.set("page", String(params.page));
  if (params?.pageSize) q.set("pageSize", String(params.pageSize));
  if (params?.search) q.set("search", params.search);

  const query = q.toString();
  const res = await fetch(`${API_BASE}/api/feedback${query ? `?${query}` : ""}`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Failed to load feedback: ${res.status}`);
  }

  const json = (await res.json()) as { ok: boolean; data: FeedbackListResponse };
  return json.data;
}

export async function fetchTicket(ticketNumber: string): Promise<PublicFeedbackTicket> {
  const res = await fetch(`${API_BASE}/api/feedback/${ticketNumber}`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Ticket not found: ${res.status}`);
  }

  const json = (await res.json()) as { ok: boolean; data: PublicFeedbackTicket };
  return json.data;
}

export async function fetchSimilarTickets(query: string): Promise<SimilarTicket[]> {
  if (!query || query.trim().length < 2) return [];
  const res = await fetch(`${API_BASE}/api/feedback/similar?q=${encodeURIComponent(query.trim())}`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) return [];
  const json = (await res.json()) as { ok: boolean; data: SimilarTicket[] };
  return json.data;
}

export async function submitTicket(data: {
  type: string;
  title: string;
  bodyMd: string;
  appVersion?: string | null;
  windowsVersion?: string | null;
  severity?: string | null;
  contactPrivate?: string | null;
  draftId?: string | null;
  crashLogKey?: string | null;
  screenshotKey?: string | null;
  reportedMerchantId?: string | null;
  turnstileToken?: string;
}): Promise<{
  id: string;
  publicNumber: number;
  formattedNumber: string;
  status: string;
  isPublic: boolean;
}> {
  const res = await fetch(`${API_BASE}/api/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const json = (await res.json()) as {
    ok: boolean;
    data: {
      id: string;
      publicNumber: number;
      formattedNumber: string;
      status: string;
      isPublic: boolean;
    };
    error?: { message?: string; code?: string };
  };

  if (!res.ok || !json.ok) {
    throw new Error(json.error?.message || `Failed to submit ticket: ${res.status}`);
  }

  return json.data;
}

export async function voteTicket(ticketNumber: string): Promise<{
  voted: boolean;
  alreadyVoted?: boolean;
  voteCount: number;
}> {
  const res = await fetch(`${API_BASE}/api/feedback/${ticketNumber}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  const json = (await res.json()) as {
    ok: boolean;
    data: { voted: boolean; alreadyVoted?: boolean; voteCount: number };
  };

  if (!res.ok || !json.ok) {
    throw new Error(`Failed to vote: ${res.status}`);
  }

  return json.data;
}

export async function presignAndUploadFile(
  purpose: "crash_log" | "ticket_screenshot",
  file: File,
  entityRef: string,
  turnstileToken?: string,
): Promise<{ key: string }> {
  // 1. Request presigned PUT URL
  const presignRes = await fetch(`${API_BASE}/api/uploads/presign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      purpose,
      fileName: file.name,
      contentType: file.type || (purpose === "crash_log" ? "text/plain" : "image/png"),
      size: file.size,
      entityRef,
      turnstileToken,
    }),
  });

  const presignJson = (await presignRes.json()) as {
    ok: boolean;
    data: { uploadUrl: string; key: string };
    error?: { code?: string };
  };

  if (!presignRes.ok || !presignJson.ok) {
    throw new Error(presignJson.error?.code || "Failed to initialize upload");
  }

  const { uploadUrl, key } = presignJson.data;

  // 2. Direct PUT to R2 presigned URL
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || (purpose === "crash_log" ? "text/plain" : "image/png"),
    },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error(`Upload to storage failed: ${uploadRes.status}`);
  }

  return { key };
}
