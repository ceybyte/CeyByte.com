import { githubFetch } from "./github";
import { log } from "./log";

// 02-TRD §6. Publishing content (or a new release) rebuilds the static site through repository_dispatch.
// Call from waitUntil; a failed dispatch is logged, never surfaced to the admin request.

export async function triggerRebuild(env: Env, reason: string): Promise<boolean> {
  if (!env.GITHUB_DISPATCH_TOKEN) {
    log.warn("rebuild_skipped", { reason, why: "GITHUB_DISPATCH_TOKEN not set" });
    return false;
  }
  const res = await githubFetch(
    env,
    `/repos/${env.SITE_REPO}/dispatches`,
    { method: "POST", body: JSON.stringify({ event_type: "content-published", client_payload: { reason } }) },
    env.GITHUB_DISPATCH_TOKEN,
  );
  if (!res.ok) log.error("rebuild_failed", { reason, status: res.status });
  return res.ok;
}
