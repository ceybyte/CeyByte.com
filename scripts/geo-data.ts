// Builds apps/web/public/data/lk-districts.json and lk-cities.json from OpenStreetMap through the Overpass API.
// Data © OpenStreetMap contributors, ODbL 1.0 (https://www.openstreetmap.org/copyright); the attribution is
// written into both files. Rerun when district or town data needs refreshing:  bun scripts/geo-data.ts
import { DISTRICTS, PROVINCES, type District } from "../packages/shared/src/enums";

const OVERPASS = "https://overpass-api.de/api/interpreter";
const OUT = "apps/web/public/data";
const ATTRIBUTION = "© OpenStreetMap contributors, ODbL 1.0, https://www.openstreetmap.org/copyright";
// Cities, towns and suburbs: ~600 places. Villages (~3,700) would multiply the file size; shops outside these
// can still type their town.
const PLACES = "city|town|suburb";

type OsmElement = {
  type: "relation" | "node";
  id: number;
  tags: Record<string, string>;
  center?: { lat: number; lon: number };
  lat?: number;
  lon?: number;
  bounds?: { minlat: number; minlon: number; maxlat: number; maxlon: number };
};

// The public Overpass instance often answers 429/502/504 under load; back off and retry.
async function overpass(query: string, attempts = 4): Promise<OsmElement[]> {
  for (let i = 1; ; i++) {
    const res = await fetch(OVERPASS, {
      method: "POST",
      headers: { "user-agent": "ceybyte.com-data-build/1.0 (+https://ceybyte.com)" },
      body: new URLSearchParams({ data: query }),
    });
    if (res.ok) return ((await res.json()) as { elements: OsmElement[] }).elements;
    if (i >= attempts || ![429, 502, 503, 504].includes(res.status)) {
      throw new Error(`Overpass ${res.status}`);
    }
    await Bun.sleep(15_000 * i);
  }
}

const round4 = (n: number) => Math.round(n * 1e4) / 1e4;

/** "Galle District" → "galle"; "Nuwara Eliya District" → "nuwara-eliya". */
function slug(nameEn: string): District | null {
  const s = nameEn
    .replace(/\s*District$/i, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
  return (DISTRICTS as readonly string[]).includes(s) ? (s as District) : null;
}

/** Keeps the script's own words: drops "District"/"දිස්ත්‍රික්කය"/"மாவட்டம்" and any Latin transliteration. */
function cleanLocal(name: string | undefined): string | null {
  if (!name) return null;
  const s = name
    .replace(/\(.*?\)/g, "")
    .replace(/[A-Za-zĀ-ſḀ-ỿ.]+/g, "")
    .replace(/දිස්ත්‍රික්කය|மாவட்டம்/g, "")
    .trim();
  return s || null;
}

const provinceOf = (d: District) =>
  (Object.entries(PROVINCES).find(([, ds]) => (ds as readonly string[]).includes(d))?.[0] ?? null) as string;

const lk = `area["ISO3166-1"="LK"][admin_level=2]->.lk;rel(area.lk)["boundary"="administrative"]["admin_level"="5"]->.ds;`;
const elements = await overpass(
  `[out:json][timeout:250];${lk}foreach.ds->.d(.d out tags bb;.d map_to_area->.a;node(area.a)[place~"^(${PLACES})$"][name];out tags center;);`,
);

type CityOut = {
  name: string;
  si: string | null;
  ta: string | null;
  district: District;
  lat: number;
  lng: number;
};
type DistrictOut = {
  id: District;
  province: string;
  name: { en: string; si: string | null; ta: string | null };
  centroid: [number, number];
  bbox: [number, number, number, number];
};

const districts = new Map<District, DistrictOut>();
const cities: CityOut[] = [];
const seen = new Set<number>();
let current: District | null = null;

for (const el of elements) {
  if (el.type === "relation") {
    current = slug(el.tags["name:en"] ?? el.tags.name ?? "");
    if (!current) throw new Error(`Unknown district: ${el.tags["name:en"] ?? el.tags.name}`);
    const b = el.bounds;
    if (!b) throw new Error(`No bounds for ${current}`);
    districts.set(current, {
      id: current,
      province: provinceOf(current),
      name: {
        en: (el.tags["name:en"] ?? "").replace(/\s*District$/i, ""),
        si: cleanLocal(el.tags["name:si"]),
        ta: cleanLocal(el.tags["name:ta"]),
      },
      // Middle of the bounding box, as Overpass computes `center`; good enough to centre a map on.
      centroid: [round4((b.minlat + b.maxlat) / 2), round4((b.minlon + b.maxlon) / 2)],
      bbox: [round4(b.minlon), round4(b.minlat), round4(b.maxlon), round4(b.maxlat)],
    });
    continue;
  }
  // A node on a border can fall inside two district polygons; the first wins.
  if (!current || seen.has(el.id)) continue;
  const lat = el.center?.lat ?? el.lat;
  const lng = el.center?.lon ?? el.lon;
  const name = el.tags["name:en"] ?? el.tags.name;
  if (lat === undefined || lng === undefined || !name || !/^[\x20-\x7E]+$/.test(name)) continue;
  seen.add(el.id);
  cities.push({
    name,
    si: cleanLocal(el.tags["name:si"]),
    ta: cleanLocal(el.tags["name:ta"]),
    district: current,
    lat: round4(lat),
    lng: round4(lng),
  });
}

// Fill missing district names from the district's main town (same OSM source), never from a guess.
for (const d of districts.values()) {
  const town = cities.find((c) => c.district === d.id && c.name.toLowerCase() === d.name.en.toLowerCase());
  d.name.si ??= town?.si ?? null;
  d.name.ta ??= town?.ta ?? null;
}

const missing = DISTRICTS.filter((d) => !districts.has(d));
if (missing.length) throw new Error(`Districts missing from OSM: ${missing.join(", ")}`);

cities.sort((a, b) => a.district.localeCompare(b.district) || a.name.localeCompare(b.name));
const districtList = DISTRICTS.map((d) => districts.get(d));

await Bun.write(
  `${OUT}/lk-districts.json`,
  JSON.stringify({ attribution: ATTRIBUTION, districts: districtList }, null, 2) + "\n",
);
await Bun.write(`${OUT}/lk-cities.json`, JSON.stringify({ attribution: ATTRIBUTION, cities }) + "\n");

const noName = districtList.filter((d) => !d?.name.si || !d?.name.ta).map((d) => d?.id);
console.warn(
  `Wrote ${districtList.length} districts and ${cities.length} places.` +
    (noName.length ? ` Missing Sinhala or Tamil district names: ${noName.join(", ")}` : ""),
);
