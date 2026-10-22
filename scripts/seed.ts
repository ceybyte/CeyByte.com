// Seed data (05-SCHEMA §9).
//   bun scripts/seed.ts                                   # local D1: everything below
//   bun scripts/seed.ts --preview                         # cbpos-db-preview: same as local
//   bun scripts/seed.ts --remote --allow-production-content  # production: docs categories and draft articles only
// Production never gets synthetic merchants or the dev release. Safe to rerun: synthetic shops are replaced,
// everything else is inserted only if missing.
import { DISTRICTS, type District } from "../packages/shared/src/enums";
import cityFile from "../apps/web/public/data/lk-cities.json";

const args = new Set(process.argv.slice(2));
const target = args.has("--remote") ? "production" : args.has("--preview") ? "preview" : "local";
if (target === "production" && !args.has("--allow-production-content")) {
  console.error("Refusing to seed production without --allow-production-content.");
  process.exit(1);
}
const synthetic = target !== "production";

/* ---------- SQL helpers (wrangler d1 execute can't bind parameters) ---------- */
type Value = string | number | boolean | null;
const lit = (v: Value) =>
  v === null
    ? "NULL"
    : typeof v === "boolean"
      ? v
        ? "1"
        : "0"
      : typeof v === "number"
        ? String(v)
        : `'${v.replace(/'/g, "''")}'`;
const insert = (table: string, row: Record<string, Value>, conflict = "ON CONFLICT DO NOTHING") =>
  `INSERT INTO ${table} (${Object.keys(row).join(", ")}) VALUES (${Object.values(row).map(lit).join(", ")}) ${conflict};`;

// Deterministic so reruns produce the same shops (mulberry32).
let state = 0xcb705;
const rand = () => {
  state = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)] as T;
const uuid = () => crypto.randomUUID();
const now = Date.now();
const sql: string[] = [];

/* ---------- Docs categories (PRD F-05). SI/TA titles wait for translators. ---------- */
const CATEGORIES = [
  ["getting-started", "Getting started", "Rocket"],
  ["cashiering", "Cashiering", "ShoppingCart"],
  ["products-inventory", "Products and inventory", "Package"],
  ["tax", "Tax", "Percent"],
  ["hardware", "Hardware", "Printer"],
  ["receipts", "Receipts", "ReceiptText"],
  ["backup-restore", "Backup and restore", "DatabaseBackup"],
  ["multiple-tills", "Multiple tills", "Network"],
  ["troubleshooting", "Troubleshooting", "Wrench"],
  ["release-notes", "Release notes", "History"],
] as const;

CATEGORIES.forEach(([slug, title, icon], i) => {
  sql.push(
    insert(
      "docs_categories",
      {
        id: `cat-${slug}`,
        slug,
        title_en: title,
        title_si: `[[TRANSLATE]] ${title}`,
        title_ta: `[[TRANSLATE]] ${title}`,
        icon,
        sort_order: i,
        created_at: now,
        updated_at: now,
      },
      "ON CONFLICT (slug) DO NOTHING",
    ),
  );
});

/* ---------- Starter articles: drafts until written from 00-CBPOS_FACTS.md and humanized ---------- */
const ARTICLES = [
  ["getting-started", "install", "Install CB POS", "[A2] [A3] [A4]"],
  ["getting-started", "smartscreen", "Get past Windows SmartScreen", "[A5]"],
  ["getting-started", "first-login", "First login and the default PIN", "[I1]"],
  ["getting-started", "first-sale", "Make your first sale", "[B1]"],
  ["cashiering", "keyboard-shortcuts", "Keyboard shortcuts", "[B1]"],
  ["tax", "vat-registration", "Turn on VAT registration", "[C1]"],
  ["tax", "vat-and-sscl", "How VAT and SSCL are calculated", "[C1] [C2]"],
  ["hardware", "receipt-printer", "Connect a receipt printer", "[E1]"],
  ["hardware", "scale-labels", "Scale-label barcodes", "[E3]"],
  ["backup-restore", "backup-and-restore", "Back up and restore", "[G2] [G3]"],
  ["multiple-tills", "lan-sync-or-network-mode", "Multiple tills: LAN Sync or network mode", "[G4] [H]"],
] as const;

ARTICLES.forEach(([category, slug, title, facts], i) => {
  sql.push(
    insert(
      "docs_articles",
      {
        id: `doc-${slug}-en`,
        translation_key: `doc-${slug}`,
        locale: "en",
        category_id: `cat-${category}`,
        slug,
        title,
        summary: "",
        body_md: `Draft. Write this article from 00-CBPOS_FACTS.md ${facts}, cite those IDs, and run it through the humanizer before publishing.`,
        status: "draft",
        sort_order: i,
        created_at: now,
        updated_at: now,
      },
      "ON CONFLICT (translation_key, locale) DO NOTHING",
    ),
  );
});

if (synthetic) {
  /* ---------- Release fixture ---------- */
  sql.push(
    insert(
      "releases",
      {
        id: "release-0.0.0-dev",
        version: "0.0.0-dev",
        channel: "stable",
        title: "Development build",
        notes_md: "Fixture for local and preview environments.",
        min_os: "Windows 10 or later",
        release_date: "2026-01-01",
        published_at: now,
        exe_name: "CBPOSSetup-0.0.0-dev.exe",
        exe_url:
          "https://github.com/ceybyte/cbpos-releases/releases/download/v0.0.0-dev/CBPOSSetup-0.0.0-dev.exe",
        exe_size: 0,
        exe_sha256: "0".repeat(64),
        is_latest: true,
        is_yanked: false,
        source: "manual",
        created_at: now,
        updated_at: now,
      },
      "ON CONFLICT (version, channel) DO NOTHING",
    ),
  );

  /* ---------- 60 synthetic shops: every district at least once, 10% supporters ---------- */
  const SURNAMES = [
    "Perera",
    "Silva",
    "Fernando",
    "Jayasinghe",
    "Bandara",
    "Wickramasinghe",
    "Kumar",
    "Nadarajah",
    "Sivakumar",
    "Mohamed",
    "Rizvi",
    "Dissanayake",
    "Herath",
    "Gunawardena",
    "Ratnayake",
  ];
  const KINDS = [
    ["grocery", "Stores"],
    ["minimart", "Mini Mart"],
    ["pharmacy", "Pharmacy"],
    ["hardware", "Hardware"],
    ["bookshop", "Book Shop"],
    ["textile", "Textiles"],
    ["electronics", "Mobile Centre"],
    ["bakery", "Bakery"],
    ["agro", "Agro Centre"],
  ] as const;
  const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const publicId = () => `m_${Array.from({ length: 6 }, () => pick([...BASE58])).join("")}`;
  const citiesBy = (d: District) => cityFile.cities.filter((c) => c.district === d);

  sql.push("DELETE FROM merchants WHERE phone LIKE '+9470000%';");
  const districts: District[] = [...DISTRICTS, ...Array.from({ length: 35 }, () => pick(DISTRICTS))];
  districts.forEach((district, i) => {
    const city = pick(citiesBy(district));
    const [category, suffix] = pick(KINDS);
    const supporter = i % 10 === 3;
    const created = now - Math.floor(rand() * 365) * 86_400_000;
    // Within ~1 km of the town centre, kept inside Sri Lanka's bounds.
    const jitter = () => (rand() - 0.5) * 0.02;
    sql.push(
      insert("merchants", {
        id: uuid(),
        public_id: publicId(),
        full_name: `Test Owner ${String(i + 1).padStart(2, "0")}`,
        phone: `+9470000${String(1000 + i)}`,
        shop_name: `${pick(SURNAMES)} ${suffix}`,
        category,
        district,
        city: city.name,
        lat: Math.min(10, Math.max(5.8, +(city.lat + jitter()).toFixed(6))),
        lng: Math.min(82, Math.max(79.5, +(city.lng + jitter()).toFixed(6))),
        location_source: pick(["gps", "pin", "city_centroid"] as const),
        is_public_on_map: i % 12 !== 5,
        status: i % 20 === 7 ? "hidden" : "listed",
        is_supporter: supporter,
        supporter_since: supporter ? created + 30 * 86_400_000 : null,
        terms_version: "2026-10-01",
        terms_accepted_at: created,
        preferred_locale: pick(["en", "si", "ta"] as const),
        created_at: created,
        updated_at: created,
      }),
    );
  });

  /* ---------- Admin user ---------- */
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail && /^[^'"\\;\s@]+@[^'"\\;\s@]+\.[a-z]{2,}$/i.test(adminEmail)) {
    sql.push(
      insert(
        "users",
        {
          id: uuid(),
          name: "",
          email: adminEmail,
          email_verified: true,
          role: "admin",
          banned: false,
          locale: "en",
          created_at: now,
          updated_at: now,
        },
        "ON CONFLICT (email) DO UPDATE SET role = 'admin'",
      ),
    );
  }
}

/* ---------- Run ---------- */
const file = `${process.env.TMPDIR ?? "/tmp"}/cbpos-seed-${now}.sql`;
await Bun.write(file, sql.join("\n") + "\n");
const flags = { local: ["--local"], preview: ["--remote", "--env", "preview"], production: ["--remote"] }[
  target
];
const db = target === "preview" ? "cbpos-db-preview" : "cbpos-db";
const proc = Bun.spawn(["bunx", "wrangler", "d1", "execute", db, ...flags, "--file", file, "--yes"], {
  cwd: "apps/api",
  stdout: "inherit",
  stderr: "inherit",
});
const code = await proc.exited;
await Bun.file(file).delete();
if (code !== 0) process.exit(code);
console.warn(
  `Seeded ${target}: ${sql.length} statements${synthetic ? ", including 60 synthetic shops" : ""}.`,
);
