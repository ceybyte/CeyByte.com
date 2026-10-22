# Architecture Decision Records

One file per decision: `NNNN-short-title.md`, written from [`0000-template.md`](0000-template.md). Decisions are never edited after acceptance; a new ADR supersedes an old one.

An ADR is required for: changing a locked stack component or major version (`CLAUDE.md §2`), adding anything that costs money, an exception to a design-skill finding (`CLAUDE.md §7.3`), adding a `run_worker_first` route pattern, and any change to how shop or merchant data is stored or exposed.

## Index (branch `free`)

The reasoning for each is already summarised in `docs/02-TRD.md §1.1`; Phase 0 turns each row into a full ADR file.

| ADR | Title | Status | Summary in |
|---|---|---|---|
| 0000 | Phase 0 verification results | Pending (Phase 0) | `07` Phase 0.1 |
| 0001 | Static export + Hono Worker instead of OpenNext on the free plan | Accepted | TRD D1, D2 |
| 0002 | Content in D1, rendered at build time | Accepted | TRD D3, §6 |
| 0003 | Installer delivery by 302 to GitHub Releases | Accepted | TRD D4 |
| 0004 | Geo snapshot in KV with versioned Cache API keys | Accepted | TRD D6, §10 |
| 0005 | Presigned PUT + head verification for R2 uploads | Accepted | TRD D7, §9 |
| 0006 | Drizzle on D1 with a Postgres-portable schema; Convex documented only | Accepted | SCHEMA §6, §8 |
| 0007 | `@lucasmarkes/hairline` adoption and figure mapping | Accepted | DESIGN §9.6 |
| 0008 | Protomaps self-hosted tiles instead of CARTO; Latin map labels | Accepted | TRD D10, DESIGN §8.9 |
| 0009 | Passwordless auth on the free plan | Accepted | TRD D5 |
| 0010 | Inter body font kept despite impeccable's generic-font finding | Accepted | CLAUDE §7.3 |
| 0011 | CSP without nonces on static export; Trusted Types plan | Accepted | TRD §12.3 |
| 0012 | Bun for tooling; production Worker on workerd | Accepted | TRD D11 |
| 0013 | Bank transfer only for donations; payment gateway deferred | Accepted | PRD F-11 |
| 0014 | Product name "CB POS" (non-breaking space) | Accepted | PRD OQ-3 |
| 0017 | Impeccable craft floor adopted: no eyebrow labels or section numbers, no coloured side stripes > 1px, themed browser surfaces | Accepted | DESIGN §5.3, §8 |
| 0018 | Pure white text (`#FFFFFF`) kept as a brand-pinned exception to hallmark's pure-black/white tell | Accepted | DESIGN §2 |
