# 08 — Requests to the CB-POS App Repository

| | |
|---|---|
| Version | 1.0 |
| Date | 2026-10-21 |
| Source | `docs/00-CBPOS_FACTS.md` (audit of `HMAHD/CB-POS` at `88a7858`) |
| Owner | CB-POS app team. The website team tracks status here |

The website can only say what the app does. These are the app-side changes the website depends on, or that would let the site say more. Each request names the fact it comes from (`[C2]` = section C2 of `00-CBPOS_FACTS.md`) and what the website does until it lands.

Status values: `open` · `accepted` · `done in vX.Y.Z` · `declined`.

## Blocking or high-impact

| ID | Request | Facts | Why the website needs it | Until it lands, the site… | Status |
|---|---|---|---|---|---|
| UR-01 | **Fix the setup wizard being skipped on a fresh install** (`settings.json` is created by `ConfigService.get("language")` before the wizard check), and make the wizard's admin PIN actually apply | [I1] | The "What Next?" guide has to tell new users how to log in | …tells users: "If the setup screens don't appear, log in with admin PIN **1234** and change it immediately in Users." | open |
| UR-02 | **Code-sign the installer** (Azure Trusted Signing or an OV certificate) | [A5] | SmartScreen warnings are the biggest install drop-off | …shows SmartScreen steps and the SHA-256 on every download surface. Funding goal #1 on `/donate` | open |
| UR-03 | **Publish the v1.3.x LAN Sync data-loss fixes** (#671, #677–#680, #715–#717) in a tagged release | [H1] | The site can't promote multi-till use while the released build can lose sales | …documents LAN Sync with a visible warning and doesn't market it on the homepage | open |
| UR-04 | **Align tax docs with code**: SSCL is on the VAT-exclusive base (`MRP/1.18 × 50% × 2.5%`). Fix `docs/TAX.md`, `CLAUDE.md`, `PROJECT_OVERVIEW.md`, and the Tax Filing Summary report's gross-basis "Liable Turnover" line | [C2], [C4] | Website tax pages must match what the app computes, and the app's own report shouldn't disagree with itself | …describes the code's formula and links the tax disclaimer | open |
| UR-05 | **Remove or substantiate "2026 mandate compliant" / "Tax Compliance"** wording in `public-releases-readme.md`, `README.md`, `PRODUCT.md`, `CHANGELOG.md` | [C5] | The public releases README is linked from the site; it can't contradict the site's "not IRD-certified" disclaimer | …never repeats compliance wording | open |
| UR-06 | **Add an EULA** (`LicenseFile=` in `installer/cbpos.iss`) using the text from `/{locale}/legal/eula` | [K1], [K2] | There's no licence, warranty disclaimer or liability limit anywhere today | …publishes the EULA on the website and links it from the download gate | open |

## Website integration

| ID | Request | Facts | Benefit | Status |
|---|---|---|---|---|
| UR-07 | **Add a Help menu** with links: `https://ceybyte.com/{lang}/docs?utm_source=app&v={version}`, `/{lang}/feedback/new?type=bug&v={version}&os={winver}`, `/{lang}/releases` | [J2] | In-app entry points to docs and the bug tracker (PRD F-05, F-07) | open |
| UR-08 | **Enrich `latest.json` with additive keys only**: `size` (bytes), `published_at` (ISO 8601), `notes_url`. Keep the six existing keys unchanged | [A6] | The site shows installer size and date without calling the GitHub API. The app ignores unknown keys | open |
| UR-09 | **Wire `CHANGELOG.md` into the release body and `latest.json.changelog`** | [A6] | Real release notes on `/releases` and in the in-app update dialog | open |
| UR-10 | **Add a setting to turn off the startup update check**, and update the public README's "100% offline" claim to mention it | [A7], [A8] | Honest privacy copy. Some shops want zero outbound traffic | open |
| UR-11 | **Add `ArchitecturesInstallIn64BitMode=x64compatible`** to the installer | [A2] | Installs into `C:\Program Files` instead of `(x86)`. Lets the site state "64-bit" truthfully | open |
| UR-12 | **Export logs with one click** (Admin Tools → "Export for support") and strip connection strings | [J1], [H9] | The ticket form asks for logs. One file is easier than the filter → export flow | open |

## Features the site would advertise once they exist

| ID | Request | Facts | Status |
|---|---|---|---|
| UR-13 | Fix "Email receipt" (`EmailService.send_receipt` doesn't exist) | [A8] row 3b | open |
| UR-14 | Print localized item names on thermal receipts (`name_si`/`name_ta` already exist on products) | [F2] | open |
| UR-15 | UI to set `Category.tax_exempt` (the in-app guide already tells users to do it) | [C3] | open |
| UR-16 | Verify LAN Sync TLS certificates (pinning on first connect) | [H6] | open |
| UR-17 | An `sslmode` field in Network settings, and Alembic migrations for PostgreSQL | [H6], [H7] | open |
| UR-18 | Use the configured rounding mode (ROUND_HALF_UP) for tax, or document banker's rounding | [C1] | open |
| UR-19 | Fix `loyalty_minimum_redeem` vs `loyalty_min_redeem_points` key mismatch, and the "Transfer" vs "Bank Transfer" shift-summary mismatch | [B2] | open |
| UR-20 | Capture real screenshots (sales, payment, receipt preview, reports, settings) in EN/SI/TA at 1920×1080 for the website | [L1] | open |

## Process

- The website must not claim anything that is still `open` here.
- When a request ships, update `00-CBPOS_FACTS.md` (re-run the audit prompt against the new tag), then update the website copy in the same PR.
- Re-run the full audit against every tagged CB-POS release before changing release-related copy.
