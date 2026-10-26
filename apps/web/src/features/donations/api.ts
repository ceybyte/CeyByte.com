import type {
  DonationCreateInput,
  DonationCreateResult,
  DonationStatusResult,
  DonationSubmitInput,
  DonationSummary,
} from "./types";

const API_BASE = "";

export async function fetchDonationSummary(): Promise<DonationSummary> {
  const res = await fetch(`${API_BASE}/api/donations/summary`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Failed to load donation summary: ${res.status}`);
  }

  const json = (await res.json()) as { ok: boolean; data: DonationSummary };
  return json.data;
}

export async function createDonation(input: DonationCreateInput): Promise<DonationCreateResult> {
  const res = await fetch(`${API_BASE}/api/donations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  });

  const json = (await res.json()) as {
    ok: boolean;
    data?: DonationCreateResult;
    error?: { code?: string; message?: string };
  };

  if (!res.ok || !json.ok || !json.data) {
    throw new Error(json.error?.code || json.error?.message || "Failed to create donation");
  }

  return json.data;
}

export async function submitDonationSlip(
  ref: string,
  input: DonationSubmitInput,
): Promise<{ id: string; referenceCode: string; status: string }> {
  const res = await fetch(`${API_BASE}/api/donations/${encodeURIComponent(ref)}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  });

  const json = (await res.json()) as {
    ok: boolean;
    data?: { id: string; referenceCode: string; status: string };
    error?: { code?: string; message?: string };
  };

  if (!res.ok || !json.ok || !json.data) {
    throw new Error(json.error?.code || json.error?.message || "Failed to submit donation slip");
  }

  return json.data;
}

export async function fetchDonationStatus(ref: string): Promise<DonationStatusResult> {
  const res = await fetch(`${API_BASE}/api/donations/${encodeURIComponent(ref)}/status`, {
    headers: { Accept: "application/json" },
  });

  const json = (await res.json()) as {
    ok: boolean;
    data?: DonationStatusResult;
    error?: { code?: string; message?: string };
  };

  if (!res.ok || !json.ok || !json.data) {
    throw new Error(json.error?.code || json.error?.message || "Donation not found");
  }

  return json.data;
}

export async function presignAndUploadSlip(
  file: File,
  entityRef: string,
  turnstileToken?: string,
): Promise<{ key: string }> {
  // Client-side size check (AC-11.1)
  const MAX_BYTES = 5 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    throw new Error("errors.FILE_TOO_LARGE");
  }

  // 1. Request presigned PUT URL
  const presignRes = await fetch(`${API_BASE}/api/uploads/presign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      purpose: "donation_slip",
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      size: file.size,
      entityRef,
      turnstileToken,
    }),
  });

  const presignJson = (await presignRes.json()) as {
    ok: boolean;
    data?: { uploadUrl: string; key: string };
    error?: { code?: string };
  };

  if (!presignRes.ok || !presignJson.ok || !presignJson.data) {
    throw new Error(presignJson.error?.code || "Failed to initialize slip upload");
  }

  const { uploadUrl, key } = presignJson.data;

  // 2. Direct PUT to R2 presigned URL
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error(`Upload to storage failed: ${uploadRes.status}`);
  }

  return { key };
}
