import { Manifest } from "@cbpos/shared/schemas/manifest";
import { auditInsert } from "./audit";
import { makeDb } from "./db";
import { githubFetch } from "./github";
import { log } from "./log";
import { triggerRebuild } from "./rebuild";

export type SyncResult = {
  synced: boolean;
  version?: string;
  reason?: string;
};

export async function syncReleases(
  env: Env,
  trigger: "cron" | "webhook" | "admin" = "cron",
): Promise<SyncResult> {
  const db = makeDb(env.DB);
  const manifestUrl =
    env.RELEASE_MANIFEST_URL || "https://raw.githubusercontent.com/ceybyte/cbpos-releases/main/latest.json";

  // Check stored ETag for 304 early return (02-TRD §7.2)
  const storedEtag = await env.CACHE_KV.get("release:etag");
  const headers = new Headers();
  if (storedEtag) {
    headers.set("if-none-match", storedEtag);
  }

  let res: Response;
  try {
    res = await fetch(manifestUrl, { headers });
  } catch (err) {
    log.error("release_manifest_fetch_error", { trigger, err });
    return { synced: false, reason: "fetch_error" };
  }

  if (res.status === 304) {
    log.info("release_manifest_not_modified", { trigger, storedEtag });
    return { synced: false, reason: "not_modified" };
  }

  if (!res.ok) {
    log.warn("release_manifest_fetch_failed", { trigger, status: res.status });
    return { synced: false, reason: `fetch_failed_${res.status}` };
  }

  let rawJson: unknown;
  try {
    rawJson = await res.json();
  } catch {
    await auditInsert(db, {
      actorUserId: null,
      action: "release_sync_invalid",
      entityType: "release",
      level: "warn",
      diff: { note: "Malformed JSON in manifest" },
    });
    return { synced: false, reason: "malformed_json" };
  }

  const parse = Manifest.safeParse(rawJson);
  if (!parse.success) {
    await auditInsert(db, {
      actorUserId: null,
      action: "release_sync_invalid",
      entityType: "release",
      level: "warn",
      diff: { note: "Manifest schema validation failed", after: parse.error.issues },
    });
    log.warn("release_manifest_schema_invalid", { trigger, issues: parse.error.issues });
    return { synced: false, reason: "invalid_manifest" };
  }

  const manifest = parse.data;
  const version = manifest.version;
  const repo = env.RELEASES_REPO || "ceybyte/cbpos-releases";

  // Lookup GitHub Releases API for asset size and publish time
  let exeSize = manifest.size ?? 50 * 1024 * 1024;
  let publishedAt = manifest.published_at ? new Date(manifest.published_at).getTime() : Date.now();
  let githubReleaseId: number | null = null;

  try {
    const ghRes = await githubFetch(env, `/repos/${repo}/releases/tags/v${version}`);
    if (ghRes.ok) {
      type GhRelease = {
        id: number;
        published_at: string;
        assets: Array<{ name: string; size: number; browser_download_url: string }>;
      };
      const ghData = (await ghRes.json()) as GhRelease;
      githubReleaseId = ghData.id;
      if (ghData.published_at) {
        publishedAt = new Date(ghData.published_at).getTime();
      }

      // Check asset URL match
      const asset = ghData.assets?.find(
        (a) => a.browser_download_url === manifest.download_url || a.name.endsWith(".exe"),
      );
      if (asset) {
        exeSize = asset.size;
        if (asset.browser_download_url !== manifest.download_url) {
          await auditInsert(db, {
            actorUserId: null,
            action: "release_sync_invalid",
            entityType: "release",
            level: "warn",
            diff: {
              note: `Download URL mismatch: manifest=${manifest.download_url}, asset=${asset.browser_download_url}`,
            },
          });
          return { synced: false, reason: "download_url_mismatch" };
        }
      }
    }
  } catch (err) {
    log.warn("release_github_api_lookup_warn", { version, err });
    // In dev / test, proceed with manifest values
  }

  const now = Date.now();
  const releaseId = `release-${version}`;
  const exeName = `CBPOSSetup-${version}.exe`;

  // D1 batch update: clear existing is_latest and upsert current release
  await env.DB.batch([
    env.DB.prepare(
      "UPDATE releases SET is_latest = 0, updated_at = ? WHERE channel = 'stable' AND is_latest = 1",
    ).bind(now),
    env.DB.prepare(
      `INSERT INTO releases (
        id, version, channel, title, notes_md, min_os, release_date, published_at,
        min_version, changelog_raw, exe_name, exe_url, exe_size, exe_sha256,
        is_latest, is_yanked, source, github_release_id, synced_at, created_at, updated_at
      ) VALUES (?, ?, 'stable', ?, ?, 'Windows 10 or later', ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 'github_sync', ?, ?, ?, ?)
      ON CONFLICT(version, channel) DO UPDATE SET
        is_latest = 1,
        is_yanked = 0,
        exe_size = excluded.exe_size,
        exe_url = excluded.exe_url,
        exe_sha256 = excluded.exe_sha256,
        synced_at = excluded.synced_at,
        updated_at = excluded.updated_at`,
    ).bind(
      releaseId,
      version,
      `CB POS v${version}`,
      manifest.changelog || "",
      manifest.release_date,
      publishedAt,
      manifest.min_version || "Windows 10 or later",
      manifest.changelog || "",
      exeName,
      manifest.download_url,
      exeSize,
      manifest.sha256,
      githubReleaseId,
      now,
      now,
      now,
    ),
  ]);

  // Update KV release:latest
  const latestPayload = {
    id: releaseId,
    version,
    channel: "stable",
    release_date: manifest.release_date,
    download_url: manifest.download_url,
    changelog: manifest.changelog || "",
    min_version: manifest.min_version || "Windows 10 or later",
    sha256: manifest.sha256,
    exe_size: exeSize,
    size: exeSize,
    published_at: publishedAt,
    is_latest: true,
  };

  await env.CACHE_KV.put("release:latest", JSON.stringify(latestPayload));

  const etag = res.headers.get("etag");
  if (etag) {
    await env.CACHE_KV.put("release:etag", etag);
  }

  // Audit log entry
  await auditInsert(db, {
    actorUserId: null,
    action: "release_synced",
    entityType: "release",
    entityId: releaseId,
    level: "info",
    diff: { after: latestPayload, note: `Synced via ${trigger}` },
  });

  // Trigger rebuild dispatch for static site update (02-TRD §7.2 step 6)
  try {
    await triggerRebuild(env, `release_sync_${version}`);
  } catch (e) {
    log.warn("release_sync_rebuild_dispatch_warn", { version, error: e });
  }

  log.info("release_synced_successfully", { version, trigger });
  return { synced: true, version };
}
