import { PUBLIC_GEO_COLUMNS, publicMapWhere, toGeoFeature } from "@cbpos/shared/db/projections";
import { merchants } from "@cbpos/shared/db/schema";
import type { Db } from "./db";
import { utcDay } from "./iphash";

// 02-TRD §10. The public map reads a versioned snapshot from KV; D1 is only read when the snapshot is missing.
// Every write that changes a public merchant field calls bumpGeoVersion(). KV allows 1,000 writes a day, so
// after BUMP_BUDGET bumps in a day we only mark the snapshot dirty and let the 30-minute cron rebuild it.

const VERSION_KEY = "geo:version";
const DIRTY_KEY = "geo:dirty";
const SNAPSHOT_TTL = 7 * 24 * 3600;
const BUMP_BUDGET = 300;

type VersionState = { n: number; day: string; bumps: number };

const snapshotKey = (n: number) => `geo:snapshot:v${n}`;

export type GeoCollection = {
  type: "FeatureCollection";
  version: number;
  generatedAt: string;
  features: ReturnType<typeof toGeoFeature>[];
};

export async function readVersion(kv: KVNamespace): Promise<VersionState> {
  return (await kv.get<VersionState>(VERSION_KEY, "json")) ?? { n: 0, day: utcDay(), bumps: 0 };
}

export async function buildGeoCollection(db: Db, version: number): Promise<GeoCollection> {
  const rows = await db.select(PUBLIC_GEO_COLUMNS).from(merchants).where(publicMapWhere);
  return {
    type: "FeatureCollection",
    version,
    generatedAt: new Date().toISOString(),
    features: rows.map(toGeoFeature),
  };
}

export async function getGeoSnapshot(kv: KVNamespace, db: Db): Promise<GeoCollection> {
  const { n } = await readVersion(kv);
  const cached = await kv.get<GeoCollection>(snapshotKey(n), "json");
  if (cached) return cached;
  const fresh = await buildGeoCollection(db, n);
  await kv.put(snapshotKey(n), JSON.stringify(fresh), { expirationTtl: SNAPSHOT_TTL });
  return fresh;
}

/** Call from waitUntil after a public merchant field changes. */
export async function bumpGeoVersion(kv: KVNamespace, db: Db) {
  const state = await readVersion(kv);
  const today = utcDay();
  const bumps = state.day === today ? state.bumps + 1 : 1;
  if (bumps > BUMP_BUDGET) {
    await kv.put(DIRTY_KEY, "1");
    return;
  }
  const next: VersionState = { n: state.n + 1, day: today, bumps };
  await kv.put(VERSION_KEY, JSON.stringify(next));
  await kv.put(snapshotKey(next.n), JSON.stringify(await buildGeoCollection(db, next.n)), {
    expirationTtl: SNAPSHOT_TTL,
  });
}

/** Cron: rebuild once if bumps were deferred. */
export async function rebuildIfDirty(kv: KVNamespace, db: Db) {
  if (!(await kv.get(DIRTY_KEY))) return false;
  const state = await readVersion(kv);
  const next: VersionState = { ...state, n: state.n + 1 };
  await kv.put(VERSION_KEY, JSON.stringify(next));
  await kv.put(snapshotKey(next.n), JSON.stringify(await buildGeoCollection(db, next.n)), {
    expirationTtl: SNAPSHOT_TTL,
  });
  await kv.delete(DIRTY_KEY);
  return true;
}
