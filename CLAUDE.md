# CLAUDE.md — Ceybyte.com Repository Constitution

Ceybyte.com is the official web platform for **CB-POS**: free (proprietary freeware), offline-first, keyboard-first Windows Point of Sale software for Sri Lankan retail shops, published by Ceylon Byte. Several tills can share data through **LAN Sync** or a shared **PostgreSQL network mode** that the shop hosts itself. There is no cloud service. This site is where people see the product, download the installer, read the trilingual docs, report bugs, donate, and find shops that use it on the live Sri Lanka Merchant Map.

This file has the rules for every developer and AI agent working in this repo. If a rule here conflicts with what you would usually do, the rule here wins.

---

## 0. Sources of truth (read before building anything)

| Doc | Owns | Read when |
|---|---|---|
| `docs/00-CBPOS_FACTS.md` | **What the CB-POS app actually does**, audited from its source with `path:line` evidence | Before writing or reviewing any sentence about the product |
| `docs/08-UPSTREAM_REQUESTS.md` | App changes the site depends on, with status | Before claiming a feature that isn't shipped yet |
| `docs/01-PRD.md` | What we build and why. Features `F-01`–`F-12`, acceptance criteria | Before starting any feature |
| `docs/02-TRD.md` | Architecture, routes, APIs, caching, security, free-tier budget | Before touching `src/app/api`, `src/server`, `apps/worker`, `deploy/`, Docker |
| `docs/03-DESIGN.md` | Tokens, type scale, script rules, components, motion | Before writing any UI |
| `docs/04-APP_FLOW.md` | User journeys, states, error paths, analytics events | Before building a multi-step flow |
| `docs/05-SCHEMA.md` | Drizzle schema, ERD, public data masking | Before touching the database or any public API |
| `docs/06-SCREEN_BLUEPRINTS_AND_COPY.md` | 14 screens, final copy, Stitch prompts | Before building a screen or writing copy |
| `docs/07-IMPLEMENTATION_PLAN.md` | Phase order, checklists, exit criteria | At the start of each work session |

**Precedence when docs disagree:** `00-CBPOS_FACTS` (for anything about the app) > `05-SCHEMA` > `02-TRD` > `01-PRD` > `03-DESIGN` > `06-SCREENS` > `04-APP_FLOW`. Fix the losing doc in the same PR. Never resolve a conflict silently in code.

**When a requirement is missing:** do not invent it. Add an `## Open Questions` entry to the relevant doc and choose the most conservative behaviour: least data collected, least exposed, least animated.

---

## 1. Non-negotiables

> **Branch `main`: the full architecture on a VPS.** One Linux VPS runs the Next.js app (server-rendered, ISR, Server Actions), PostgreSQL, Valkey, Garage (S3) and a job worker, deployed with Dokploy behind Cloudflare's free proxy. The $0/month static architecture lives on branch `free`. Don't copy runtime code between branches without checking the other branch's `CLAUDE.md`.

1. **Lean and owned.** The monthly bill is the VPS plus nothing else: every external service must be free (Cloudflare proxy/DNS/Turnstile, R2 for off-site backups, PostHog, Resend, GitHub). Adding a paid service needs an ADR in `docs/adr/`.
2. **Never leak merchant contact data.** `phone`, `whatsapp`, `telegram`, `full_name`, IP addresses and claim tokens never appear in any public response, page, cache entry, log line or analytics event. Public queries use the explicit projections in `src/server/db/projections.ts`. Never use `select()` without columns on `merchants`.
3. **Product truth.** Every claim about CB-POS (features, tax maths, hardware, shortcuts, privacy, file names) must match `docs/00-CBPOS_FACTS.md`. Copy tables in `06` cite the fact ID (`[C2]`). Features marked `open` in `08-UPSTREAM_REQUESTS.md` are never advertised. When the facts say UNKNOWN, the site says nothing.
3a. **Never claim IRD approval or certification.** CB-POS *calculates* 18% VAT and 2.5% SSCL. It is not *certified*, *approved* or *endorsed* by the Inland Revenue Department. Every tax claim links to `/{locale}/legal/tax-disclaimer`.
4. **Never fabricate numbers.** Shop counts, district coverage and donation totals come from PostgreSQL at render/revalidate time. If a number isn't live, it isn't shown.
5. **Trilingual by construction.** No user-facing string is hardcoded in a component. Every string lives in `messages/{en,si,ta}.json`. A PR that adds an `en` key without matching `si` and `ta` keys fails CI (it may use the `[[TRANSLATE]]` marker, which blocks production deploys).
6. **Sinhala and Tamil are written by native speakers, never machine-translated into production.** Agents may draft them but must mark them `[[TRANSLATE]]`.
7. **Bun everywhere.** Bun is the package manager, script runner, test runner and the production runtime for the web server and the job worker. Node is a documented fallback for the web container only (ADR-0012). No native Node addons that Bun can't load.
8. **Every public mutating endpoint** passes, in order: Cloudflare Turnstile → rate limit → zod validation → business logic. No exceptions.
9. **Money is integer LKR cents** (`amount_cents: number`). Floats are never used for money. Coordinates are `real`.
10. **Accessibility is not optional.** WCAG 2.2 AA contrast, full keyboard operation (this is a keyboard-first product — the site must be too), visible `#00BCEB` focus rings, `prefers-reduced-motion` respected everywhere.
11. **Backups are part of the product.** Nightly PostgreSQL dumps and Garage bucket syncs go off-site to Cloudflare R2, and a restore is tested monthly. A feature that stores data isn't done until its data is in the backup set.

---

## 2. Stack lock

Major versions are locked. Upgrading a major version or swapping a component needs an ADR.

| Layer | Component | Notes |
|---|---|---|
| Runtime & tooling | **Bun 1.x** (package manager, scripts, `bun test`, runtime for web + worker) | `bun.lock` only. Node 22 LTS is the web-container fallback (ADR-0012) |
| Web app | `next@15` (App Router, TypeScript strict), `output: "standalone"` | SSR, ISR (`revalidateTag`), Server Actions, middleware. Run with `bun server.js` |
| Jobs | `pg-boss@10` in a separate Bun process (`apps/worker`) | Release sync, geo snapshot, emails, cleanup, OG images, search index |
| Database | **PostgreSQL 17** + `drizzle-orm` (`drizzle-orm/postgres-js`, `postgres` driver) + `drizzle-kit` | Schema in `05-SCHEMA.md` (pg-core) |
| Cache & limits | **Valkey 8** + `iovalkey` | Rate limits, geo/stats cache, Better Auth secondary storage |
| Object storage | **Garage** (S3-compatible, AGPL-3.0, single binary) + `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` | Buckets: `uploads` (private), `public` (website mode via `cdn.ceybyte.com`: tiles, media, OG) |
| Off-site backups | Cloudflare R2 (free 10 GB) via `rclone` + `pg_dump` | Nightly, 30-day retention (`02-TRD.md §14`) |
| Reactive alt. | `convex` (not installed) | `05-SCHEMA.md §8`, ADR only |
| Auth | `better-auth` (Drizzle pg adapter, `admin` + `emailOTP` plugins, email + password, Google) | Roles: `merchant`, `admin` |
| Deploy | **Dokploy** (Docker Compose, Traefik) on Ubuntu 24.04 LTS | Images built in GitHub Actions → GHCR → Dokploy webhook |
| Edge | Cloudflare free: DNS, proxy/CDN, WAF managed rules, Turnstile, Origin CA cert (Full strict TLS) | Static and tile caching at the edge |
| Map tiles | Protomaps `sri-lanka.pmtiles` in Garage `public` bucket, `pmtiles` + `@protomaps/basemaps` | No CARTO (commercial licence, ADR-0008) |
| Installer CDN | GitHub Releases on `ceybyte/cbpos-releases` | Manifest read server-side only (`02-TRD.md §7`) |
| Styling | `tailwindcss@4`, `shadcn/ui`, Radix UI, `vaul`, `lucide-react`, `sonner`, `next-themes` | Tokens in `src/app/globals.css` |
| Motion | `motion` (`motion/react`), `gsap` + `ScrollTrigger`, `lenis`, `@rive-app/react-canvas`, `@lucasmarkes/hairline@0.5` | `03-DESIGN.md §9`. Hairline verified (ADR-0007) |
| Maps | `maplibre-gl` (native clustering) | Latin labels (`03-DESIGN.md §8.9`) |
| Docs | `fumadocs-ui`, `fumadocs-core`, unified/remark/rehype, `@orama/orama` | Markdown in PostgreSQL, rendered at publish by a job (`02-TRD.md §8`) |
| i18n | `next-intl` (middleware, prefix always) | `en`, `si`, `ta` |
| Forms | `react-hook-form`, `zod`, `@hookform/resolvers` | Shared zod schemas |
| Bot defense | Cloudflare Turnstile | Every public form |
| Analytics | `posthog-js`, `posthog-node` (EU Cloud free tier) | Self-hosting PostHog needs ~16 GB RAM, so it stays on cloud (ADR-0013). Proxied via `/ingest` |
| Email | Resend (free tier) | Auth emails and admin notifications |
| Monitoring | Dokploy metrics, Uptime Kuma (container), `pino` JSON logs with Docker log rotation | GlitchTip (Sentry-compatible) added when traffic warrants (ADR) |
| Testing | `bun test` (unit + integration against a disposable Postgres/Valkey/Garage compose stack), `@playwright/test`, `@axe-core/playwright` | Playwright via `bunx` |

**Banned:** Prisma; `next-auth`; styled-components/emotion; `moment`; full `lodash`; jQuery; CSS-in-JS runtimes; Google Maps; Mapbox GL; CARTO basemaps; MinIO (community edition archived, unpatched); the `framer-motion` package name (use `motion`); fetching `latest.json` from the browser; `npm`/`pnpm`/`yarn` lockfiles; running any service as root inside containers; exposing PostgreSQL, Valkey or Garage admin ports to the internet.

---

## 3. Commands

These `package.json` scripts are created in Phase 0 (`07-IMPLEMENTATION_PLAN.md`). Don't rename them.

```bash
bun install                      # deps
bun run services:up              # docker compose -f compose.dev.yml up -d (postgres, valkey, garage)
bun run dev                      # bun --bun next dev  +  bun --watch apps/worker/src/index.ts
bun run build                    # bun --bun next build (standalone)
bun run start                    # bun .next/standalone/server.js
bun run worker                   # bun apps/worker/src/index.ts

bun run db:generate              # drizzle-kit generate → drizzle/*.sql
bun run db:migrate               # drizzle-kit migrate (local; production runs it as the pre-deploy step)
bun run db:seed                  # bun scripts/seed.ts
bun run db:studio                # drizzle-kit studio

bun run lint                     # eslint + prettier --check
bun run typecheck                # tsc --noEmit
bun run test                     # bun test (needs services:up for integration tests)
bun run e2e                      # bunx playwright test against a production build
bun run i18n:check               # key parity + [[TRANSLATE]] scan
bun run tiles:build              # pmtiles extract → sri-lanka.pmtiles → Garage public bucket
bun run docker:build             # docker build -f Dockerfile.web / Dockerfile.worker
bun run backup:test              # restore last night's dump into a scratch DB and run checks
```

**Before declaring a task done:** `bun run lint && bun run typecheck && bun run test && bun run i18n:check`. For changes to Docker, Compose, env or middleware, also run `bun run docker:build` and the affected E2E flow against the built image.

---

## 4. Repository layout

```
.
├── CLAUDE.md
├── docs/                          # 00–08 planning suite + adr/
├── messages/{en,si,ta}.json       # all UI strings
├── drizzle/                       # generated SQL migrations (never hand-edit applied ones)
├── public/{data,rive,og}/         # lk-districts.json, lk-cities.json, Rive files, OG fallbacks
├── apps/worker/                   # pg-boss job runner (Bun): release-sync, geo, email, cleanup, render
├── scripts/                       # seed, i18n-check, tiles, make-admin, backup-test
├── e2e/                           # Playwright specs
├── deploy/                        # compose.prod.yml, garage.toml, traefik labels, backup scripts
├── compose.dev.yml                # postgres, valkey, garage for local dev and tests
├── Dockerfile.web / Dockerfile.worker
├── src/
│   ├── middleware.ts              # next-intl routing + admin/dashboard cookie guards
│   ├── i18n/{routing,request,navigation}.ts
│   ├── app/
│   │   ├── globals.css
│   │   ├── [locale]/              # public + merchant routes
│   │   ├── admin/                 # admin console (English only)
│   │   └── api/                   # route handlers (02-TRD §5)
│   ├── components/{ui,brand,marketing,map,docs,forms,motion}/
│   ├── features/                  # vertical slices (schemas, actions, components)
│   ├── server/                    # server-only: db, auth, s3, valkey, turnstile, ratelimit,
│   │                              # geo-cache, github, markdown, jobs (enqueue), log
│   └── lib/                       # isomorphic: enums, env, money, phone, tax, sri-lanka, analytics
├── drizzle.config.ts
└── next.config.ts
```

Rules:
- Anything under `src/server/` starts with `import "server-only";`.
- `apps/worker` imports from `src/server` and `src/lib` (path alias `@/`); it never imports React.
- A feature's zod schemas live in `src/features/<feature>/schema.ts` and are shared by the form and the server.

---

## 5. Coding rules

### 5.1 TypeScript
- `strict: true`, `noUncheckedIndexedAccess: true`. No `any`; use `unknown` and narrow.
- Prefer `type` over `interface`. Discriminated unions for states.
- Filenames kebab-case; component exports PascalCase.

### 5.2 Server runtime (Bun on the VPS)
- One Drizzle client and one Valkey client per process (module scope is fine here, unlike Workers). Pool size: web 10, worker 5 (`max` in `postgres()`).
- Anything slower than ~100 ms or retried (email, GitHub calls, rendering, image work, geo snapshot rebuilds) runs as a pg-boss job, never inline in a request.
- Secrets come from environment variables injected by Dokploy, validated by `src/lib/env.ts` (zod) at boot. The process exits if any are missing.
- Containers run as a non-root user with a read-only root filesystem; writable paths are explicit volumes (`.next/cache`).

### 5.3 Data & APIs
- zod validation at every boundary. Route handlers return `{ ok: true, data } | { ok: false, error: { code, requestId, fields? } }`.
- Error `code`s are SCREAMING_SNAKE (`02-TRD.md §5.3`); user text comes from `messages/*.json`.
- Multi-statement writes use `db.transaction(async (tx) => …)`. Credit, supporter and numbering operations use `SERIALIZABLE` with one retry.
- IDs (`crypto.randomUUID()`) and timestamps are generated in the app; the schema stays SQLite-portable for the `free` branch.
- Phone numbers are normalised to E.164 by `src/lib/phone.ts`.

### 5.4 React / Next
- Server Components by default; `"use client"` only for interactivity, motion, maps, Rive and forms.
- Heavy client libraries (`maplibre-gl`, Rive, GSAP, Lenis) load through `next/dynamic` with `ssr: false` behind an IntersectionObserver or interaction. Never in the initial JS of `/`.
- Mutations: Server Actions for dashboard and admin; route handlers for public Turnstile-protected forms and webhooks.
- Public pages are static or ISR (`02-TRD.md §6`); only dashboard and admin render per request.
- Links use the locale-aware `Link` from `src/i18n/navigation.ts`.

### 5.5 Tests
- `bun test` unit: money, phone, tax maths (round-half-even, [C1]/[C2] examples), sri-lanka, projections, manifest zod.
- **Required test:** `geo.contract.test.ts` asserts the `/api/merchants/geo` properties equal the public whitelist in `05-SCHEMA.md §7`.
- `bun test` integration against `compose.dev.yml` services: every route handler and Server Action, jobs, webhook idempotency, rate limits.
- Playwright: the 6 flows in `04-APP_FLOW.md` × 3 locales against the built Docker image, axe on every screen.

---

## 6. Design rules (summary — full spec in `docs/03-DESIGN.md`)

- **60-30-10:** 60% canvas `--canvas` (`#1E1E1E` dark / `#F8F9FA` light), 30% neutral structure (surfaces, hairlines, text), 10% accent. Accents are rationed: one `#39FF14` primary CTA per viewport, cyan for focus, links and glow, gold only for supporters.
- **Use tokens only.** No raw hex in components and no arbitrary Tailwind colour values (`bg-[#123456]`). The lint rule `no-raw-color` enforces this.
- **Primary CTA** = `#39FF14` fill + `#121212` bold text. It is never used as text colour in light mode.
- **Hairlines, not shadows.** 1px `--hairline` borders and the architectural grid with `+` crosshairs. No drop shadows, except the cyan rim glow on product mockups and the focus ring.
- **Monospace** (`JetBrains Mono`) for prices, tax math, versions, SHA-256 hashes and `<kbd>`.
- **Sinhala/Tamil:** +15% line-height, one weight step lighter, `letter-spacing: 0`, no Geist (it has no Indic glyphs). This is enforced via `:lang(si)`/`:lang(ta)` selectors, not per component.
- **Mockups:** real CB-POS UI captures only, borderless, no fake browser chrome, on a `#18181B` backdrop with a cyan rim glow.

---

## 7. Design skills (mandatory gates)

Every design decision goes through these skills: layout, type, colour, spacing, component shape, motion and UI copy. They are how this repo avoids AI slop. All three were verified on GitHub on 2026-10-21.

### 7.1 Install (once per machine, project scope)

```bash
bunx skills add emilkowalski/skills     # MIT. emil-design-eng, animate, improve-animations, review-animations, animation-performance, find-animation-opportunities, pick-ui-library, ask-sonner, break-ui, …
bunx skills add Nutlope/hallmark        # MIT. hallmark (default build + audit / redesign / study)
bunx skills add pbakaus/impeccable      # Apache-2.0. impeccable (shape, craft, audit, critique, polish, animate, …)
```

Skills install into `.claude/skills/`. Commit the lockfile the installer writes, so every contributor and agent runs the same versions. Review a skill's diff before accepting an update.

### 7.2 When each skill runs

| Moment | Skill + invocation | Gate (must hold before merge) |
|---|---|---|
| Starting a new page or section | `hallmark` (default build), then `impeccable shape` for the screen's visual plan | Hallmark pre-emit critique scores **≥ 3 on all six axes** (Philosophy, Hierarchy, Execution, Specificity, Restraint, Variety). Paste the score line in the PR |
| Building or changing a component | `emil-design-eng` (component craft), `impeccable craft` | The component exists in `/_styleguide` with every state |
| Adding or changing motion | `emil-design-eng` answers its four questions (is it necessary, what does it communicate, which easing, how fast) → `animate` → `animation-performance` | `review-animations` verdict is **approve**, pasted in the PR |
| Before opening a PR touching UI | `hallmark audit <route>` and `impeccable audit` + `impeccable critique` | Zero hallmark slop-test gate failures. Every impeccable finding is fixed or logged as an accepted exception |
| Final pass before launch of a screen | `impeccable polish` | Screenshot review in `en`, `si`, `ta`, light and dark, at 320 / 375 / 414 / 768 / 1280 px |

### 7.3 When a skill disagrees with this repo

The brief and these docs set the brand. Skills set the craft. If a skill flags something the brand requires, keep the brand and record the exception in `docs/adr/` with the skill's finding quoted. Known exceptions:
- **Inter for body text.** impeccable treats Inter as a generic default. It stays, because the brand specifies it and it pairs with Noto Sans Sinhala/Tamil metrics (ADR-0010).
- **Fixed 8-section homepage order.** Hallmark pushes structural variety. The section *order* is fixed by PRD F-02, but each section's internal layout must follow hallmark's variety rules (no repeated card-grid rhythm between sections).

If a skill isn't installed in your environment, stop and install it. Don't skip the gate, and don't claim you ran a skill you didn't run.

---

## 8. Anti-slop checklists

A PR fails review if any box can't be honestly ticked.

### 8.1 Copy
- [ ] No filler words: *seamless, revolutionize, unlock, elevate, empower, cutting-edge, robust, leverage, game-changer, in today's fast-paced world, effortless*.
- [ ] Every headline states a concrete outcome or number ("Bill in 0 ms network lag", not "Next-gen retail experience").
- [ ] No exclamation marks in UI copy. No emoji in UI copy.
- [ ] Prices are written `Rs. 1,250.00` (space after `Rs.`, comma thousands, 2 dp) in `font-mono`.
- [ ] Product claims cite a fact ID from `00-CBPOS_FACTS.md` and match it exactly. Banned claims (each one is false or unshipped today): "100% offline" (the app checks GitHub for updates on every launch, [A7]); "Cloud Sync" or any cloud service ([H]); "IRD compliant" / "2026 mandate" ([C5]); email receipts ([A8]); expiry, batch or serial tracking ([D4]); live scale connection ([E3]); customer display ([E4]); SMS/WhatsApp receipts ([F3]); per-bill receipt language or Sinhala/Tamil item names on thermal receipts ([F2]); portable .ZIP build ([A3]); "64-bit installer" ([A2]).
- [ ] Data claims: "Your sales are saved on your own PC" is true in standalone mode. When describing LAN Sync or network mode, say the data stays on the shop's own computers and server.
- [ ] Tax claims say *calculates*, never *certified/approved/compliant-guaranteed*, and link the disclaimer.
- [ ] Each string exists in `en`, `si` and `ta` (or carries `[[TRANSLATE]]`).
- [ ] Button labels are verbs: "Download CB-POS", "Send ticket", "Upload slip". Never "Submit" or "Click here".

### 8.2 Visual
- [ ] Only tokens; no raw hex; no arbitrary colour values.
- [ ] At most one `#39FF14` element per viewport.
- [ ] No gradients except the defined `--glow-cyan` radial. No glassmorphism, no purple, no generic blob backgrounds.
- [ ] No stock photos, no illustrated people, no fake browser chrome, no lorem ipsum.
- [ ] Icons are Lucide at `1.5` stroke, sized 16/20/24 only. No mixed icon sets.
- [ ] Border radius comes only from the scale (`0`, `4px`, `6px`, `9999px` for pills and dots).
- [ ] Layout holds at 320, 375, 414 and 768 px with 16px gutters: no horizontal scroll (`overflow-x: clip` on `html` and `body`), no two-line buttons or nav links, image grid tracks use `minmax(0, 1fr)`, long headings wrap with `overflow-wrap: anywhere; min-width: 0` (hallmark gates 34, 49–53).
- [ ] No italic headings or italic emphasis words inside headings (hallmark gate 38a).
- [ ] Product imagery is real CB-POS screenshots ([L1]: none exist yet, UR-20) or Hairline figures. Never a mocked-up POS screen invented by an agent.
- [ ] Sinhala and Tamil versions screenshotted and checked for diacritic clipping.
- [ ] Contrast was checked in both light and dark themes.

### 8.3 Motion
- [ ] Every animation answers "what does this tell the user?". Decorative loops are capped at one per viewport.
- [ ] Only `transform` and `opacity` are animated (plus `clip-path` for reveals).
- [ ] UI feedback runs ≤ 240 ms. Section reveals ≤ 600 ms. Nothing blocks input.
- [ ] `prefers-reduced-motion: reduce` disables Lenis, parallax, Rive autoplay and spring overshoot, and replaces them with instant or opacity-only changes.
- [ ] No scroll-jacking. Lenis smooths scrolling but never hijacks or snaps it.

### 8.4 Code
- [ ] No unused exports, no commented-out code, no `console.log`.
- [ ] No new dependency without a stack-lock check (§2).
- [ ] Public endpoints: Turnstile → rate limit → zod → logic.
- [ ] No merchant contact fields in any public projection (the contract test passes).
- [ ] Heavy client libs are dynamically imported.
- [ ] New stored data is covered by the backup set (`02-TRD.md §14`).

---

## 9. Privacy & legal guardrails

- **Sri Lanka PDPA (Personal Data Protection Act No. 9 of 2022):** collect only what a feature needs, state the purpose at collection, honour deletion requests (`/dashboard/settings` → delete listing; admin hard-delete within 30 days).
- **The site never touches shop data.** LAN Sync and PostgreSQL network mode run between the shop's own computers ([G4], [H]). The site never hosts, proxies or stores shop databases, connection strings, sync secrets or sales data. Never add a form field, ticket field or upload purpose that collects a database URL, password or LAN Sync secret. The ticket form warns users to remove these from logs before uploading ([H9]).
- IP addresses are stored only as `sha256(ip + daily_salt)`. Raw IPs are never persisted.
- PostHog runs with `maskAllInputs: true` and `mask_all_text: false`. Elements with `data-ph-no-capture` (contact fields, slips, dashboards) are never recorded. Merchant contact data is never sent as event properties.
- Bank slips and crash logs live in the private Garage `uploads` bucket. They're served only through short-lived presigned GET URLs to admins.
- Required disclaimers (copy in `06-SCREEN_BLUEPRINTS_AND_COPY.md`): **as-is software / no warranty**, **tax calculation is the merchant's responsibility, not IRD-certified**, **backups are the merchant's responsibility** (the local database isn't encrypted at rest, and backups need a password, [G1], [G2]), plus the **EULA** for the app itself (none exists in the app yet, UR-06).

---

## 10. Git conventions

- Conventional Commits, terse: `<type>(<scope>): <imperative summary>`. Scopes: `prd, trd, design, flow, schema, screens, plan, app, api, db, auth, map, docs, gate, donate, feedback, blog, admin, i18n, ui, motion, worker, ci`.
- One logical change per commit. Commit after each completed checklist item.
- Branches: `feat/<scope>-<slug>`, `fix/<scope>-<slug>`. `main` is always deployable.
- Never commit `.env*`, `.next/`, database dumps or real merchant data.
- Migrations: generated by `bun run db:generate`, committed with the schema change, applied in production only by the pre-deploy migration step.

---

## 11. Definition of done

A task is done when all of these are true:
1. It meets the acceptance criteria in `01-PRD.md` for the feature.
2. It matches the screen blueprint and copy in `06-…`, using tokens from `03-DESIGN.md`.
3. It handles every state from `04-APP_FLOW.md`: loading, empty, error, success, offline where relevant.
4. `bun run lint && bun run typecheck && bun run test && bun run i18n:check` all pass.
5. The E2E spec for the flow passes in `en`, `si` and `ta`, with zero axe violations.
6. The checklists in §8 are ticked in the PR description.
7. The matching box in `docs/07-IMPLEMENTATION_PLAN.md` is checked in the same PR.
