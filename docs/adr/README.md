# Architecture Decision Records

One file per decision: `NNNN-short-title.md`, written from [`0000-template.md`](0000-template.md). Decisions are never edited after acceptance; a new ADR supersedes an old one.

An ADR is required for: changing a locked stack component or major version (`CLAUDE.md §2`), adding anything that costs money, an exception to a design-skill finding (`CLAUDE.md §7.3`), and any change to how shop or merchant data is stored or exposed.

## Index (branch `main`)

The reasoning for each is already summarised in `docs/02-TRD.md §1.1`; Phase 0 turns each row into a full ADR file.

| ADR | Title | Status | Summary in |
|---|---|---|---|
| 0000 | Phase 0 verification results | Pending (Phase 0) | `07` Phase 0.1 |
| 0001 | Single VPS with Dokploy and Cloudflare Tunnel | Accepted | TRD D1, D2 |
| 0002 | Markdown content rendered at publish (no runtime MDX) | Accepted | TRD D6 |
| 0003 | Installer delivery by 302 to GitHub Releases | Accepted | TRD D7 |
| 0004 | Geo snapshot in Valkey with versioned ETags | Accepted | TRD §10 |
| 0005 | Presigned PUT + head verification on Garage | Accepted | TRD §9 |
| 0006 | PostgreSQL with a SQLite-portable schema; Convex documented only | Accepted | SCHEMA §6, §8 |
| 0007 | `@lucasmarkes/hairline` adoption and figure mapping | Accepted | DESIGN §9.6 |
| 0008 | Protomaps self-hosted tiles instead of CARTO; Latin map labels | Accepted | TRD D10, DESIGN §8.9 |
| 0009 | Garage instead of MinIO | Accepted | TRD D8 |
| 0010 | Inter body font kept despite impeccable's generic-font finding | Accepted | CLAUDE §7.3 |
| 0011 | pg-boss for jobs and schedules | Accepted | TRD D5 |
| 0012 | Bun as the production runtime, Node 22 fallback | Accepted, verify in Phase 0 | TRD D3 |
| 0013 | PostHog Cloud instead of self-hosting | Accepted | TRD D11 |
| 0014 | Off-site encrypted backups to Cloudflare R2 | Accepted | TRD D9 |
| 0015 | Bank transfer only for donations; payment gateway deferred | Accepted | PRD F-11 |
| 0016 | Product name "CB POS" (non-breaking space) | Accepted | PRD OQ-3 |
