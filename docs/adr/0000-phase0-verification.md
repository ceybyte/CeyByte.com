# 0000 — Phase 0 verification results

| | |
|---|---|
| Status | Accepted (items marked *moved* are verified at the start of the named phase) |
| Date | 2026-10-22 |
| Branches | `free` |

## Context

`docs/07-IMPLEMENTATION_PLAN.md` Phase 0.1 lists assumptions to confirm before building on them. This records what was checked, how, and what changed.

## Results

| Assumption | Result | How |
|---|---|---|
| Workers free limits: 64 MiB Worker size, 10 ms CPU, static assets free and unlimited | **Confirmed** (2026-10-21) | Cloudflare docs: platform limits, static-assets billing |
| `@lucasmarkes/hairline` exists, licence, size | **Confirmed**: v0.5.1, MIT, no dependencies, React ≥ 18 optional peer | `npm view` |
| Design skills exist | **Confirmed and installed**: `emilkowalski/skills` (MIT), `Nutlope/hallmark` (MIT), `pbakaus/impeccable` (Apache-2.0). Impeccable's launcher downloads its engine binary from its own GitHub releases; its browser scripts talk to `localhost` only | GitHub API, file review |
| CARTO basemaps usable for free | **Rejected**: commercial use needs an enterprise licence → ADR-0008 (Protomaps) | CARTO FAQ |
| `run_worker_first` array + `not_found_handling: "404-page"` + `html_handling: "auto-trailing-slash"` | **Confirmed** with Wrangler 4: `/` serves static HTML, `/api/health` reaches the Worker, unknown paths return the 404 page | `wrangler dev` + Playwright smoke test |
| `ratelimits` binding syntax | **Syntax confirmed**: Wrangler accepts all five bindings and generates `RateLimit` types. Availability on the free plan is confirmed at the first real deploy | `wrangler deploy --dry-run` |
| `@cloudflare/vitest-pool-workers` | **Changed**: renamed to `@cloudflare/vitest-plugin` (1.4.x, supports vitest 4–5). New config uses the `cloudflareTest()` Vite plugin; tests call `exports.default.fetch()` from `cloudflare:workers` | Package README, passing test |
| Next 15 static export under Bun | **Confirmed**: `bun --bun next build` with `output: "export"` produces `out/` (103 kB first-load JS for the placeholder) | Build output |
| `eslint-config-next` under Bun workspaces | **Changed**: Bun 1.3's default isolated linker hides ESLint plugins; `bunfig.toml` sets `linker = "hoisted"` | Lint failure, then pass |
| Playwright locally on macOS 13 | **Changed**: Playwright's bundled Chromium needs macOS 14+. Locally run `PW_CHANNEL=chrome bun run e2e` (installed Google Chrome); CI uses Playwright's Chromium on Ubuntu | Install error, then pass |
| Better Auth + `better-auth-cloudflare` with Hono on D1 | *Moved* to the start of Phase 2 | — |
| drizzle-kit partial unique indexes and `check()` for SQLite | *Moved* to the start of Phase 2 | — |
| `next-intl` static export (`setRequestLocale` + `generateStaticParams`) | *Moved* to the start of Phase 3 | — |
| MapLibre Sinhala/Tamil label shaping | *Moved* to the start of Phase 7 | — |
| GitHub Actions minutes | **Resolved**: `ceybyte/CeyByte.com` is public, so standard runners are unmetered | Repo visibility |

## Consequences

- Stack table and commands in `CLAUDE.md` now name `@cloudflare/vitest-plugin` and the hoisted linker.
- Cloudflare resources (D1, R2, KV, Turnstile, custom domains) and repo secrets still need an account owner; until then the deploy workflow skips cleanly and CI runs everything locally.
