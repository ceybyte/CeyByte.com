# CLAUDE.md — Ceybyte.com Repository Constitution

Ceybyte.com is the official web platform for **CB-POS**: a free, offline, keyboard-first Windows Point of Sale system for Sri Lankan retail shops. This site is where people see the product, download the installer, read the trilingual docs, report bugs, donate, and find shops that use it on the live Sri Lanka Merchant Map.

This file has the rules for every developer and AI agent working in this repo. If a rule here conflicts with what you would usually do, the rule here wins.

---

## 0. Sources of truth (read before building anything)

| Doc | Owns | Read when |
|---|---|---|
| `docs/01-PRD.md` | What we build and why. Features `F-01`–`F-12`, acceptance criteria | Before starting any feature |
| `docs/02-TRD.md` | Architecture, routes, APIs, caching, security, free-tier budget | Before touching `src/app/api`, `src/server`, `wrangler.jsonc`, workers |
| `docs/03-DESIGN.md` | Tokens, type scale, script rules, components, motion | Before writing any UI |
| `docs/04-APP_FLOW.md` | User journeys, states, error paths, analytics events | Before building a multi-step flow |
| `docs/05-SCHEMA.md` | Drizzle schema, ERD, public data masking | Before touching the database or any public API |
| `docs/06-SCREEN_BLUEPRINTS_AND_COPY.md` | 14 screens, final copy, Stitch prompts | Before building a screen or writing copy |
| `docs/07-IMPLEMENTATION_PLAN.md` | Phase order, checklists, exit criteria | At the start of each work session |

**Precedence when docs disagree:** `05-SCHEMA` > `02-TRD` > `01-PRD` > `03-DESIGN` > `06-SCREENS` > `04-APP_FLOW`. Fix the losing doc in the same PR. Never resolve a conflict silently in code.

**When a requirement is missing:** do not invent it. Add an `## Open Questions` entry to the relevant doc and choose the most conservative behaviour: least data collected, least exposed, least animated.

---

## 1. Non-negotiables

1. **$0/month until product-market fit.** Every service must fit its free tier (budget table in `02-TRD.md §14`). Adding anything that bills requires an ADR in `docs/adr/`.
2. **Never leak merchant contact data.** `phone`, `whatsapp`, `telegram`, `full_name`, IP addresses and claim tokens never appear in any public response, page, cache entry, log line or analytics event. Public queries use the explicit projections in `src/server/db/projections.ts`. Never use `select()` without columns on `merchants`.
3. **Never claim IRD approval or certification.** CB-POS *calculates* 18% VAT and 2.5% SSCL. It is not *certified*, *approved* or *endorsed* by the Inland Revenue Department. Every tax claim links to `/{locale}/legal/tax-disclaimer`.
4. **Never fabricate numbers.** Telemetry figures (districts covered, shop count, downloads) come from D1 at request/revalidate time. If a number isn't live, it isn't shown.
5. **Trilingual by construction.** No user-facing string is hardcoded in a component. Every string lives in `messages/{en,si,ta}.json`. A PR that adds an `en` key without matching `si` and `ta` keys fails CI (it may use the `[[TRANSLATE]]` marker, which blocks production deploys).
6. **Sinhala and Tamil are written by native speakers, never machine-translated into production.** Agents may draft them but must mark them `[[TRANSLATE]]`.
7. **Workers runtime only.** No Node `fs` and no `eval`/`new Function` (this rules out runtime MDX compilation). No native addons and no long-running processes. Code must run inside `workerd` with `nodejs_compat`.
8. **Every public mutating endpoint** passes, in order: Cloudflare Turnstile → rate limit → zod validation → business logic. No exceptions.
9. **Money is integer LKR cents** (`amount_cents: number`). Floats are never used for money. Coordinates are `real`.
10. **Accessibility is not optional.** WCAG 2.2 AA contrast, full keyboard operation (this is a keyboard-first product — the site must be too), visible `#00BCEB` focus rings, `prefers-reduced-motion` respected everywhere.

---

## 2. Stack lock

Major versions are locked. Upgrading a major version or swapping a library requires an ADR.

| Layer | Package(s) | Notes |
|---|---|---|
| Framework | `next@15` (App Router, TypeScript strict) | `src/` layout, Server Components by default |
| Edge runtime | `@opennextjs/cloudflare`, `wrangler` | Deploys to **Cloudflare Workers with Static Assets** (OpenNext doesn't target Pages; see `02-TRD.md §2`) |
| Database | Cloudflare D1 + `drizzle-orm` + `drizzle-kit` | SQLite dialect; schema stays Postgres-portable (`05-SCHEMA.md §6`) |
| Reactive alt. | `convex` (not installed) | Mirror schema in `05-SCHEMA.md §8`, only adopted via ADR |
| Auth | `better-auth`, `better-auth-cloudflare`, Better Auth `admin` plugin | Roles: `merchant`, `admin` |
| Storage | Cloudflare R2 (`UPLOADS` binding) + `aws4fetch` for presigning | Slips, crash logs, blog covers |
| Installer CDN | GitHub Releases on `ceybyte/cbpos-releases` | Manifest: `https://raw.githubusercontent.com/ceybyte/cbpos-releases/main/latest.json` |
| Cache/KV | Workers KV (`CACHE_KV`) + Cache API | Geo snapshot, docs search index |
| Styling | `tailwindcss@4` (CSS-first `@theme`), `shadcn/ui`, Radix UI, `vaul`, `lucide-react`, `sonner` (toasts), `next-themes` | No `tailwind.config.js`; tokens live in `src/app/globals.css` |
| Motion | `motion` (import from `motion/react`), `gsap` + `ScrollTrigger`, `lenis`, `@rive-app/react-canvas`, `@lucasmarkes/hairline` | See `03-DESIGN.md §9`; `hairline` must be verified before install (`07 Phase 1`) |
| Maps | `maplibre-gl` (native GeoJSON clustering, which uses Supercluster internally) | CARTO Dark Matter / Positron styles, bounded to Sri Lanka |
| Docs | `fumadocs-ui`, `fumadocs-core` + unified/remark/rehype pipeline | Content in D1, rendered without eval (`02-TRD.md §8`) |
| i18n | `next-intl` | Locales `en` (default), `si`, `ta`; prefix `always` |
| Forms | `react-hook-form`, `zod`, `@hookform/resolvers` | Same zod schema validates client and server |
| Bot defense | Cloudflare Turnstile | Every public form |
| Analytics | `posthog-js`, `posthog-node` | Proxied via `/ingest`; inputs masked in replay |
| Email | Resend (free tier) | Auth emails only |
| Testing | `vitest`, `@testing-library/react`, `@playwright/test`, `@axe-core/playwright` | |
| Package manager | `pnpm` | Never commit `package-lock.json` or `yarn.lock` |

**Banned:** Prisma (doesn't fit Workers' bundle limits), `next-auth`, styled-components/emotion, `moment`, `lodash` (full), jQuery, any CSS-in-JS runtime, Google Maps, Mapbox GL (licence), `framer-motion` package name (use `motion`), client-side fetching of `latest.json` directly from GitHub (always go through our API).

---

## 3. Commands

These scripts are the `package.json` contract created in Phase 0 (`07-IMPLEMENTATION_PLAN.md`). Do not rename them.

```bash
pnpm install                 # install deps
pnpm dev                     # next dev with Cloudflare bindings via initOpenNextCloudflareForDev()
pnpm build                   # next build
pnpm preview                 # opennextjs-cloudflare build && opennextjs-cloudflare preview (real workerd)
pnpm deploy                  # opennextjs-cloudflare build && opennextjs-cloudflare deploy
pnpm cf-typegen              # wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts

pnpm db:generate             # drizzle-kit generate  → ./drizzle/*.sql
pnpm db:migrate:local        # wrangler d1 migrations apply cbpos-db --local
pnpm db:migrate:remote       # wrangler d1 migrations apply cbpos-db --remote   (CI only)
pnpm db:seed:local           # tsx scripts/seed.ts → local D1 (districts, demo merchants, docs)
pnpm db:studio               # drizzle-kit studio (local)

pnpm lint                    # eslint + prettier --check
pnpm typecheck               # tsc --noEmit
pnpm test                    # vitest run
pnpm test:watch              # vitest
pnpm e2e                     # playwright test (against pnpm preview)
pnpm i18n:check              # scripts/i18n-check.ts: key parity + [[TRANSLATE]] scan
pnpm bundle:check            # wrangler deploy --dry-run --outdir .bundle && size gate (3 MiB gz)

pnpm --filter release-sync dev     # run cron worker locally (wrangler dev --test-scheduled)
pnpm --filter release-sync deploy  # deploy cron worker
```

**Before declaring any task done:** `pnpm lint && pnpm typecheck && pnpm test && pnpm i18n:check`. For changes to the runtime, bindings or middleware, also run `pnpm preview` and `pnpm bundle:check`.

---

## 4. Repository layout

```
.
├── CLAUDE.md
├── docs/                          # 01–07 planning suite + adr/
├── messages/{en,si,ta}.json       # all UI strings
├── drizzle/                       # generated SQL migrations (never hand-edit applied ones)
├── public/
│   ├── data/lk-districts.json     # 25 districts, 9 provinces, centroids
│   ├── data/lk-cities.json        # city → district, lat, lng (GPS snap + dropdowns)
│   ├── rive/*.riv                 # Rive state machines
│   └── og/                        # static OG fallbacks
├── scripts/                       # seed, i18n-check, bundle size gate
├── e2e/                           # Playwright specs
├── workers/release-sync/          # standalone cron Worker (GitHub → D1)
├── src/
│   ├── middleware.ts              # next-intl locale routing + admin/dashboard guards
│   ├── i18n/{routing,request,navigation}.ts
│   ├── app/
│   │   ├── globals.css            # Tailwind v4 @theme tokens (03-DESIGN §3)
│   │   ├── [locale]/              # all public + merchant routes
│   │   ├── admin/                 # admin console (English only, not localized)
│   │   └── api/                   # route handlers (02-TRD §5)
│   ├── components/
│   │   ├── ui/                    # shadcn primitives (generated, then token-adapted)
│   │   ├── brand/                 # Logo, Kbd, HashBlock, GridCanvas, Crosshair
│   │   ├── marketing/             # 8 homepage sections
│   │   ├── map/  docs/  forms/  motion/
│   ├── features/                  # vertical slices: download-gate, merchants, releases,
│   │                              # docs, feedback, donations, blog, admin
│   ├── server/                    # server-only: db, auth, r2, turnstile, ratelimit,
│   │                              # geo-cache, github, markdown
│   └── lib/                       # isomorphic: env, money, phone, sri-lanka, analytics
├── open-next.config.ts
├── wrangler.jsonc
├── drizzle.config.ts
└── next.config.ts
```

Rules:
- Anything under `src/server/` starts with `import "server-only";`.
- A feature's zod schemas live in `src/features/<feature>/schema.ts` and are imported by both the form and the route handler.
- Components never import from `src/server/`. They receive data as props or call Server Actions.

---

## 5. Coding rules

### 5.1 TypeScript
- `strict: true`, `noUncheckedIndexedAccess: true`. No `any`. Use `unknown` and narrow it.
- Prefer `type` over `interface` unless declaration merging is needed.
- Use discriminated unions for states (`{ status: "idle" } | { status: "submitting" } | …`) instead of boolean soup.
- Filenames are kebab-case. Component exports are PascalCase. One component per file unless the others are private helpers.

### 5.2 Cloudflare runtime
- Get bindings with `getCloudflareContext()` from `@opennextjs/cloudflare`. **Create the Drizzle client and the Better Auth instance per request.** Never put them in module scope, because D1 bindings are request-scoped.
- No `fs` and no `eval`. Sharp/image processing is not available, so use `next/image` with `unoptimized` or Cloudflare Images (paid, banned for now). Pre-size images at build time.
- Worker CPU time is limited (10 ms on the free plan). Any route that does real work must be statically prerendered or cached. See the rendering matrix in `02-TRD.md §6`.
- Use `ctx.waitUntil()` (via `getCloudflareContext().ctx`) for fire-and-forget logging and cache writes. Never `await` analytics on the request path.

### 5.3 Data & APIs
- All input is validated with zod at the boundary. Route handlers return `{ ok: true, data } | { ok: false, error: { code, message } }` with correct HTTP status codes.
- Error `code`s are SCREAMING_SNAKE and documented in `02-TRD.md §5.3`. User-facing messages come from `messages/*.json` keyed by code. Never send raw error strings to the client.
- Use `db.batch([...])` for multi-statement writes (D1 has no interactive transactions).
- Generate IDs in the app with `crypto.randomUUID()`. Generate timestamps in the app (`new Date()`). No SQL-side defaults, so the schema stays portable.
- Phone numbers are normalised to E.164 (`+947XXXXXXXX`) by `src/lib/phone.ts` before storage.

### 5.4 React / Next
- Server Components by default. Add `"use client"` only for interactivity, motion, maps, Rive and forms.
- Heavy client libraries (`maplibre-gl`, `@rive-app/react-canvas`, `gsap`, `lenis`) load through `next/dynamic` with `ssr: false` behind an IntersectionObserver or interaction trigger. They must never be in the initial JS of `/`.
- Mutations use Server Actions for authenticated dashboard and admin work, and route handlers for public, Turnstile-protected forms and webhooks.
- Links use the locale-aware `Link` from `src/i18n/navigation.ts`, never `next/link` directly in localized routes.

### 5.5 Tests
- Unit tests (vitest) cover `src/lib/*`: money, phone, VAT/SSCL display math, district lookup, masking projections.
- **Required test:** `geo.contract.test.ts` asserts that the `/api/merchants/geo` feature properties equal exactly the public key whitelist from `05-SCHEMA.md §7`.
- E2E (Playwright) covers the 6 flows in `04-APP_FLOW.md` in all three locales, with axe checks on every screen.

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

## 7. AI design skills

Load these skills when doing UI work. They advise; this repo's tokens and rules still win.

| Skill | Load when | What we take from it |
|---|---|---|
| `emilkowalski/skills` | Any animation, transition, gesture, drawer, toast | Motion has a purpose. Fast, interruptible, ease-out entrances. Never animate layout-thrashing properties. Reduced-motion fallback first |
| `nutlope/hallmark` | Building a new page or section from scratch | Ship one strong, specific layout instead of generic templates. Verify it in the browser before calling it done |
| `impeccable` (impeccable.style; installed locally as the `impeccable` skill) | Design critique, polish, audit passes, typography and colour review | Run an audit on every screen before PR. Fix hierarchy, spacing, contrast and copy issues it finds |

If one of these skills isn't installed in your environment, say so in the PR description. Don't pretend you applied it. Apply the anti-slop checklists below either way.

---

## 8. Anti-slop checklists

A PR fails review if any box can't be honestly ticked.

### 8.1 Copy
- [ ] No filler words: *seamless, revolutionize, unlock, elevate, empower, cutting-edge, robust, leverage, game-changer, in today's fast-paced world, effortless*.
- [ ] Every headline states a concrete outcome or number ("Bill in 0 ms network lag", not "Next-gen retail experience").
- [ ] No exclamation marks in UI copy. No emoji in UI copy.
- [ ] Prices are written `Rs. 1,250.00` (space after `Rs.`, comma thousands, 2 dp) in `font-mono`.
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
- [ ] Layout holds at 360px width with 16px gutters, with no horizontal scroll.
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
- [ ] The bundle gate passes (`pnpm bundle:check`).

---

## 9. Privacy & legal guardrails

- **Sri Lanka PDPA (Personal Data Protection Act No. 9 of 2022):** collect only what a feature needs, state the purpose at collection, honour deletion requests (`/dashboard/settings` → delete listing; admin hard-delete within 30 days).
- IP addresses are stored only as `sha256(ip + daily_salt)`. Raw IPs are never persisted.
- PostHog runs with `maskAllInputs: true` and `mask_all_text: false`. Elements with `data-ph-no-capture` (contact fields, slips, dashboards) are never recorded. Merchant contact data is never sent as event properties.
- Bank slips and crash logs live in private R2. They're served only through short-lived presigned GET URLs to admins.
- Required disclaimers (copy in `06-SCREEN_BLUEPRINTS_AND_COPY.md`): **as-is software / no warranty**, **tax calculation is the merchant's responsibility, not IRD-certified**, **local SQLite backups are the merchant's responsibility**.

---

## 10. Git conventions

- Conventional Commits, terse: `<type>(<scope>): <imperative summary>`. Scopes: `prd, trd, design, flow, schema, screens, plan, app, api, db, auth, map, docs, gate, donate, feedback, blog, admin, i18n, ui, motion, worker, ci`.
- One logical change per commit. Commit after each completed checklist item.
- Branches: `feat/<scope>-<slug>`, `fix/<scope>-<slug>`. `main` is always deployable.
- Never commit `.dev.vars`, `.env*`, `.wrangler/`, `.open-next/` or real merchant data.
- Migrations: generated by `pnpm db:generate`, committed with the schema change, applied to remote only by CI.

---

## 11. Definition of done

A task is done when all of these are true:
1. It meets the acceptance criteria in `01-PRD.md` for the feature.
2. It matches the screen blueprint and copy in `06-…`, using tokens from `03-DESIGN.md`.
3. It handles every state from `04-APP_FLOW.md`: loading, empty, error, success, offline where relevant.
4. `pnpm lint && pnpm typecheck && pnpm test && pnpm i18n:check` all pass.
5. The E2E spec for the flow passes in `en`, `si` and `ta`, with zero axe violations.
6. The checklists in §8 are ticked in the PR description.
7. The matching box in `docs/07-IMPLEMENTATION_PLAN.md` is checked in the same PR.
