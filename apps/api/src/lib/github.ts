import { hmacSha256Hex, safeEqual } from "./crypto";

// GitHub REST helpers for release sync (02-TRD §7) and build status (§6).

const API = "https://api.github.com";

export function githubFetch(
  env: Pick<Env, "GITHUB_API_TOKEN">,
  path: string,
  init: RequestInit = {},
  token = env.GITHUB_API_TOKEN,
) {
  const headers = new Headers(init.headers);
  headers.set("accept", "application/vnd.github+json");
  headers.set("x-github-api-version", "2022-11-28");
  headers.set("user-agent", "ceybyte.com");
  if (token) headers.set("authorization", `Bearer ${token}`);
  return fetch(`${API}${path}`, { ...init, headers });
}

/** X-Hub-Signature-256 = "sha256=" + HMAC_SHA256(secret, rawBody) (02-TRD §12.4). */
export async function verifyWebhookSignature(secret: string, rawBody: ArrayBuffer, header: string | null) {
  if (!secret || !header?.startsWith("sha256=")) return false;
  return safeEqual(header, `sha256=${await hmacSha256Hex(secret, rawBody)}`);
}

export type WorkflowRun = {
  id: number;
  status: string;
  conclusion: string | null;
  created_at: string;
  html_url: string;
};

export async function latestDeployRun(env: Env): Promise<WorkflowRun | null> {
  const res = await githubFetch(env, `/repos/${env.SITE_REPO}/actions/workflows/deploy.yml/runs?per_page=1`);
  if (!res.ok) return null;
  const body: { workflow_runs?: WorkflowRun[] } = await res.json();
  return body.workflow_runs?.[0] ?? null;
}
