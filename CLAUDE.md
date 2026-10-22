# CLAUDE.md — Ceybyte.com Repository Constitution

Ceybyte.com is the official web platform for **CB POS**: free (proprietary freeware), offline-first, keyboard-first Windows Point of Sale software for Sri Lankan retail shops, published by Ceylon Byte. Several tills can share data through **LAN Sync** or a shared **PostgreSQL network mode** that the shop hosts itself. There is no cloud service. This site is where people see the product, download the installer, read the trilingual docs, report bugs, donate, and find shops that use it on the live Sri Lanka Merchant Map.

This file has the rules for every developer and AI agent working in this repo. If a rule here conflicts with what you would usually do, the rule here wins.

---

## 0. Sources of truth (read before building anything)

| Doc | Owns | Read when |
|---|---|---|
| `docs/00-CBPOS_FACTS.md` (**local only, gitignored**) | **What the CB POS app actually does**, audited from its source with `path:line` evidence. It isn't committed because this repo is public and the audit cites the private app repo and unfixed weaknesses. Get it from a maintainer, or regenerate it by running the audit prompt against the app repo, and save it at this path | Before writing or reviewing any sentence about the product |
| `docs/08-UPSTREAM_REQUESTS.md` | App changes the site depends on, with status | Before claiming a feature that isn't shipped yet |
| `docs/01-PRD.md` | What we build and why. Features `F-01`–`F-12`, acceptance criteria | Before starting any feature |
| `docs/02-TRD.md` | Architecture, routes, APIs, caching, security, free-tier budget | Before touching `apps/api`, `wrangler.jsonc`, the build pipeline |
| `docs/03-DESIGN.md` | Tokens, type scale, script rules, components, motion | Before writing any UI |
| `docs/04-APP_FLOW.md` | User journeys, states, error paths, analytics events | Before building a multi-step flow |
| `docs/05-SCHEMA.md` | Drizzle schema, ERD, public data masking | Before touching the database or any public API |
| `docs/06-SCREEN_BLUEPRINTS_AND_COPY.md` | 14 screens, final copy, Stitch prompts | Before building a screen or writing copy |
| `docs/07-IMPLEMENTATION_PLAN.md` | Phase order, checklists, exit criteria | At the start of each work session |

**Precedence when docs disagree:** `00-CBPOS_FACTS` (for anything about the app) > `05-SCHEMA` > `02-TRD` > `01-PRD` > `03-DESIGN` > `06-SCREENS` > `04-APP_FLOW`. Fix the losing doc in the same PR. Never resolve a conflict silently in code.

**When a requirement is missing:** do not invent it. Add an `## Open Questions` entry to the relevant doc and choose the most conservative behaviour: least data collected, least exposed, least animated.

---

## 1. Non-negotiables

> **Branch `free`: the $0/month architecture.** Every public page is static HTML served from Cloudflare Workers Static Assets (free and unlimited). Only `/api/*` runs code, in one Hono Worker. The full-featured server architecture lives on `main` (VPS). Don't copy runtime code between branches without checking the other branch's `CLAUDE.md`.

1. **$0/month.** Every service must fit its free tier (budget in `02-TRD.md §14`). Anything that bills needs an ADR in `docs/adr/`.
2. **Never leak merchant contact data.** `phone`, `whatsapp`, `telegram`, `full_name`, IP addresses and claim tokens never appear in any public response, page, cache entry, log line or analytics event. Public queries use the explicit projections in `packages/shared/src/db/projections.ts`. Never use `select()` without columns on `merchants`.
3. **Product truth.** Every claim about CB POS (features, tax maths, hardware, shortcuts, privacy, file names) must match `docs/00-CBPOS_FACTS.md`. Copy tables in `06` cite the fact ID (`[C2]`). Features marked `open` in `08-UPSTREAM_REQUESTS.md` are never advertised. When the facts say UNKNOWN, the site says nothing.
3a. **Never claim IRD approval or certification.** CB POS *calculates* 18% VAT and 2.5% SSCL. It is not *certified*, *approved* or *endorsed* by the Inland Revenue Department. Every tax claim links to `/{locale}/legal/tax-disclaimer`.
4. **Never fabricate numbers.** Shop counts, district coverage and donation totals are fetched live from the API at runtime. If the API can't answer, the number is hidden, never guessed.
5. **Trilingual by construction.** No user-facing string is hardcoded in a component. Every string lives in `messages/{en,si,ta}.json`. A PR that adds an `en` key without matching `si` and `ta` keys fails CI (it may use the `[[TRANSLATE]]` marker, which blocks production deploys).
6. **Sinhala and Tamil are written by native speakers, never machine-translated into production.** Agents may draft them but must mark them `[[TRANSLATE]]`.
7. **Static pages, thin API.** Pages are built with `next build` in `output: "export"` mode: no SSR, no ISR, no middleware, no Server Actions, no route handlers in `src/app`. Anything dynamic is either fetched from `/api/*` in the browser or baked in at build time. The API Worker runs in `workerd` with `nodejs_compat`: no `fs`, no `eval`/`new Function`, no long-running work on the request path.
8. **Every public mutating endpoint** passes, in order: Cloudflare Turnstile → rate limit → zod validation → business logic. No exceptions.
9. **Money is integer LKR cents** (`amount_cents: number`). Floats are never used for money. Coordinates are `real`.
10. **Accessibility is not optional.** WCAG 2.2 AA contrast, full keyboard operation (this is a keyboard-first product — the site must be too), visible `#00BCEB` focus rings, `prefers-reduced-motion` respected everywhere.

---

## 2. Stack lock

Major versions are locked. Upgrading a major version or swapping a library needs an ADR.

| Layer | Package(s) | Notes |
|---|---|---|
| Runtime & tooling | **Bun 1.x** (pinned in `packageManager`, hoisted linker via `bunfig.toml`): package manager (`bun.lock`), script runner, unit test runner (`bun test`), and the runtime for `next dev`/`next build` (`bun --bun`) | Production API code runs in Cloudflare's `workerd`, not Bun. That's the only place Bun can't be used |
| Web app | `next@15` (App Router, TypeScript strict) with `output: "export"`, `trailingSlash: true`, `images.unoptimized: true` | `apps/web`. Static HTML for every public route × 3 locales |
| API | `hono@4` on Cloudflare Workers, typed client via `hono/client` | `apps/api`. Same Worker serves the static assets, the API, a few rewrites and the cron jobs |
| Hosting | Cloudflare Workers Static Assets + `wrangler@4` | Asset requests are free and unlimited. Only `run_worker_first` paths invoke the Worker |
| Database | Cloudflare D1 + `drizzle-orm` (`drizzle-orm/d1`) + `drizzle-kit` | Schema in `packages/shared`. Postgres-portable (`05-SCHEMA.md §6`) |
| Reactive alt. | `convex` (not installed) | Mirror schema in `05-SCHEMA.md §8`, only via ADR |
| Auth | `better-auth` (Drizzle adapter, `admin` + `emailOTP` plugins), `better-auth-cloudflare` | Mounted at `/api/auth/*` in Hono. Roles: `merchant`, `admin` |
| Storage | Cloudflare R2: `cbpos-uploads` (private) + `cbpos-public` (public via custom domain) + `aws4fetch` presigning | Slips, crash logs, media, OG images, map tiles |
| Map tiles | Protomaps: `sri-lanka.pmtiles` on `cbpos-public` (`tiles.ceybyte.com`), `pmtiles` protocol + `@protomaps/basemaps` | Range requests served and cached by Cloudflare. No CARTO (commercial licence, ADR-0008) |
| Installer CDN | GitHub Releases on `ceybyte/cbpos-releases` | Manifest read server-side only (`02-TRD.md §7`) |
| Cache/KV | Workers KV (`CACHE_KV`) + Cache API | Geo snapshot, stats, release cache |
| Builds | GitHub Actions (`repository_dispatch` from admin publish) | Content changes rebuild and redeploy the static site |
| Styling | `tailwindcss@4` (CSS-first `@theme`), `shadcn/ui`, Radix UI, `vaul`, `lucide-react`, `sonner`, `next-themes` | Tokens in `apps/web/src/app/globals.css` |
| Motion | `motion` (`motion/react`), `gsap` + `ScrollTrigger`, `lenis`, `@rive-app/react-canvas`, `@lucasmarkes/hairline@0.5` | `03-DESIGN.md §9`. Hairline verified (ADR-0007) |
| Maps | `maplibre-gl` (native GeoJSON clustering) | Bounded to Sri Lanka. Latin labels (`03-DESIGN.md §8.9`) |
| Docs | `fumadocs-ui`, `fumadocs-core`, unified/remark/rehype, `@orama/orama` | Markdown from D1 rendered **at build time**; search index shipped as static JSON |
| Data fetching | `@tanstack/react-query` | Client-side calls to `/api/*` |
| i18n | `next-intl` (static rendering: `setRequestLocale` + `generateStaticParams`) | Locales `en`, `si`, `ta`, prefix always |
| Forms | `react-hook-form`, `zod`, `@hookform/resolvers` | zod schemas shared from `packages/shared` |
| Bot defense | Cloudflare Turnstile | Every public form |
| Analytics | `posthog-js` (EU Cloud, free tier) | Proxied through `/ingest/*` on the Worker |
| Email | Resend (free tier) | Auth emails only |
| Testing | `bun test` (pure logic), `vitest` + `@cloudflare/vitest-plugin` (API with real bindings), `@playwright/test`, `@axe-core/playwright` | Run with `bunx` |

**Banned:** OpenNext and any SSR runtime on Workers (the 10 ms CPU limit per request makes SSR fragile on the free plan, ADR-0001); Prisma; `next-auth`; styled-components/emotion; `moment`; full `lodash`; jQuery; CSS-in-JS runtimes; Google Maps; Mapbox GL; CARTO basemaps; the `framer-motion` package name (use `motion`); fetching `latest.json` from the browser; `npm`/`pnpm`/`yarn` lockfiles.

---

## 3. Commands

These `package.json` scripts are created in Phase 0 (`07-IMPLEMENTATION_PLAN.md`). Don't rename them.

```bash
bun install                       # workspaces: apps/web, apps/api, packages/shared
bun run dev                       # web (bun --bun next dev :3000) + api (wrangler dev :8787), /api proxied
bun run build                     # build:content → next build (static export to apps/web/out)
bun run build:content             # pull published docs/blog/releases from D1 → apps/web/.content/*.json
bun run preview                   # wrangler dev serving apps/web/out + the API Worker (production-like)
bun run deploy                    # wrangler deploy (assets + Worker) — CI only
bun run cf-typegen                # wrangler types → apps/api/worker-configuration.d.ts

bun run db:generate               # drizzle-kit generate → apps/api/drizzle/*.sql
bun run db:migrate:local          # wrangler d1 migrations apply cbpos-db --local
bun run db:migrate:remote         # wrangler d1 migrations apply cbpos-db --remote   (CI only)
bun run db:seed:local             # bun scripts/seed.ts → local D1
bun run db:studio                 # drizzle-kit studio

bun run lint                      # eslint + prettier --check
bun run typecheck                 # tsc --noEmit in every workspace
bun run test                      # bun test (packages/shared, apps/web/src/lib) + bunx vitest run (apps/api)
bun run e2e                       # playwright test against bun run preview (macOS 13: PW_CHANNEL=chrome)
bun run i18n:check                # key parity + [[TRANSLATE]] scan
bun run tiles:build               # pmtiles extract → sri-lanka.pmtiles (quarterly)
```

**Before declaring a task done:** `bun run lint && bun run typecheck && bun run test && bun run i18n:check`. For changes to the Worker, routing or build, also run `bun run preview` and the affected E2E flow.

---

## 4. Repository layout

```
.
├── CLAUDE.md
├── docs/                              # 00–08 planning suite + adr/
├── messages/{en,si,ta}.json           # all UI strings (shared by web and API error messages)
├── packages/shared/                   # isomorphic: enums, zod schemas, db schema, money, phone, tax, sri-lanka
│   └── src/db/{schema,relations,projections}.ts
├── apps/api/                          # Hono Worker (wrangler.jsonc lives here)
│   ├── src/index.ts                   # fetch: routes + asset rewrites; scheduled: cron jobs
│   ├── src/routes/                    # auth, downloads, merchants, releases, uploads, feedback,
│   │                                  # donations, admin/*, webhooks, internal
│   ├── src/lib/                       # db, auth, r2, turnstile, ratelimit, geo-cache, github,
│   │                                  # markdown (publish-time render), rebuild (repository_dispatch)
│   ├── src/jobs/                      # release-sync, cleanup, geo-rebuild
│   └── drizzle/                       # generated migrations
├── apps/web/                          # Next.js static export
│   ├── src/app/[locale]/…             # every public, dashboard and admin page (static shells)
│   ├── src/components/{ui,brand,marketing,map,docs,forms,motion}/
│   ├── src/features/                  # client slices: download-gate, merchants, docs, feedback, …
│   ├── src/lib/api.ts                 # typed hono/client + react-query hooks
│   ├── .content/                      # build-time content snapshot (gitignored)
│   └── public/{data,rive,og,search}/  # lk-districts.json, lk-cities.json, search/{locale}.json
├── scripts/                           # seed, i18n-check, build-content, tiles
└── e2e/                               # Playwright specs
```

Rules:
- `packages/shared` has no runtime-specific imports. Both apps import from it.
- `apps/web` never imports from `apps/api` except the exported `AppType` for `hono/client`.
- A feature's zod schemas live in `packages/shared/src/schemas/<feature>.ts`.

---

## 5. Coding rules

### 5.1 TypeScript
- `strict: true`, `noUncheckedIndexedAccess: true`. No `any`. Use `unknown` and narrow it.
- Prefer `type` over `interface` unless declaration merging is needed.
- Use discriminated unions for states (`{ status: "idle" } | { status: "submitting" } | …`).
- Filenames are kebab-case. Component exports are PascalCase.

### 5.2 API Worker (`workerd`)
- Bindings come from Hono's `c.env`. **Create the Drizzle client and the Better Auth instance per request** (`c.get("db")` set by middleware), never in module scope.
- CPU budget: 10 ms per request on the free plan. No markdown rendering, image work or hashing of large payloads on the request path. Heavy work runs at publish time (admin actions are rare) or in `scheduled()`.
- Use `c.executionCtx.waitUntil()` for logging, analytics and cache writes. Never `await` analytics on the request path.
- `run_worker_first` lists exactly which paths invoke the Worker (`02-TRD.md §3`). Adding a pattern there costs request quota. Justify it in the PR.

### 5.3 Data & APIs
- All input is validated with zod at the boundary (`@hono/zod-validator`). Responses are `{ ok: true, data } | { ok: false, error: { code, requestId, fields? } }` with correct HTTP status codes.
- Error `code`s are SCREAMING_SNAKE and documented in `02-TRD.md §5.3`. User-facing text comes from `messages/*.json` keyed by code.
- Use `db.batch([...])` for multi-statement writes (D1 has no interactive transactions).
- Generate IDs (`crypto.randomUUID()`) and timestamps (`new Date()`) in the app, never in SQL.
- Phone numbers are normalised to E.164 by `packages/shared/src/phone.ts` before storage.

### 5.4 React / Next (static export)
- Every page component is a Server Component rendered **at build time**. Interactivity is `"use client"` islands.
- Build-time data comes from `apps/web/.content/*.json` (written by `build:content`). Runtime data comes from `/api/*` through `src/lib/api.ts` hooks, always with a loading skeleton and an error state.
- Dynamic route params must be listed in `generateStaticParams`. Pages whose IDs are created after the build (ticket details) use one static shell that the Worker rewrites to (`02-TRD.md §3`).
- Auth-gated pages (`/dashboard`, `/admin`) are static shells. The client checks the session through `/api/auth/get-session` and renders nothing private until it confirms. The API enforces every rule; the client check is only UX.
- Heavy client libraries (`maplibre-gl`, Rive, GSAP, Lenis) load through `next/dynamic` with `ssr: false` behind an IntersectionObserver or interaction. Never in the initial JS of `/`.
- Links use the locale-aware `Link` from `src/i18n/navigation.ts`.

### 5.5 Tests
- `bun test`: money, phone, tax display maths (round-half-even, `00-CBPOS_FACTS` [C1]/[C2] examples), district lookup, masking projections, manifest zod.
- **Required test:** `geo.contract.test.ts` asserts the `/api/merchants/geo` feature properties equal the public whitelist in `05-SCHEMA.md §7`.
- `vitest` with `@cloudflare/vitest-plugin`: every API route against local D1/R2/KV, webhook idempotency, rate limits.
- Playwright: the 6 flows in `04-APP_FLOW.md` in all three locales, with axe checks on every screen.

---

## 6. Design rules (summary — full spec in `docs/03-DESIGN.md`)

- **60-30-10:** 60% canvas `--canvas` (`#1E1E1E` dark / `#F8F9FA` light), 30% neutral structure (surfaces, hairlines, text), 10% accent. Accents are rationed: one `#39FF14` primary CTA per viewport, cyan for focus, links and glow, gold only for supporters.
- **Use tokens only.** No raw hex in components and no arbitrary Tailwind colour values (`bg-[#123456]`). The lint rule `no-raw-color` enforces this.
- **Primary CTA** = `#39FF14` fill + `#121212` bold text. It is never used as text colour in light mode.
- **Hairlines, not shadows.** 1px `--hairline` borders and the architectural grid with `+` crosshairs. No drop shadows, except the cyan rim glow on product mockups and the focus ring.
- **Monospace** (`JetBrains Mono`) for prices, tax math, versions, SHA-256 hashes and `<kbd>`.
- **Sinhala/Tamil:** +15% line-height, one weight step lighter, `letter-spacing: 0`, no Geist (it has no Indic glyphs). This is enforced via `:lang(si)`/`:lang(ta)` selectors, not per component.
- **Mockups:** real CB POS UI captures only, borderless, no fake browser chrome, on a `#18181B` backdrop with a cyan rim glow.

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
- [ ] The product is written **CB POS** (non-breaking space), never "CB-POS" or "CBPOS". The company is Ceylon Byte; the site is ceybyte.com.
- [ ] No exclamation marks in UI copy. No emoji in UI copy.
- [ ] Prices are written `Rs. 1,250.00` (space after `Rs.`, comma thousands, 2 dp) in `font-mono`.
- [ ] Product claims cite a fact ID from `00-CBPOS_FACTS.md` and match it exactly. Banned claims (each one is false or unshipped today): "100% offline" (the app checks GitHub for updates on every launch, [A7]); "Cloud Sync" or any cloud service ([H]); "IRD compliant" / "2026 mandate" ([C5]); email receipts ([A8]); expiry, batch or serial tracking ([D4]); live scale connection ([E3]); customer display ([E4]); SMS/WhatsApp receipts ([F3]); per-bill receipt language or Sinhala/Tamil item names on thermal receipts ([F2]); portable .ZIP build ([A3]); "64-bit installer" ([A2]).
- [ ] Data claims: "Your sales are saved on your own PC" is true in standalone mode. When describing LAN Sync or network mode, say the data stays on the shop's own computers and server.
- [ ] Tax claims say *calculates*, never *certified/approved/compliant-guaranteed*, and link the disclaimer.
- [ ] Each string exists in `en`, `si` and `ta` (or carries `[[TRANSLATE]]`).
- [ ] Button labels are verbs: "Download CB POS", "Send ticket", "Upload slip". Never "Submit" or "Click here".

### 8.2 Visual
- [ ] Only tokens; no raw hex; no arbitrary colour values.
- [ ] At most one `#39FF14` element per viewport.
- [ ] No gradients except the defined `--glow-cyan` radial. No glassmorphism, no purple, no generic blob backgrounds.
- [ ] No stock photos, no illustrated people, no fake browser chrome, no lorem ipsum.
- [ ] Icons are Lucide at `1.5` stroke, sized 16/20/24 only. No mixed icon sets.
- [ ] Border radius comes only from the scale (`0`, `4px`, `6px`, `9999px` for pills and dots).
- [ ] Layout holds at 320, 375, 414 and 768 px with 16px gutters: no horizontal scroll (`overflow-x: clip` on `html` and `body`), no two-line buttons or nav links, image grid tracks use `minmax(0, 1fr)`, long headings wrap with `overflow-wrap: anywhere; min-width: 0` (hallmark gates 34, 49–53).
- [ ] No italic headings or italic emphasis words inside headings (hallmark gate 38a).
- [ ] Product imagery is real CB POS screenshots ([L1]: none exist yet, UR-20) or Hairline figures. Never a mocked-up POS screen invented by an agent.
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
- [ ] No new `run_worker_first` pattern without a quota note in the PR.

---

## 9. Privacy & legal guardrails

- **Sri Lanka PDPA (Personal Data Protection Act No. 9 of 2022):** collect only what a feature needs, state the purpose at collection, honour deletion requests (`/dashboard/settings` → delete listing; admin hard-delete within 30 days).
- **The site never touches shop data.** LAN Sync and PostgreSQL network mode run between the shop's own computers ([G4], [H]). The site never hosts, proxies or stores shop databases, connection strings, sync secrets or sales data. Never add a form field, ticket field or upload purpose that collects a database URL, password or LAN Sync secret. The ticket form warns users to remove these from logs before uploading ([H9]).
- IP addresses are stored only as `sha256(ip + daily_salt)`. Raw IPs are never persisted.
- PostHog runs with `maskAllInputs: true` and `mask_all_text: false`. Elements with `data-ph-no-capture` (contact fields, slips, dashboards) are never recorded. Merchant contact data is never sent as event properties.
- Bank slips and crash logs live in the private R2 bucket. They're served only through short-lived presigned GET URLs to admins.
- Required disclaimers (copy in `06-SCREEN_BLUEPRINTS_AND_COPY.md`): **as-is software / no warranty**, **tax calculation is the merchant's responsibility, not IRD-certified**, **backups are the merchant's responsibility** (the local database isn't encrypted at rest, and backups need a password, [G1], [G2]), plus the **EULA** for the app itself (none exists in the app yet, UR-06).

---

## 10. Git conventions

- Conventional Commits, terse: `<type>(<scope>): <imperative summary>`. Scopes: `prd, trd, design, flow, schema, screens, plan, app, api, db, auth, map, docs, gate, donate, feedback, blog, admin, i18n, ui, motion, worker, ci`.
- One logical change per commit. Commit after each completed checklist item.
- Branches: `feat/<scope>-<slug>`, `fix/<scope>-<slug>`. `main` is always deployable.
- Never commit `.dev.vars`, `.env*`, `.wrangler/`, `.open-next/` or real merchant data.
- Migrations: generated by `bun run db:generate`, committed with the schema change, applied to remote only by CI.

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
