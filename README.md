# ceybyte.com

The website for **CB POS**: free, offline-first, keyboard-first point-of-sale software for Sri Lankan shops, made by Ceylon Byte.

This site is where shop owners download CB POS, read the docs in English, Sinhala and Tamil, report bugs, donate, and find shops that use it on a live map of Sri Lanka.

> **Status:** planning complete, no application code yet. Building starts with Phase 0 in [`docs/07-IMPLEMENTATION_PLAN.md`](docs/07-IMPLEMENTATION_PLAN.md).

---

## Two branches, two architectures

| Branch | Architecture | Monthly cost | When to use it |
|---|---|---|---|
| **`main`** (this branch) | One VPS: Next.js 15 on Bun, PostgreSQL 17, Valkey, Garage (S3), pg-boss jobs, deployed with Dokploy behind Cloudflare Tunnel | The VPS only | The full platform, once a server is available |
| [`free`](../../tree/free) | Static Next.js export on Cloudflare Workers Static Assets + one Hono Worker, D1, R2, KV | Rs. 0 | Running at no cost before product-market fit |

Both branches share the product, design, flows and copy. They differ in the TRD, the schema dialect, the commands and the plan. Read the branch's own [`CLAUDE.md`](CLAUDE.md) before writing code, and don't copy runtime code across branches without checking.

---

## Docs

| Doc | What it covers |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Rules for every contributor and AI agent: stack lock, commands, coding rules, design-skill gates, anti-slop checklists |
| [`docs/01-PRD.md`](docs/01-PRD.md) | Product requirements: personas, features F-01 to F-12, acceptance criteria |
| [`docs/02-TRD.md`](docs/02-TRD.md) | Architecture, routes, APIs, caching, security, backups, cost |
| [`docs/03-DESIGN.md`](docs/03-DESIGN.md) | Design system: tokens, typography (incl. Sinhala/Tamil rules), components, motion |
| [`docs/04-APP_FLOW.md`](docs/04-APP_FLOW.md) | The six user journeys, states, errors and analytics events |
| [`docs/05-SCHEMA.md`](docs/05-SCHEMA.md) | Drizzle schema, ER diagram, public data masking rules |
| [`docs/06-SCREEN_BLUEPRINTS_AND_COPY.md`](docs/06-SCREEN_BLUEPRINTS_AND_COPY.md) | 14 screens, final English copy, Google Stitch prompts |
| [`docs/07-IMPLEMENTATION_PLAN.md`](docs/07-IMPLEMENTATION_PLAN.md) | Phased build plan with checklists and exit criteria |
| [`docs/08-UPSTREAM_REQUESTS.md`](docs/08-UPSTREAM_REQUESTS.md) | Changes the site needs from the CB POS app |
| [`docs/adr/`](docs/adr/) | Architecture decision records |

Product claims about the CB POS app come from a private facts audit of the app's source. It isn't committed to this public repo; see `CLAUDE.md §0`.

---

## Stack (branch `main`)

- **Web:** Next.js 15 (App Router, TypeScript), Tailwind CSS v4, shadcn/ui, Radix, Motion, GSAP + Lenis, Rive, `@lucasmarkes/hairline`, MapLibre GL with self-hosted Protomaps tiles, Fumadocs, `next-intl` (`en`, `si`, `ta`)
- **Server:** Bun runtime, PostgreSQL 17 + Drizzle ORM, Valkey, Garage (S3-compatible), pg-boss, Better Auth
- **Ops:** Docker Compose via Dokploy, Cloudflare (DNS, CDN, Tunnel, Turnstile), encrypted nightly backups to Cloudflare R2
- **Product services:** PostHog (analytics), Resend (email), GitHub Releases (installer downloads)

---

## Getting started

There's nothing to run yet. Once Phase 0 lands, local development will be:

```bash
bun install
cp .env.example .env          # fill in local values
bun run services:up           # PostgreSQL, Valkey, Garage in Docker
bun run db:migrate && bun run db:seed
bun run dev                   # http://localhost:3000
```

Requirements: [Bun](https://bun.sh) 1.x, Docker with Compose v2, Git.

Before working on UI, install the design skills used as review gates (`CLAUDE.md §7`):

```bash
bunx skills add emilkowalski/skills
bunx skills add Nutlope/hallmark
bunx skills add pbakaus/impeccable
```

---

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). In short: branch from `main` (or `free`), keep commits small and in Conventional Commits style, run the design gates for any UI change, and fill in the PR template.

## Security

Please don't open public issues for security problems. See [`SECURITY.md`](SECURITY.md).

## Links

- Download CB POS: [github.com/ceybyte/cbpos-releases/releases/latest](https://github.com/ceybyte/cbpos-releases/releases/latest)
- WhatsApp community: [chat.whatsapp.com/BS73D23VD74BbseKuoC1BM](https://chat.whatsapp.com/BS73D23VD74BbseKuoC1BM)

---

© 2026 Ceylon Byte. All rights reserved. The CB POS app is proprietary freeware; this repository's licence is still to be decided.
