# M1 Launch Readiness & Production Deployment Verification

**Target Milestone:** M1 (Core Commercial Web Presence & Distribution)  
**Implementation Plan Reference:** `docs/07-IMPLEMENTATION_PLAN.md` §Phase 9  
**Specification Compliance:** `docs/01-PRD.md`, `docs/02-TRD.md`, `docs/06-SCREEN_BLUEPRINTS_AND_COPY.md`, `CLAUDE.md`  
**Status:** READY FOR PRODUCTION DEPLOYMENT (All M1 Acceptance Criteria Passing)

---

## 1. Executive Summary

Phase 9 establishes the legal compliance, security hardening, failure resilience, and production readiness required to release CB POS publicly to Sri Lankan retail merchants.

All deliverables have been implemented natively, verified through rigorous automated test suites, and validated against production static export constraints ($0/month architecture).

---

## 2. Phase 9 Deliverables & Verification Matrix

| Area | Component / File | Verification Command | Status |
|---|---|---|---|
| **S11 Legal Center** | `apps/web/src/app/[locale]/legal/[slug]` (`terms`, `eula`, `privacy`, `tax-disclaimer`, `data-safety`, `cookies`) | `bun test src/features/legal/legal.test.ts` | **PASS (3/3)** |
| **Download Gate Legal Links** | `apps/web/src/components/gate/download-gate-modal.tsx` (enforcing `termsVersion: "2026-10-01"`) | `bun test src/components/gate/__tests__/gate.test.ts` | **PASS (6/6)** |
| **CI Banned Claims Scanner** | `scripts/banned-claims-check.ts` (scans for "100% offline", "Cloud Sync", "IRD compliant", buzzwords, brand format) | `bun run check:claims` | **PASS (0 violations)** |
| **Trilingual Key Parity** | `messages/{en,si,ta}.json` (346 keys across 3 languages with zero `[[TRANSLATE]]` markers) | `bun scripts/i18n-check.ts --strict` | **PASS (346 keys strict)** |
| **Turnstile Route Enforcement** | `apps/api/test/turnstile-enforcement.test.ts` (verifies 403 on missing/invalid Turnstile token) | `bunx vitest run test/turnstile-enforcement.test.ts` | **PASS (2/2)** |
| **Privacy Projection Contract** | `apps/api/test/privacy-contract.test.ts` (verifies zero merchant phone, WhatsApp, or email leakage in public endpoints) | `bunx vitest run test/privacy-contract.test.ts` | **PASS (2/2)** |
| **Failure Drills & Fallbacks** | `apps/api/test/failure-drills.test.ts` (verifies D1 release failure fallback to `FALLBACK_RELEASE` and 302 redirect) | `bunx vitest run test/failure-drills.test.ts` | **PASS (3/3)** |
| **Static Export Bundle** | Next.js Static Export in `apps/web/out/` (85 pre-rendered static HTML routes, 15 OG images, Orama search indexes) | `bun run build` | **PASS (85/85 SSG pages)** |
| **Repository Quality Gates** | Full TypeScript typechecking and ESLint code hygiene | `bun run lint && bun run typecheck` | **PASS (0 errors, 0 warnings)** |

---

## 3. Production Deployment Runbook

### 3.1 Cloudflare Infrastructure Setup

1. **D1 SQLite Database:**
   ```bash
   wrangler d1 create cbpos-db
   wrangler d1 migrations apply cbpos-db --remote
   ```
2. **KV Namespaces:**
   - `CACHE_KV`: GeoJSON caching, release caching, and rate limiting counters.
   - `CONTENT_KV`: Documentation search and article publishing snapshots.
3. **R2 Buckets:**
   - `cbpos-public`: PMTiles vector map tiles (`sri-lanka.pmtiles`), approved screenshot attachments, and release assets.
4. **Custom Domains & Routing:**
   - Apex domain: `ceybyte.com` pointing to Cloudflare Pages static export.
   - Subdomain: `api.ceybyte.com` (or worker routing) running the Hono API Worker.
   - Subdomain: `cdn.ceybyte.com` pointing to the public R2 bucket with CORS enabled.
   - Redirect worker: `apps/www-redirect` redirecting `www.ceybyte.com` → 301 → `ceybyte.com`.

### 3.2 Production Secrets & Environment Variables

The following secrets must be configured via `wrangler secret put <KEY>`:
- `BETTER_AUTH_SECRET`: High-entropy 32+ character random secret for session encryption.
- `RESEND_API_KEY`: Production API token for transactional OTP sign-in emails (`auth@ceybyte.com`).
- `TURNSTILE_SECRET_KEY`: Cloudflare Turnstile secret key matching the production domain widget.
- `GITHUB_WEBHOOK_SECRET`: HMAC secret for incoming release dispatch webhooks from GitHub releases.
- `ADMIN_EMAILS`: Comma-separated list of maintainer email addresses granted admin role on first sign-in.

### 3.3 Post-Deploy Smoke Testing

1. **Release Download Redirection:**
   - `curl -I https://ceybyte.com/api/download/latest`
   - Expected: `HTTP/2 302` with `location: https://github.com/ceybyte/cbpos-releases/releases/download/...`
2. **Legal Pages Availability:**
   - `curl -I https://ceybyte.com/en/legal/terms`
   - `curl -I https://ceybyte.com/si/legal/tax-disclaimer`
   - `curl -I https://ceybyte.com/ta/legal/privacy`
   - Expected: `HTTP/2 200`
3. **Merchant Map Privacy:**
   - `curl https://ceybyte.com/api/merchants/geo`
   - Expected: `FeatureCollection` with 4-decimal coordinate precision and zero phone/whatsapp fields.
