# CB POS — Facts for the ceybyte.com website team

Factual reference compiled from the CB-POS source repository. Every claim cites the evidence as `path:line` (repo-relative). Anything not in the repo is marked **UNKNOWN — not found**. Where docs and code disagree, the code is treated as the truth and the disagreement is called out, because several public docs (`public-releases-readme.md`, `README.md`, `CHANGELOG.md`, `docs/TAX.md`) overstate or misdescribe what the code does.

## Scope — read before copying anything

- **What was audited:** branch `feature/audit-phase-4-slotted-dtos-batch-tables`, HEAD `88a7858` (2026-10-21). That branch is 40 commits ahead of `main` (`18a4d73`, 2026-10-18) and 470 commits past the latest release tag `v1.3.0` (2026-09-27).
- **The downloadable build may differ.** The app version constant is still `1.3.0` (`cbpos/config.py:13`), but much of the code described here, including the LAN Sync data-loss fixes (H1), landed after the `v1.3.0` tag. What is actually published on `ceybyte/cbpos-releases` can't be verified from this repo. Re-check against the next tagged release before publishing claims.
- **Release status:** the owner says `1.3.0` is a pre-release for testing. Every defect in this file is tracked for fixing before the first public build in GitHub #832 (warranty feature: #820). Re-run this audit against that build before publishing claims.
- **Method:** static reading of code, configs, CI and docs. The GUI was not launched. Findings marked "code trace" come from reading the code, not from running it.

## Key findings that affect website copy

1. **Tax maths differs from the public docs, and the code is the one that's right.** SSCL is computed on the **VAT-exclusive** base (`MRP / 1.18 × 50% × 2.5%`), not on gross MRP as `CLAUDE.md`, `docs/TAX.md` and `docs/PROJECT_OVERVIEW.md` state (`cbpos/core/services/tax_service.py:86-94`). Example: on Rs 100 the code gives SSCL Rs 1.06, while TAX.md says Rs 1.25. External research (outside this repo) found that SSCL Act No. 25 of 2022 s.3(3)(b) excludes VAT from SSCL turnover, which supports the code (GitHub #831, #818). Known gap: shops that owe SSCL but are not VAT-registered get zero SSCL (#831). VAT and SSCL are both **off by default** until "Business is VAT Registered" is ticked (`cbpos/core/services/config_service.py:37`). Rounding is banker's rounding (ROUND_HALF_EVEN), not half-up. See C1–C2.
2. **No IRD approval or certification exists in the repo.** Phrases such as "2026 mandate compliant" in `public-releases-readme.md:101` aren't backed by code: the tax-invoice serial format, amount in words and ORIGINAL/DUPLICATE watermark listed in the CHANGELOG are not implemented. See C5.
3. **There is no internet "Cloud Sync".** What exists is (a) a shared-PostgreSQL "Network" database mode on the LAN, and (b) "LAN Sync" between tills and a Main PC over HTTPS with a self-signed, **unverified** certificate. LAN Sync shipped in v1.3.0 with known data-loss bugs. The fixes are not yet released, and the roadmap says it is untested with real shops. See H.
4. **"Works 100% offline" is not strictly true.** The app fetches `https://raw.githubusercontent.com/ceybyte/cbpos-releases/main/latest.json` 3 s after every launch, and there is no setting to turn this off (`main.py:574-583`, `cbpos/core/services/update_service.py:36`). It sends no business data. There is no telemetry, crash upload or online licence check. See A7–A8.
5. **The installer is not code-signed.** Users see a SmartScreen warning. Windows 10+ only, admin install, no portable zip. See A2–A5.
6. **The local database is not encrypted at rest.** Backups are AES-encrypted `.zip` files (pyzipper WZ_AES), created only when a backup password is set. See G1–G2.
7. **The first-run setup wizard is likely skipped on a fresh install (code trace, verified).** `ConfigService.get("language")` at `main.py:361` creates `settings.json` (`cbpos/core/services/config_service.py:323-325`) before the wizard's "settings.json missing" check at `main.py:429`. The default admin login stays `admin` / `1234`. See I1.
8. **Broken or missing features you shouldn't advertise:** "Email receipt" calls a method that doesn't exist (`cbpos/ui/dialogs/receipt_options_dialog.py:246` vs `cbpos/core/services/email_service.py`). There are no expiry dates, batches or serial numbers, and no supplier returns. Scales work only through weight-embedded barcodes, not a direct connection. There is no customer display, and no SMS or WhatsApp receipts.
9. **Licence:** proprietary freeware with a private source repo. There is no EULA, privacy policy or warranty text anywhere. See K.

---

## A. Platform, build & distribution

### A1. Tech stack

- **Language:** Python. `requires-python = ">=3.12"` (`pyproject.toml:5`). CI and release builds pin 3.12 (`.github/workflows/release.yml:19`).
- **UI toolkit:** PyQt6 (Qt 6). Declared as `"PyQt6>=6.7.0"` (`pyproject.toml:9`) and resolved to `6.11.0` in the lockfile (`uv.lock:2063-2064`).
  - Docs disagree: CHANGELOG says "PyQt6 capped below 6.11.0" (`CHANGELOG.md:33`). No cap exists in `pyproject.toml:9`, and the lock resolves exactly 6.11.0.
- **Database:** SQLAlchemy ORM (`pyproject.toml:10`) with Alembic migrations (`pyproject.toml:15`).
  - Default is local SQLite: `DB_URI = sqlite:///<DATA_DIR>/cbpos.db` (`cbpos/config.py:38`).
  - Optional PostgreSQL "network" mode via psycopg2 (`pyproject.toml:11`, `cbpos/core/database.py:46-49`, `cbpos/core/database.py:95-116`).
- **Other notable runtime libraries:**
  - Printing and USB: python-escpos, pyusb
  - Reports and documents: reportlab, xhtml2pdf, pandas, xlsxwriter, openpyxl
  - Security: bcrypt, cryptography; pyzipper for encrypted ZIP backups
  - Icons: qtawesome
  - Windows only: pywin32 (`pyproject.toml:6-27`)
- **Runtime / packaging:** frozen with PyInstaller (`pyproject.toml:43-45`; resolved `6.22.3`, `uv.lock:2014-2015`). The Python runtime is bundled, so end users need no Python install (`public-releases-readme.md:133`).
  - The build is **one-dir**, not one-file: `exclude_binaries=True` (`cbpos.spec:101`) plus `COLLECT(... name='cbpos')` (`cbpos.spec:116-125`). It is a windowed app (`console=False`, `cbpos.spec:107`) with UPX enabled (`cbpos.spec:106`).
  - Docs disagree: repo CLAUDE.md says "Single-file mode (`--onefile`)" and "Output: dist/cbpos.exe". Code: release CI checks `dist/cbpos/cbpos.exe` (`.github/workflows/release.yml:136`), and the installer copies `dist\cbpos\*` (`installer/cbpos.iss:81`).
- **Experimental alternative build:** Nuitka, manual trigger only, "not used for releases", never publishes (`.github/workflows/nuitka-experiment.yml:1-14`).

### A2. Supported Windows versions and architectures

- **Minimum OS (code):** `MinVersion=10.0`, with the comment "Minimum Windows 10" (`installer/cbpos.iss:64-65`). Windows 7 and 8.1 are therefore blocked by the installer. Windows 11 is not named anywhere, but it is ≥10.0, so the installer allows it.
- **Architectures:**
  - `installer/cbpos.iss` has **no** `ArchitecturesAllowed` or `ArchitecturesInstallIn64BitMode` directive (whole file, `installer/cbpos.iss:1-131`).
  - The build runs on `windows-latest` (`.github/workflows/release.yml:83`) with `setup-uv` and `python-version: 3.12` (`.github/workflows/release.yml:107-111`). No architecture is specified, so the runner's default Python is used (assumed x64, but the repo doesn't say).
  - `target_arch=None` (`cbpos.spec:110`).
  - No x86 or ARM64 build or job exists anywhere in `.github/workflows/`.
  - Docs claim "Windows 10 (64-bit) or later" (`public-releases-readme.md:118`) and badge "Windows 10+" (`public-releases-readme.md:15`).
  - **Explicit x86 / ARM64 support: UNKNOWN — not found.**
  - Inno Setup default behaviour (not in repo): without `ArchitecturesInstallIn64BitMode`, setup runs in 32-bit mode, and `{autopf}` resolves to `C:\Program Files (x86)` on 64-bit Windows.
- **Minimum hardware (docs only; nothing in code enforces it):** RAM 4 GB, disk 200 MB, screen 1024 x 768 (`public-releases-readme.md:119-121`). Optional hardware: USB barcode scanner and ESC/POS thermal printer (`public-releases-readme.md:122`).
- **SECURITY.md is stale:** it lists 1.2.x and 1.1.x as supported and does not mention 1.3.x (`SECURITY.md:5-10`).

### A3. Installer technology, file names, size, portable build

- **Technology:** Inno Setup 6 script `installer/cbpos.iss`.
  - Compression is `lzma2/ultra64` with solid compression (`installer/cbpos.iss:52-53`) and a modern wizard (`installer/cbpos.iss:55`).
  - English is the only installer language (`installer/cbpos.iss:72-73`).
  - CI compiles it with `Minionguyjpro/Inno-Setup-Action@v1.2.9` (`.github/workflows/release.yml:176-182`).
- **Output name and location:**
  - Pattern: `OutputDir=..\dist\installer`, `OutputBaseFilename=CBPOSSetup-{#MyAppVersion}` (`installer/cbpos.iss:47-48`).
  - CI produces `CBPOSSetup-<version>.exe` (`.github/workflows/release.yml:104`), for example `CBPOSSetup-1.3.0.exe`.
  - The version comes from `/DMyAppVersion=` (`.github/workflows/release.yml:182`). If not passed, it falls back to `"1.0.0"` (`installer/cbpos.iss:23-25`).
- **Installer metadata:**
  - Publisher: `"Ceylon Byte"`; URL: `https://ceybyte.com`; description: "Free Point of Sale System for Sri Lankan Retail" (`installer/cbpos.iss:26-29`).
  - AppId: `{B7E3F2A1-4D5C-6E8F-9A0B-1C2D3E4F5A6B}` (`installer/cbpos.iss:33`).
- **Installed exe:** `cbpos.exe` inside the install folder (`installer/cbpos.iss:28`, `installer/cbpos.iss:81`).
- **Optional tasks:**
  - Desktop shortcut and "Start CB POS when Windows starts" (`installer/cbpos.iss:75-77`).
  - Start-up shortcut placed in `{userstartup}` (`installer/cbpos.iss:92`).
  - The app launches after install unless the install is silent (`installer/cbpos.iss:96`).
- **Running-app guard:** setup aborts if mutex `CBPOSAppMutex` exists (`installer/cbpos.iss:107-118`). The app creates that mutex at `main.py:335`.
- **Typical size:** **UNKNOWN — not found.** CI only prints the exe size at build time (`.github/workflows/release.yml:137`). The only size figure anywhere is the docs' "Disk Space 200 MB" requirement (`public-releases-readme.md:120`).
- **Portable .zip build:** **None.** No zip or portable step exists in `.github/workflows/release.yml` or `installer/cbpos.iss`. The release publishes only the `.exe` (`.github/workflows/release.yml:233-240`).
  - The Nuitka experiment uploads a raw folder as a 5-day CI artifact. It is not a release (`.github/workflows/nuitka-experiment.yml:86-91`).
  - `create_installer.py` only runs PyInstaller. It does not create an installer or a zip, and it prints a wrong path `dist/cbpos.exe` (`create_installer.py:19-23`).

### A4. Silent/unattended install and install location

- **Silent flags:** the script defines no custom command-line parameters. Standard Inno Setup switches apply.
  - CHANGELOG claims "silent install support (`/SILENT`)" (`CHANGELOG.md:277`).
  - The app's own updater launches the installer with `/SILENT` (`cbpos/ui/dialogs/update_dialog.py:186-187`).
  - `/VERYSILENT`, `/SUPPRESSMSGBOXES`, `/DIR=` and similar are never mentioned in the repo. They are standard Inno Setup switches, but nothing here documents or tests them.
  - In a silent install, the post-install launch is skipped (`skipifsilent`, `installer/cbpos.iss:96`).
- **Privileges and scope:** per-machine, admin required.
  - `PrivilegesRequired=admin` with the comment "Require admin for Program Files install" (`installer/cbpos.iss:60-61`).
  - `DefaultDirName={autopf}\CB POS` (`installer/cbpos.iss:41`).
  - The directory page is hidden (`DisableDirPage=yes`, `installer/cbpos.iss:44`), so users cannot choose a location in the wizard.
  - Upgrades reuse the previous directory (`UsePreviousAppDir=yes`, `installer/cbpos.iss:63`).
- **User data location:** per-user, separate from the install folder.
  - Frozen Windows build uses `%LOCALAPPDATA%\CB POS` (`cbpos/config.py:26-29`); macOS and Linux paths are at `cbpos/config.py:31-33`; dev mode uses the repo root (`cbpos/config.py:36`).
  - The installer only creates `{localappdata}\CB POS` if it is missing and never touches its contents (`installer/cbpos.iss:120-130`, `installer/cbpos.iss:11-16`).
- **Uninstall:** removes only `{app}\__pycache__` beyond the installed files (`installer/cbpos.iss:98-100`). User data in LOCALAPPDATA is not deleted.

### A5. Code signing

- **Not signed.** There is no `SignTool` directive in `installer/cbpos.iss` (whole file, `installer/cbpos.iss:1-131`), and no signtool, certificate or PFX step in any workflow.
  - A grep of `.github`, `installer`, `cbpos.spec`, `scripts` and docs for `signtool|codesign|certificate|pfx|trusted signing` finds only `codesign_identity=None` (`cbpos.spec:111`).
- **CI secrets used:** only `CODECOV_TOKEN` (`.github/workflows/release.yml:73`) and `RELEASES_PAT` (`.github/workflows/release.yml:226`, `.github/workflows/release.yml:230`). No signing secret exists.
- **Docs acknowledge it:** they tell users to bypass SmartScreen ("More info" → "Run anyway") (`public-releases-readme.md:131`).
- **Integrity instead of signing:** a SHA-256 of the installer is computed in CI (`.github/workflows/release.yml:184-191`), published in release notes and `latest.json`, and checked by the in-app updater (`cbpos/core/services/update_service.py:133-143`).

### A6. Release process, versioning, release notes, latest.json

- **Trigger:** pushing a tag `v*.*.*` to the private source repo, or a manual `workflow_dispatch` with a `version` input (`.github/workflows/release.yml:3-13`).
- **Pipeline:**
  1. `test` on ubuntu: ruff lint and format check, pytest with coverage, upload to Codecov (`.github/workflows/release.yml:27-75`).
  2. `build` on windows-latest (`.github/workflows/release.yml:80-198`):
     - Version = tag name without the leading `v` (`:94-105`).
     - The version is regex-stamped into `cbpos/config.py` `VERSION` (`.github/workflows/release.yml:116-128`).
     - PyInstaller build (`:130-131`), then a frozen-exe `--migrate-only` DB migration smoke test (`:142-174`).
     - Inno Setup compile (`:176-182`) and SHA-256 (`:184-191`).
     - Installer uploaded as a 5-day artifact (`:193-198`).
  3. `publish` on ubuntu: clones **public** repo `ceybyte/cbpos-releases` using `RELEASES_PAT` (`.github/workflows/release.yml:224-226`), runs `gh release create "v<ver>"` with the installer attached (`:228-240`), then generates and commits `latest.json` to that repo (`:242-266`). Commits are authored as "CB POS Bot" `bot@ceybyte.com` (`:262-263`).
     - The order is deliberate: the release is created first so `latest.json` never points at a 404 (`.github/workflows/release.yml:200-211`).
- **Public download location:** `https://github.com/ceybyte/cbpos-releases/releases/download/v<ver>/CBPOSSetup-<ver>.exe` (`.github/workflows/release.yml:249`). The Releases page is `https://github.com/ceybyte/cbpos-releases/releases/latest` (`public-releases-readme.md:126`).
- **Version numbering:** `MAJOR.MINOR.PATCH` (tag glob `v*.*.*`, `.github/workflows/release.yml:8`). The app compares versions with PEP 440 `packaging.version.Version` (`cbpos/core/services/update_service.py:30`, `:42-47`).
  - `packaging` is not declared in `pyproject.toml`. It is present only as a transitive lock entry (`uv.lock:1482`).
- **Release notes source:** a **fixed template**, not CHANGELOG. The GitHub Release body is "## CB POS v<ver> / Download and run the installer. Your existing data is preserved automatically. / **SHA-256:** `<hash>`" (`.github/workflows/release.yml:235-239`).
  - `CHANGELOG.md` is maintained by hand in the source repo and is not wired into the pipeline.
  - The generated `latest.json` has `"changelog": ""` (`.github/workflows/release.yml:250`), so the in-app dialog shows no "What's new" section (`cbpos/ui/dialogs/update_dialog.py:117-121`).
- **latest.json as generated by the workflow** (`.github/workflows/release.yml:245-254`):

```json
{
    "version": "${{ needs.build.outputs.version }}",
    "release_date": "$(date -u +%Y-%m-%d)",
    "download_url": "https://github.com/ceybyte/cbpos-releases/releases/download/v${{ needs.build.outputs.version }}/${{ needs.build.outputs.installer_name }}",
    "changelog": "",
    "min_version": "1.0.0",
    "sha256": "${{ needs.build.outputs.sha256 }}"
}
```

- **Template file** `installer/latest.json.template:1-8` (stale example; this file is not used by the workflow):

```json
{
    "version": "1.0.0",
    "release_date": "2026-03-09",
    "download_url": "https://github.com/ceybyte/cbpos-releases/releases/download/v1.0.0/CBPOSSetup-1.0.0.exe",
    "changelog": "Initial release of CB POS - Free Point of Sale for Sri Lankan Retail.",
    "min_version": "1.0.0",
    "sha256": ""
}
```

- **Schema documented in code:** `cbpos/core/services/update_service.py:9-18`. Same six keys.
- **Which fields the app uses:**
  - `version` (`update_service.py:69`)
  - `release_date` and `changelog` (`update_dialog.py:96-97`)
  - `download_url` and `sha256` (`update_dialog.py:152-157`)
  - `min_version` is **never read** by any code (it appears only in the docstring and the workflow).

### A7. Auto-update

- **Yes, the app checks for updates automatically.**
  - **When:** once per launch, 3 s after the main window is shown, on a background thread, silent unless an update exists (`main.py:574-583`, `cbpos/ui/dialogs/update_dialog.py:222-249`).
  - **Manual check:** the "Check for Updates" button in Admin Tools runs a non-silent check (`cbpos/ui/views/admin_tools_view.py:122-125`, `:144-148`).
  - There is no periodic or recurring check.
- **Manifest URL:** `https://raw.githubusercontent.com/ceybyte/cbpos-releases/main/latest.json` (`cbpos/core/services/update_service.py:36`).
- **What the check sends:** a plain HTTPS GET using `urllib`, timeout 15 s (`update_service.py:39`, `:62-63`).
  - The only custom header is `User-Agent: CBPOS-Updater` (`update_service.py:62`).
  - No query params, no app version, no machine ID and no body. The local version is compared client-side (`update_service.py:69-79`).
  - Failures are logged and ignored (`update_service.py:65-67`).
- **Download:** **not automatic.** It starts only when the user clicks "Download & Install" in the update dialog. "Remind me later" closes it (`cbpos/ui/dialogs/update_dialog.py:137-147`, `:151-170`).
  - The installer is fetched from the manifest's `download_url` with the same `User-Agent: CBPOS-Updater` and a 60 s timeout (`update_service.py:102-103`).
  - It is saved to the temp directory as `CBPOSSetup_*.exe` (`update_service.py:110-111`).
  - The SHA-256 is **mandatory** and verified: if it is missing or mismatched, the file is deleted and the update aborts (`update_service.py:133-143`).
- **Install:** on Windows the downloaded installer is launched with `/SILENT` and the app quits so files can be replaced (`update_dialog.py:184-190`).
  - The installer still needs admin (`installer/cbpos.iss:61`), so UAC will prompt.
  - On other platforms the user is told where the file is and must install it manually (`update_dialog.py:191-203`).
- **Can it be disabled?** **No.** There is no setting key. The startup call in `main.py:580-583` is unconditional, and a search for any `ConfigService.get("...update...")` key in `cbpos/` and `main.py` returns nothing. `settings.json.example` has no update key either.
- **Docs disagree with code:** the public README says "CB POS works 100% offline … Internet is only needed to download the installer" (`public-releases-readme.md:189`). The code makes a GitHub request on every launch. When offline, the check fails quietly with no user impact (`update_service.py:65-67`).

### A8. Every outbound network call

**Telemetry, analytics and crash reporting: none.**
- A grep for `sentry|telemetry|analytics|posthog|mixpanel` in `cbpos/` and `main.py` finds nothing.
- The "crash handler" `_report_crash` only writes to the local log and shows a local message box ("Details were saved to the logs folder") (`main.py:75-107`, installed at `main.py:345`). Nothing is uploaded.
- Logs are local rotating files (`CHANGELOG.md:624`).

**Licence check: none over the network.** `LicenseService` is a local stub.
- `validate_license()` always returns False (`cbpos/core/services/license_service.py:19-26`).
- The machine ID is a local SHA-256 of hostname, OS and CPU strings (`license_service.py:8-17`).
- The class is not referenced anywhere outside its own file.

**Every outbound call:**

| # | Host / destination | Purpose | Data sent | Default / can it be disabled? | Citation |
|---|---|---|---|---|---|
| 1 | `raw.githubusercontent.com` (`/ceybyte/cbpos-releases/main/latest.json`) | Update check | HTTPS GET, header `User-Agent: CBPOS-Updater`; client IP is visible to GitHub as with any request | **On at every launch; cannot be disabled** (also runs on the manual button) | `cbpos/core/services/update_service.py:36`, `:62-63`; `main.py:580-583` |
| 2 | `github.com` → release asset (URL from manifest `download_url`, e.g. `github.com/ceybyte/cbpos-releases/releases/download/v<ver>/CBPOSSetup-<ver>.exe`) | Download installer | HTTPS GET, `User-Agent: CBPOS-Updater` | Only when the user clicks "Download & Install" | `update_service.py:102-103`; `update_dialog.py:151-170`; `.github/workflows/release.yml:249` |
| 3 | User-configured SMTP server (`smtp_host`/`smtp_port`, default port 587; a "Use Gmail" button pre-fills `smtp.gmail.com:587`) | Email reports (manual "email report" from Report Viewer) and receipts | SMTP + STARTTLS; login with the user's `smtp_user`/`smtp_pass`; message with subject, body and a PDF attachment (report data) | Off unless SMTP host, user and password are all configured; otherwise it raises "not configured" | `cbpos/core/services/email_service.py:42-68`; `cbpos/ui/workers.py:612-639`; `cbpos/ui/views/reports/report_viewer.py:760`; `cbpos/ui/views/settings_pages/shop_info.py:225-229` |
| 3a | same SMTP server | Automatic daily sales report email (Daily Sales Summary PDF to `admin_email` at `auto_report_time`, default `22:00`; checked by a timer) | Same as #3 | Only if `auto_report_enabled` is true **and** `admin_email` is set | `cbpos/core/services/scheduler_service.py:64-65`, `:93-150` |
| 3b | same SMTP server | "Email receipt" button on the post-checkout dialog | Intended: receipt to the customer's email | **Broken in code:** calls `EmailService.send_receipt(...)` (`cbpos/ui/dialogs/receipt_options_dialog.py:246`), but `EmailService` has no such method (it defines only `send_email` and `send_email_with_pdf`, `email_service.py:102`, `:127`). It would raise AttributeError and send nothing | `receipt_options_dialog.py:112-119`, `:232-248` |
| 4 | LAN: Main PC at `https://<main_pc_address>` (port from settings; server default `5555`) | Multi-terminal LAN sync (Terminal → Main). Endpoints `/sync/register`, `/sync/heartbeat`, `/sync/pull`, `/sync/push` | HTTPS (self-signed cert, **no cert verification**: `check_hostname=False`, `CERT_NONE`); header `X-Sync-Token: <shared secret>`; JSON bodies with business data (sales, stock, catalog, customers, users, audit). Default interval 3 s | Off by default (`terminal_mode` defaults to `standalone`). Needs `terminal_mode=terminal`, `main_pc_address` and `sync_shared_secret` | `main.py:515-565`; `cbpos/infrastructure/sync_client.py:237-240`, `:289-299`; `cbpos/infrastructure/sync_tls.py:1-16`, `:92-99`; `cbpos/infrastructure/sync_server.py:261`, `:273`, `:302`, `:396` |
| 4a | LAN (inbound listener) | Main PC sync server; binds `0.0.0.0:<sync_server_port>` (default 5555) | Serves the endpoints above to terminals | Only when `terminal_mode=main` and a shared secret is set | `main.py:529-542`; `cbpos/infrastructure/sync_server.py:633` |
| 4b | LAN: `https://<address>/sync/heartbeat` | "Test Sync Connection" button | GET with `X-Sync-Token`, timeout 5 s | User action only | `cbpos/ui/workers.py:654-689` |
| 5 | User-configured PostgreSQL server (`network_db_host`, default `localhost:5432`, db `cbpos`, user `postgres`, sslmode `prefer`) | Optional shared-database "network" mode | Full DB traffic (psycopg2) | Off by default (`db_mode` defaults to `standalone`) | `cbpos/core/database.py:46-49`, `:95-116`; `cbpos/ui/views/settings_pages/network.py:713` |
| 6 | Network receipt printer at user-entered IP (raw TCP, default port **9100**) | ESC/POS printing | Print job bytes (receipt content) | Only if the printer type is `NETWORK` | `cbpos/infrastructure/hardware/escpos_driver.py:21`, `:220-228`; `cbpos/core/constants/hardware.py:15` |
| 7 | UDP "connect" to `8.8.8.8:80` / `10.255.255.255:1` | Finds the local LAN IP to display in Network settings and the sync server address | **No packet is sent.** A UDP `connect()` only selects a route (code comment: "Doesn't actually send data") | Runs when the Network settings page is built, or when the server address is requested | `cbpos/ui/views/settings_pages/network.py:131-136`, `:796-804`; `cbpos/infrastructure/sync_server.py:614-624` |

**Things that are NOT network calls:**
- **Fonts:** bundled from `cbpos/assets` (`cbpos.spec:7`). No `fonts.googleapis`, `gstatic` or CDN reference exists in `cbpos/` (grep returned nothing).
- **Maps:** none found.
- **WhatsApp:** `https://wa.me/94771234567` appears only as **placeholder text** for the receipt QR-code content field (`cbpos/i18n/en.json:1764`; same text at `si.json:1734` and `ta.json:1725`). The QR code is printed locally and the app never contacts wa.me.
- **Branding text:** "ceybyte.com" is printed on receipts, invoices and exports (`cbpos/core/services/base_receipt_builder.py:64`, `cbpos/core/services/invoice_service.py:36`, `cbpos/core/services/export_service.py:72`). It is text only, not a request.
- **`QDesktopServices.openUrl`:** used only for a local folder (`QUrl.fromLocalFile`, `cbpos/ui/views/admin_tools_view.py:326`). There is no `webbrowser` use.
- **xhtml2pdf:** renders inline HTML from the export service (`cbpos/core/services/export_service.py:127`). No remote resources were found in that HTML.

**Docs that disagree with the code:**
- "Your data stays on your computer — it is never sent anywhere online" (`public-releases-readme.md:201`). This is true for business data unless the user configures SMTP email (#3) or LAN/PostgreSQL (#4, #5). The update check (#1) sends no business data.
- The public README says multi-terminal uses "Network mode … shared PostgreSQL" (`public-releases-readme.md:204`). Code has both PostgreSQL mode (#5) and the newer HTTPS LAN sync (#4).
- CHANGELOG lists sync endpoints `/sync/pull-catalog`, `/sync/pull-stock`, `/sync/push-transactions` and `/sync/push-audit` (`CHANGELOG.md:53`). The code serves `/sync/pull` and `/sync/push` (`sync_server.py:302`, `:396`).
- The public README says printers are "connected via USB" (`public-releases-readme.md:195`). Code also supports Network (TCP 9100) and Win32Raw printers (`escpos_driver.py:218-228`).

### A9. Current version and latest release date

**Version 1.3.0 is defined in:**
- `cbpos/config.py:13` (`VERSION = "1.3.0"`). This is the runtime source of truth, shown in Admin Tools (`cbpos/ui/views/admin_tools_view.py:118`) and used for the update comparison (`update_service.py:70`). CI overwrites it from the tag at build time (`.github/workflows/release.yml:116-128`).
- `pyproject.toml:3` (`version = "1.3.0"`).
- `docs/conf.py:18` (`release = "1.3.0"`).
- The installer version is injected at build via `/DMyAppVersion`, with fallback `"1.0.0"` (`installer/cbpos.iss:23-25`).

**There is no `__version__` in `cbpos/__init__.py`.**

**Stale version references:**
- `public-releases-readme.md:218`: "Current Version: 1.2.2 (March 2026)".
- `installer/latest.json.template:2`: `"1.0.0"`.
- `SECURITY.md:7-8`: supported versions top out at 1.2.x.

**Release dates:**
- **Git tags** (`git tag`): only `v1.3.0` and `v1.2.2` exist.
  - `v1.3.0`: annotated tag created **2026-09-27 18:35:43 +0530**; tagged commit `19e4227` dated 2026-09-27 18:35:05 +0530.
  - `v1.2.2`: lightweight tag on commit `9e4d9c3` dated 2026-03-11 19:10:05 +0530.
- **CHANGELOG:** `## [1.3.0] - 2026-09-03` (`CHANGELOG.md:48`). This disagrees with the tag date of 2026-09-27. The previous entries are `[1.2.5] - 2026-03-12` (`CHANGELOG.md:73`) and `[1.2.2] - 2026-03-11` (`CHANGELOG.md:143`).
  - 1.2.3, 1.2.4 and 1.2.5 have CHANGELOG entries but no git tags.
  - An `[Unreleased]` section (`CHANGELOG.md:5`) lists work after 1.3.0.
- **Whether the v1.3.0 GitHub Release was actually published to `ceybyte/cbpos-releases`: UNKNOWN — not found** (that is an external repo; not verifiable from this repo).

## B. Cashiering

### B1. Keyboard shortcut map

#### Sales screen (`SalesView.setup_shortcuts`, `cbpos/ui/views/sales_view.py:551-610`)
| Key | Action | Cite |
|---|---|---|
| F1 | Opens the shortcuts help dialog | `cbpos/ui/views/sales_view.py:553-554`, `:1670-1676` |
| F2 | Select customer | `cbpos/ui/views/sales_view.py:571-572` |
| F3 | Advanced product search dialog | `cbpos/ui/views/sales_view.py:568-569` |
| F4 | Change quantity of the selected cart line | `cbpos/ui/views/sales_view.py:565-566`, `:1311-1320` |
| F5 | Payment dialog | `cbpos/ui/views/sales_view.py:556-557` |
| F6 | Hold (park) the bill | `cbpos/ui/views/sales_view.py:559-560`, `:1086` |
| F7 | Recall the most recently held bill | `cbpos/ui/views/sales_view.py:562-563`, `:1106-1108` |
| F8 | Open cash drawer | `cbpos/ui/views/sales_view.py:584-586` |
| F10 | Payment dialog (same as F5) | `cbpos/ui/views/sales_view.py:588-590` |
| F12 | Quick Pay: closes the sale as full cash and skips the payment dialog. Needs setting `quick_pay_enabled` (default True) | `cbpos/ui/views/sales_view.py:592-594`, `:1624-1633`, `cbpos/core/services/config_service.py:52` |
| Ctrl+D | Open cash drawer (same as F8) | `cbpos/ui/views/sales_view.py:596-598` |
| Ctrl+Z | Undo the last removed cart line. The undo toast lasts 4 s | `cbpos/ui/views/sales_view.py:608-610`, `:1405`, `:1426-1440` |
| Ctrl+Alt+C | Opens the operating system's own calculator | `cbpos/ui/views/sales_view.py:165-167`, `:537-539` |
| Delete | Voids the WHOLE in-progress bill (permission `sales.void_item` + confirmation). It does NOT delete a single line | `cbpos/ui/views/sales_view.py:574-575`, `:1132-1162`, `:1263-1266` |
| Enter / keypad Enter | Search, or add the product typed or scanned in the search box | `cbpos/ui/views/sales_view.py:577-582` |
| Page Up / Page Down | Select the first / last cart line | `cbpos/ui/views/sales_view.py:600-606` |

Notes:
- Cart right-click menu has: Add note, Change qty ("F4" shown only as a text hint), Line discount, Change price, Remove item. Only Change qty has a key (`cbpos/ui/views/sales_view.py:1241-1270`).
- The action-panel buttons show these key badges: F2, F3, F4, F6, F7, F8, Del, and F5 on the Pay button (`cbpos/ui/widgets/action_panel.py:298-340`, `:368`).
- The F1 help dialog lists F1–F8, F10, F12, Ctrl+D, PgUp, PgDn, Enter, Delete and Esc (`cbpos/ui/dialogs/shortcuts_help_dialog.py:21-36`). It leaves out Ctrl+Z and Ctrl+Alt+C, which the code does bind.
- F9 and F11 are not bound on the Sales screen. F11 is bound only inside the payment dialog, as the seeded Card shortcut (see below).

#### Global / main window
- Esc leaves fullscreen (only if the window is fullscreen) (`cbpos/ui/main_window.py:132-133`, `:343-346`). Fullscreen is switched on by a side-menu button, not by a key (`cbpos/ui/main_window.py:110`, `:229-236`).
- Barcode scanner: an app-wide event filter catches keystroke bursts that end in Enter (see E4) (`cbpos/ui/main_window.py:40-41`).
- **Doc disagreement:** `docs/PROJECT_OVERVIEW.md:453` says "F11/Escape" toggles fullscreen. No F11 binding for fullscreen exists in code.

#### Login screen
- Number keys (main row or numpad) type into the PIN field, max 6 digits (`cbpos/ui/views/login_view.py:345-352`, `:360`). Enter / keypad Enter logs in (`cbpos/ui/views/login_view.py:240-243`).

#### Payment dialog (`cbpos/ui/dialogs/payment_dialog.py:375-407`)
- Enter / keypad Enter: add the typed amount as a payment line (`:378-379`).
- F12: quick cash. It picks the first method marked `is_cash`, fills in the remaining amount and finishes the sale if the bill is covered (`:382-383`, `:456-473`).
- **Configurable per-method shortcuts:** each payment method can store its own key (`PaymentMethod.shortcut`, `cbpos/core/models/__init__.py:828`). It is set in Settings → Payment Methods with a key-capture field (`cbpos/ui/dialogs/payment_method_dialog.py:150-176`). Return, Enter, F12 and Esc are reserved (`cbpos/core/services/payment_service.py:14`). A stored key that clashes is skipped with a warning (`cbpos/ui/dialogs/payment_dialog.py:385-404`).
- Seeded default: **Card = F11**. No other method has a key (`cbpos/core/services/database_setup_service.py:151-158`, `scripts/seed.py:1685`).
- Esc: UNKNOWN — no explicit binding found. It relies on QDialog's default reject; "esc" is only listed as reserved (`cbpos/core/services/payment_service.py:14`).

#### Other dialogs and screens
- Quantity dialog and Set Item Price dialog: Enter / keypad Enter accepts (`cbpos/ui/dialogs/quantity_dialog.py:75-76`, `cbpos/ui/dialogs/set_item_price_dialog.py:60-61`).
- Advanced Search: Enter selects, Esc closes (`cbpos/ui/dialogs/advanced_search_dialog.py:168-169`).
- Customer selection: Up/Down move through results from the search box; Enter selects (`cbpos/ui/dialogs/customer_selection_dialog.py:61-80`, `:141-142`).
- Log detail: Esc closes (`cbpos/ui/dialogs/log_detail_dialog.py:149`).
- Credit Book: F1 = Receive Payment on the customer detail page (`cbpos/ui/views/credit_book_view.py:411-413`, `:612-615`). Enter in the customer table opens the customer (`:166-169`).
- Enter opens the selected row in these tables: Stock Take history (`cbpos/ui/views/stock_take_view.py:551-554`), Price List (edits the price) (`cbpos/ui/views/pricelist_view.py:260-261`), Admin Tools logs (`cbpos/ui/views/admin_tools_view.py:401-402`), Purchase payable suppliers (`cbpos/ui/views/purchase_view.py:1019-1024`).
- No general user-configurable keymap exists. Only the payment-method keys can be changed.
- `InputManager` is installed (`main.py:388-391`), but it only buffers keystrokes and consumes nothing. Its Enter handling is commented out (`cbpos/infrastructure/input_manager.py:25-43`).

### B2. Payment types

**Built-in method names:** Cash, Card, Credit, QR/Mobile, Cheque, Transfer, plus the internal REFUND marker (`cbpos/core/constants/status.py:55-64`).

**Seeded methods:**
- "Start Fresh" database: Cash (`is_cash`, `open_drawer`), Card (shortcut F11), Credit, QR/Mobile, Cheque, **"Bank Transfer"** (`cbpos/core/services/database_setup_service.py:151-158`).
- Demo database (`scripts/seed.py`): the same list, except the last one is named **"Transfer"** (`scripts/seed.py:1684-1689`).
- Naming mismatch: the shift summary looks for the name "Transfer" (`cbpos/core/services/shift_service.py:131`, `cbpos/core/constants/status.py:63`). On a fresh database, "Bank Transfer" sales are therefore missing from the shift's `transfer_sales` figure, though they still count in `sales_by_method` and `total_sales` (`cbpos/core/services/shift_service.py:122-132`).

**Split payment:** yes. The payment dialog adds several payment lines, each with its own method and amount (`cbpos/ui/dialogs/payment_dialog.py:37`, `:599-644`). It shows the amount remaining or the change due, and Finish stays disabled until the bill is covered (`:724-745`).

**Credit / customer account ("Credit Book"):**
- Choosing the method named "Credit" requires picking a customer (`cbpos/ui/dialogs/payment_dialog.py:620-633`).
- At sale time the code checks the customer's credit limit and adds the amount to their debt (`cbpos/core/services/transaction_service.py:213-227`).
- `default_credit_limit` = 0 for new customers, meaning no credit until a limit is set (`cbpos/core/services/config_service.py:111`).

**Loyalty points:**
- Points can be redeemed in the payment dialog as a rupee discount. This needs a customer attached and setting `enable_loyalty` (default True) (`cbpos/ui/dialogs/payment_dialog.py:475-570`, `cbpos/core/services/config_service.py:78`).
- Settings: `loyalty_points_ratio` = 100 (rupees spent per point earned) and `loyalty_point_value` = 1.0 (`cbpos/core/services/config_service.py:113-114`, `cbpos/core/services/loyalty_service.py:23-38`).
- Customers have a loyalty card code. Scanning it in Sales attaches that customer (`cbpos/core/models/__init__.py:442`, `cbpos/ui/views/sales_view.py:732`).
- Quirk: the minimum-redeem check reads the key `loyalty_minimum_redeem` (`cbpos/core/services/loyalty_service.py:113`, `cbpos/ui/dialogs/payment_dialog.py:558`). Settings saves `loyalty_min_redeem_points` instead (`cbpos/ui/views/settings_pages/sales_tax.py:372`, `cbpos/core/services/config_service.py:115`). So the configured minimum looks like it is not applied (it falls back to 0).

**Custom payment methods:** yes. Shops can create, edit and deactivate methods in Settings → Payment Methods (`cbpos/ui/views/settings_view.py:160`).
- Each method has a name, `is_cash`, `open_drawer` and `shortcut` (`cbpos/core/models/__init__.py:819-830`, `cbpos/core/services/payment_service.py:207-254`).
- A method that has been used is deactivated rather than deleted (`cbpos/core/services/payment_service.py:331-351`).
- **Doc disagreement:** `CLAUDE.md:133` lists Payment Methods as a Management tab. In code it lives in Settings.

**Not found:** gift cards or vouchers as a payment method, and any card-terminal, payment-gateway or LankaQR integration. UNKNOWN — not found in code (grep for voucher/gift card/terminal/LankaQR). "Voucher" in the code means only the printed refund voucher (`cbpos/core/services/transaction_service.py:592`). Card, QR, cheque and transfer are recorded as labels only; no external processing was found.

### B3. Returns, holds, discounts, price overrides, voids

**Refunds:**
- Refunds are full-sale only: "Process a full refund for a previous sale" (`cbpos/core/services/transaction_service.py:656-664`).
- The refund copies the original sale with negative amounts (`:708`). It blocks voided sales, refunds of refunds, and sales already refunded (`:690`, `:696`).
- It restores stock, reverses any credit and loyalty, and auto-prints a refund voucher (`cbpos/infrastructure/hardware/print_worker_peripherals.py:50-57`).
- Permission `sales.refund` (or a manager override) is required, plus a reason. This applies from the Refund dialog (`cbpos/ui/dialogs/refund_dialog.py:241-283`) and from Sale History (`cbpos/ui/dialogs/sale_history_dialog.py:814`).
- No item-level or partial refund in the UI or TransactionService. UNKNOWN — not found. The credit service can handle partial amounts (`cbpos/core/services/customer_credit_service.py:189-195`), but nothing calls it that way.

**Hold / park and recall:**
- F6 holds the bill, F7 recalls the latest one (`cbpos/ui/views/sales_view.py:1086-1130`).
- Held bills are saved in the database table `suspended_transactions` as JSON (`cbpos/core/models/__init__.py:668-679`).
- Several held bills can be open at once and appear as tabs in the order bar; switching tabs holds the current cart and recalls the chosen one (`cbpos/ui/widgets/order_bar.py:20`, `:113`).
- Only barcode, quantity and customer are saved (`cbpos/core/services/suspended_transaction_service.py:34-41`). On recall, products are re-added at current pricing (`:86-92`), so line discounts, price overrides and notes are not kept.
- No permission check on hold or recall.

**Discounts:**
- Line discount, % or fixed amount: permission `sales.discount` (`cbpos/ui/views/sales_view.py:1322-1350`, `cbpos/ui/dialogs/discount_dialog.py:201-231`). Capped by `max_discount_percent` (default 15%; 0 means no cap). Fixed amounts are converted to a % before checking the cap (`cbpos/core/services/cart_service.py:178-207`, `cbpos/core/services/config_service.py:54`). Each line discount is written to the audit log (`cbpos/core/services/cart_service.py:124-130`).
- Bill-level discount, % or fixed: exists in the service (`cbpos/core/services/cart_service.py:132-137`), but no UI calls it. It is used only in tests (`cbpos/tests/test_cart_math.py:110`).
- Automatic promotions (PERCENTAGE, FIXED_AMOUNT, BOGO, by category or store-wide) and price lists also exist (`cbpos/core/models/__init__.py:125-136`).
- Loyalty redemption works as a discount (see B2).

**Price override:**
- Permission `sales.change_price` (`cbpos/ui/views/sales_view.py:1352-1380`).
- Blocked per product when `price_change_allowed` = False (`cbpos/core/services/cart_service.py:139-176`). Written to the audit log as PRICE_OVERRIDE.

**Voids:**
- Line removal (right-click → Remove item): permission `sales.void_item`, with a 4-second Ctrl+Z undo (`cbpos/ui/views/sales_view.py:1382-1405`).
- Bill void of the in-progress cart (Delete key): permission `sales.void_item` + confirmation. Logged as VOID_BILL (`cbpos/ui/views/sales_view.py:1132-1162`).
- Voiding a completed sale (Documents screen): permission `documents.void` plus the Void Reason dialog (`cbpos/ui/views/document_view.py:985-1018`). The reason is mandatory when `require_void_reason` is on (default True) (`cbpos/core/services/config_service.py:53`). This reverses stock, credit and loyalty (`cbpos/core/services/transaction_service.py:524-586`).
- Seeded void reasons: MISTAKE, RETURN, DAMAGED, CHANGED_MIND, ACCIDENTAL, MANAGER (`cbpos/core/services/database_setup_service.py:140-147`, `scripts/seed.py:137-142`).

**Manager override:**
- When the current user lacks a permission, a dialog asks for the PIN of another user who has it (`cbpos/core/utils/permission_helper.py:36-64`, `cbpos/ui/dialogs/manager_override_dialog.py:57-75`, `main.py:487-496`).
- The default Cashier role lacks void, discount, change-price and refund, so those actions prompt for an override.

### B4. Users, roles, shifts, cash drawer counts

**Login:**
- PIN only, with no username field. The PIN is checked against every active user (`cbpos/core/services/auth_service.py:139-168`).
- PINs are 4–6 digits (`cbpos/ui/dialogs/user_dialog.py:105`, `cbpos/ui/dialogs/setup_wizard.py:245-251`) and stored as bcrypt hashes (`cbpos/core/services/auth_service.py:55-63`).
- Lockout after `max_login_attempts` (default 5) for `lockout_duration_seconds` (default 300) (`cbpos/core/services/config_service.py:108-109`, `cbpos/core/services/auth_service.py:93-106`).
- Optional auto-logout after inactivity, `session_timeout_minutes` (0 = off) (`cbpos/core/services/config_service.py:107`, `cbpos/ui/main_window.py:49-51`).
- Default admin is `admin`/1234. The first-run wizard sets a new admin PIN (`cbpos/core/services/database_setup_service.py:136`, `cbpos/ui/dialogs/setup_wizard.py:336`).

**Default roles** (`cbpos/core/services/database_setup_service.py:103-130`; same in `scripts/seed.py:88-114`):

| Role | Permissions |
|---|---|
| Admin (access level 9) | All permissions |
| Manager (5) | Groups: Sales, Inventory, Reports, Documents, Credit, Loyalty, Purchase, Stock Take, Cash, Screens. No Admin or Data Safety |
| Cashier (1) | `sales.view`, `sales.add_item`, `documents.view`, `credit.receive_payment`, `cash.open_drawer` |

- Full permission list: `cbpos/core/constants/permissions.py:12-72`.
- Custom roles can be managed with `admin.manage_roles` (`cbpos/ui/views/user_view.py:403-414`).
- Demo users: admin/1234, manager/5678, cashier/0000, nimal/1111 (`scripts/seed.py:123-126`).

**Shifts:**
- A shift must be open before using Sales. On login, a mandatory dialog asks for the opening float (`cbpos/ui/main_window.py:181-185`, `cbpos/ui/dialogs/start_shift_dialog.py:16`).
- Shift record fields: `starting_cash`, `expected_cash`, `actual_cash`, status OPEN/CLOSED, terminal (`cbpos/core/models/__init__.py:629-646`).

**Cash movements:**
- Cash In and Cash Out from the Shift dialog need `cash.open_drawer` (`cbpos/ui/dialogs/shift_management_dialog.py:226-236`).
- The model also has DROP and PAYOUT types (`cbpos/core/models/__init__.py:658`).

**Denomination counting:**
- Used both for the opening float and for closing (`cbpos/ui/dialogs/start_shift_dialog.py:48`, `cbpos/ui/dialogs/shift_closing_dialog.py:68`).
- Default denominations are [5000, 1000, 500, 100, 50, 20], or the config key `currency_denominations` (`cbpos/ui/widgets/denomination_widget.py:36-41`).

**X / Z reports:**
- X-Read: the open-shift figures can be printed while the shift stays open (`cbpos/ui/dialogs/shift_management_dialog.py:52`, `:136-142`).
- Z-Report: printed when the shift is closed (`cbpos/ui/dialogs/shift_closing_dialog.py:191-195`, `cbpos/core/services/printer_service.py:114`).

**Expected vs counted:**
- Expected cash = float + cash sales + cash-ins − drops − payouts (`cbpos/core/services/shift_service.py:145`). Cash sales come from the method named "Cash" (`:126`).
- At close: variance = counted − expected (`cbpos/core/services/shift_service.py:226-238`). A reason is required when the variance is not zero (`cbpos/ui/dialogs/shift_closing_dialog.py:168`).
- The summary also includes sales by method, void count and value, transaction count, and VAT/SSCL (`cbpos/core/services/shift_service.py:91-202`).
- Ending a shift logs the cashier out (`cbpos/ui/views/sales_view.py:1560-1580`).

## C. Tax

### C1. VAT calculation

**Where it lives:** `TaxService.calculate_taxes()` in `cbpos/core/services/tax_service.py:40-105`.

**Formula: backward from the MRP (tax-inclusive) amount.**
- `vat_liable_base = tax_base_mrp / (1 + vat_rate)` (`cbpos/core/services/tax_service.py:86`)
- `vat_amount = tax_base_mrp - vat_liable_base` (`cbpos/core/services/tax_service.py:87`)
- `vat_rate = tax_vat_rate / 100`, converted through `Decimal(str(...))`, so floats are not used (`cbpos/core/services/tax_service.py:27,33`).
- At the default 18% this works out to `base = MRP / 1.18`, which matches the CLAUDE.md formula (`CLAUDE.md:247-248`).

**Per bill, not per line.**
- `CartService.get_totals()` adds up the line totals (`cbpos/core/services/cart_service.py:322`). It then subtracts the cart discount (`:325-333`) and the loyalty redemption (`:336-343`), and calls `calculate_taxes()` once on the final post-discount bill total (`cbpos/core/services/cart_service.py:366-369`).
- The `Sale` gets those three bill-level figures (`cbpos/core/services/transaction_service.py:367-373`). They are stored only at bill level in `Sale.tax_vat`, `Sale.tax_sscl` and `Sale.net_revenue`, each `Numeric(12,2)` (`cbpos/core/models/__init__.py:198-200`). `SaleItem` has no tax column (`cbpos/core/models/__init__.py:494-512`).
- Doc disagreement: `docs/Roadmap.md:380` says "Tax Breakdown Display: Line-by-line tax amounts" is done. The code has no per-line tax.

**Rounding and precision.**
- Results are quantized to `Precision.MONEY = Decimal("0.01")` (`cbpos/core/constants/status.py:70`; applied at `cbpos/core/services/tax_service.py:101-104`).
- No rounding mode is given and the code never sets a decimal context. A repo-wide search for `getcontext`, `setcontext` or `localcontext` in `cbpos/`, `main.py` and `scripts/` finds nothing. So Python's default applies, which is **ROUND_HALF_EVEN (banker's rounding), not ROUND_HALF_UP**. For example, 0.125 becomes 0.12. Other parts of the app do use ROUND_HALF_UP explicitly, such as user input parsing (`cbpos/core/utils/formatters.py:67`, `cbpos/ui/dialogs/cash_movement_dialog.py:88`), but the tax path does not.
- VAT, SSCL and net are each rounded separately from unrounded intermediates (`cbpos/core/services/tax_service.py:98-104`). Nothing forces rounded net + VAT + SSCL to add back to the total. That is a property of the code, not an observed bug.
- Line totals are quantized to 0.01 before they are summed (`cbpos/core/services/cart_service.py:227-228`).

**Rate is configurable; default 18%.**
- Settings default: `"tax_vat_rate": 18.0` (`cbpos/core/services/config_service.py:38`). The fallback in TaxService is also 18.0 (`cbpos/core/services/tax_service.py:27`).
- UI: Settings › Sales & Tax › Tax tab uses an **integer** `QSpinBox`, range 0-100% (`cbpos/ui/views/settings_pages/sales_tax.py:84-89`), saved as `tax_vat_rate` (`:365`). Fractional VAT rates cannot be entered in the UI.
- Rate changes are written to the audit log (`TAX_AUDIT_KEYS`, `cbpos/core/services/settings_audit_service.py:18`). The UI warns "Changing these values affects ALL future sales immediately" (`cbpos/i18n/en.json:1610`).

**VAT can be turned off, and it is OFF by default.**
- `"vat_registered": False` is the default (`cbpos/core/services/config_service.py:37`). If it is not set, `calculate_taxes()` returns VAT = SSCL = 0 and net = total (`cbpos/core/services/tax_service.py:63-69`). `TaxService.is_vat_active()` is the single switch (`:14-16`).
- UI checkbox "Business is VAT Registered" (`cbpos/ui/views/settings_pages/sales_tax.py:71-73`; label `cbpos/i18n/en.json:1607`). The hint reads "Enable if turnover exceeds the VAT threshold. When disabled, sales are non-taxable." (`cbpos/i18n/en.json:1609`).
- Doc disagreement: `README.md:31` and `public-releases-readme.md:100` say "Built-in VAT (18%) and SSCL (2.5%)" with no mention that both are off until the shop turns on VAT registration.

**Shown on receipts only behind settings.**
- Thermal sales receipt: the VAT / SSCL / "NET TOTAL" lines (plus Taxable / Tax Exempt when there is an exempt amount) print only if `show_tax_breakdown` is on AND (VAT is active OR the sale has stored tax) (`cbpos/core/services/sales_receipt_builder.py:184-206`). `show_tax_breakdown` defaults to `False` (`cbpos/core/services/config_service.py:48`). It is the "show tax" checkbox in Settings › Receipt (`cbpos/ui/views/settings_pages/receipt.py:256,496,529`). Void and refund receipts follow the same rule (`cbpos/core/services/void_receipt_builder.py:62`, `cbpos/core/services/refund_receipt_builder.py:106`).
- The "NET TOTAL:" label (`cbpos/i18n/en.json:2003`) prints `sale.net_revenue`, which is MRP − VAT − SSCL (`cbpos/core/services/sales_receipt_builder.py:203-205`).
- The shop TIN (`company_tax_id`) prints on the thermal receipt whenever it is set (`cbpos/core/services/base_receipt_builder.py:154-157`). The shop VAT number (`vat_number`) is **not** on the thermal receipt. It appears only on the A4 invoice (below).
- A4 invoice PDF (`InvoiceService.generate_pdf`, `cbpos/core/services/invoice_service.py:252-310`): titled "TAX INVOICE" when VAT is active or the sale carried tax, otherwise "INVOICE" (`:247-249,278`; strings `cbpos/i18n/en.json:2935-2936`). It shows the shop TIN, and the shop VAT Reg. No. only on a tax invoice (`cbpos/core/services/invoice_service.py:320-323`). It shows the buyer's TIN and VAT No. if recorded (`:367-370`). Below the total it lists "Prices include taxes:", "Value excl. taxes" (= `net_revenue`), "VAT (x%)" and "SSCL (x%)" (`:440-450`; strings `cbpos/i18n/en.json:2954-2957`).
  - The % shown on the invoice is the **current** configured rate (`cbpos/core/services/invoice_service.py:448-450`). The amounts are the ones stored at sale time. After a rate change, a reprint would show the new % next to the old amount.
  - When the A4 invoice is produced: it auto-prints only if the customer has a `vat_number` AND an A4 printer is configured (`cbpos/core/services/printer_service.py:135-146,161-164`). Otherwise it is produced on demand via "Save as PDF" (`cbpos/ui/dialogs/receipt_options_dialog.py:259-269`).
- On-screen cart: when VAT is active, a Tax line shows (VAT/SSCL split if `show_tax_breakdown` is on) (`cbpos/ui/views/sales_view.py:928-945`).
- Doc disagreement: `docs/Roadmap.md:282` lists "Tax Breakdown Display: Show VAT and SSCL separately on receipt" as not done. The code does it, behind the setting.

**Refunds and quotes.**
- A refund copies the original sale's VAT/SSCL/net, negated, rather than recalculating (`cbpos/core/services/transaction_service.py:706-718`). Refunds are whole-sale only: a sale that has already been refunded is rejected (`:695-698`).
- Proforma/quotation tax is `calculate_taxes(total)` with no exemption split (`cbpos/core/services/proforma_service.py:58-59`).

### C2. SSCL calculation

**Implemented: yes.** `cbpos/core/services/tax_service.py:92-94`.

**Formula in code:** `sscl = (vat_liable_base × turnover_pct) × sscl_rate` (`cbpos/core/services/tax_service.py:94`). Defaults: `tax_sscl_rate` 2.5, `tax_sscl_turnover_pct` 50.0 (`cbpos/core/services/config_service.py:39-40`; fallbacks at `cbpos/core/services/tax_service.py:28-29`).
- **Base is net of VAT** (`vat_liable_base = MRP/(1+VAT)`), not gross MRP. The docstring says so ("SSCL Liability = (VAT Liable Base * Turnover%) * SSCL Rate", `cbpos/core/services/tax_service.py:50`; comment at `:93`).
- It uses only the taxable portion. Exempt amounts are left out of SSCL as well as VAT (`cbpos/core/services/tax_service.py:72-77,86,94`).
- SSCL is computed only when `vat_registered` is on (`cbpos/core/services/tax_service.py:63`). There is no separate SSCL on/off switch. Setting the SSCL rate to 0% is the only way to keep VAT and drop SSCL.

**Charged on bills or only reported?** The customer is not charged anything extra. SSCL is backed out of the MRP total: `net_revenue = total_mrp − vat − sscl` (`cbpos/core/services/tax_service.py:98`), and the bill total stays `final_total` (`cbpos/core/services/cart_service.py:376`). The SSCL amount is stored on each sale (`cbpos/core/models/__init__.py:199`). It is displayed on receipts and invoices only per C1's settings, and it is summed in the reports (C4).

**Configurable:** yes. SSCL rate is a `QDoubleSpinBox` with 2 decimals, 0-100% (`cbpos/ui/views/settings_pages/sales_tax.py:91-98`). Turnover base is a `QDoubleSpinBox` with 1 decimal, 0-100% (`:101-115`). Both are greyed out while VAT is unregistered (`:272-289`).

**Docs disagree with code (important for legal copy):**
- `CLAUDE.md:251-252`: `sscl_liability = (total_mrp * 0.5) * 0.025`, which is on **gross MRP**.
- `docs/PROJECT_OVERVIEW.md:806-807`: same gross-MRP formula.
- `docs/archive/PRD.md:59`: "SSCL Payable = (Turnover * 50%) * 2.5%".
- `docs/TAX.md:50-52`: worked example for Rs 100 gives SSCL 1.25 and net 83.50 (gross basis). The code gives SSCL **1.06** and net **83.69** for the same Rs 100, because 100/1.18 = 84.7458, × 0.5 × 0.025 = 1.0593 → 1.06.
- Within the code, the Tax Filing Summary report shows "Liable Turnover (50%)" as `net_sales × 0.5` on **gross MRP, hard-coded at 50%** (`cbpos/core/reports/definitions/financial_reports.py:322,386`). But it reports "SSCL Liability" as the sum of stored per-sale SSCL, which is on the VAT-exclusive base at the configured turnover % (`:323,392`). The two lines on that report use different bases.

### C3. Exempt / zero-rated items and non-VAT mode

**Non-VAT-registered shop mode: supported, and it is the default.** See C1. `vat_registered=False` zeroes VAT and SSCL (`cbpos/core/services/tax_service.py:63-69`; default `cbpos/core/services/config_service.py:37`). Tax UI is hidden: cart tax labels (`cbpos/ui/views/sales_view.py:928-930`), dashboard "Tax Today" panel (`cbpos/ui/views/dashboard_view.py:572`), and the VAT-only reports (`cbpos/ui/views/reports/report_viewer.py:441,474`).

**Exemptions are per category, not per product, and sit behind a second setting.**
- Flag: `Category.tax_exempt` boolean (`cbpos/core/models/__init__.py:333`; migration `alembic/versions/d1af69d5c525_add_tax_exempt_to_category.py`). A product is exempt if its **own** category has the flag (`cbpos/core/services/cart_service.py:254-287`). The code does not inherit the flag from a parent category.
- It is only used when the `item_tax_exemptions` setting is on (`cbpos/core/services/cart_service.py:347`). The checkbox is "Enable item-level tax exemptions" (`cbpos/ui/views/settings_pages/sales_tax.py:123-124,325,368`; `cbpos/i18n/en.json:1621`). It is off unless ticked (`cbpos/ui/views/settings_pages/sales_tax.py:325`). It is not in `ConfigService.DEFAULTS`.
- Mechanics: lines are split into taxable and exempt subtotals. Bill and loyalty discounts are spread across them proportionally. Tax is computed only on the taxable part (`cbpos/core/services/cart_service.py:346-369`; `cbpos/core/services/tax_service.py:72-77`).
- **No product-level tax flag, no tax categories or codes, no per-product rates.** Product has no tax field (`cbpos/core/models/__init__.py:341-380`). Searches for `zero_rated`, `tax_category`, `tax_code` and `tax_rate_id` return nothing. Per-product and multi-tax support was removed on purpose (`docs/Roadmap.md:285`).
- **Zero-rated vs exempt: no distinction.** Only "exempt" exists. The A4 invoice labels the portion "VAT-exempt sales" (`cbpos/i18n/en.json:2959`).
- **Gap: there is no UI or service path to set `Category.tax_exempt`.**
  - `CategoryService.create()` and `update()` do not accept it (`cbpos/core/services/category_service.py:209-282`).
  - The category dialogs (`category_dialog.py`, `category_manager.py`, `category_tree_dialog.py`) never mention it.
  - The only place it is written is the demo seed: "Pharmacy" `tax_exempt=True` (`scripts/seed.py:189`).
  - Yet the in-app guide tells users "In Category Manager, mark essential categories ... as tax-exempt" (`cbpos/i18n/en.json:1626`). On a fresh (non-demo) database, exemptions can't be set up from the UI.
- The exempt amount is not saved on the sale. It is attached to `sale._exempt_amount` only temporarily for the first receipt (`cbpos/core/services/transaction_service.py:354-356,381`). Reprints and later reports cannot show the taxable/exempt split.
- Doc claims: `public-releases-readme.md:102` says "Tax-exempt categories (pharmaceuticals, essentials)". `CHANGELOG.md:214` says "Per-category VAT exemption". Both are true only in the limited sense above.
- `docs/Roadmap.md:283`, "Tax-Exempt Sales: Support with permission", is unchecked. There is no whole-sale exemption or permission.

**Input VAT (purchases):** `Purchase.input_vat` is typed in by hand per GRN from the supplier's invoice. It is not calculated (`cbpos/core/models/__init__.py:228-230`; `cbpos/core/services/purchase_service.py:62,73-76,152`; UI field `cbpos/ui/views/purchase_view.py:398-402`).

### C4. Tax reports

All reports are registered in `cbpos/core/reports/__init__.py:20-71`. The tax-specific ones are in category "financial" and carry `requires_vat = True`, so they are **hidden while VAT registration is off** (`cbpos/core/reports/definitions/financial_reports.py:108,217`; filtering at `cbpos/ui/views/reports/report_viewer.py:441,474`).

**1. "Tax Liability Report"** (`id tax_liability`; name `cbpos/i18n/en.json:1392`; class `cbpos/core/reports/definitions/financial_reports.py:105-211`)
- Period: free date range only (`:125-127`).
- Columns: Date, Invoice #, Total Sale, Net Revenue, VAT, SSCL, Total Tax. A final row shows Output VAT − Input VAT = Net VAT Liability (`:173-209`).
- It uses stored per-sale values and does not recalculate (`:154-158`).
- Caveats from code:
  - Column headers are hard-coded "VAT (18%)" / "SSCL (2.5%)" whatever the configured rates (`:138-139,182-183`).
  - The sales query has **no status filter**, so voided sales are included (`:165-170`). `void_sale` sets `status="VOID"` but leaves `tax_vat` in place (`cbpos/core/services/transaction_service.py:546-551`).

**2. "Tax Filing Summary"** (`id tax_filing_summary`; name `cbpos/i18n/en.json:1393`; class `cbpos/core/reports/definitions/financial_reports.py:214-411`; docstring: "for filing VAT/SSCL returns with Inland Revenue", `:215`)
- It excludes voided sales and subtracts refunds (`:283-314`).
- Rows: Total Sales (MRP), Total Discounts, Total Refunds, Net Sales, number of sales and refunds, VAT Base, VAT Liability, SSCL Liable Turnover (50%), SSCL Liability, Total Tax Liability, then a payment-method breakdown (`:343-411`).
- Caveats:
  - "Total Discounts" is always 0 (`:319`).
  - "Liable Turnover (50%)" is hard-coded 50% of gross net sales (`:322`); see C2.
  - The "Period" combo (Monthly / Quarterly / Custom, `:236-249`) is **not wired up**. `generate()` reads only `date_range` (`:269-272`), and the filter widget just returns the combo value (`cbpos/ui/views/reports/filter_widget.py:124-125`). The user has to set the dates by hand whatever is picked.

**Related, not tax-specific:**
- "Profit & Loss" (`cbpos/core/reports/definitions/financial_reports.py:13-102`) uses **MRP unit price (VAT-inclusive) as revenue**, current product cost as COGS, and `float` arithmetic (`:62-89`). This contradicts `docs/TAX.md:63`, which says P&L "must use the Net Revenue".
- Dashboard "Tax Today" panel, shown only when VAT is active (`cbpos/ui/views/dashboard_view.py:572`).

**Export formats:**
- Report viewer: **Excel (.xlsx) and PDF**, plus Print (`cbpos/ui/views/reports/report_viewer.py:632,649,698`). Implemented with pandas/xlsxwriter and xhtml2pdf (`cbpos/core/services/export_service.py:31-37,83-130`).
- **CSV** exists in `ExportService.export_to_csv` (`cbpos/core/services/export_service.py:76-81`). The report viewer does not offer it; it is offered only from the Data Safety data-export dialog (`cbpos/ui/dialogs/data_export_dialog.py:226-230`).

### C5. IRD / compliance wording

**In app UI (`cbpos/i18n/en.json`):**
- `:1614` "Inland Revenue SSCL liable base percentage (default 50%)."
- `:1616-1617` "Inland Revenue Standard" / "The Inland Revenue Department sets liable turnover at 50% for standard goods and services."
- `:1619` "Only adjust this rate if explicitly instructed by your tax accountant or auditor."
- `:1631` "Ensure exempt categories comply with Inland Revenue regulations."
- `:2935` "TAX INVOICE"; `:2939-2940` "TIN" / "VAT Reg. No."; `:378`, `:1982` "TIN"; `:613` "VAT registration number (optional)"; `:2007` "This is a quotation, not a tax invoice."
- Sinhala and Tamil carry the same keys, e.g. `cbpos/i18n/si.json:1587,1601,2935` and `cbpos/i18n/ta.json:1592,1604,2919`.
- Searching `cbpos/i18n/*.json` for the standalone token "IRD" finds nothing. **No app string says the software is IRD-approved, certified or compliant.**

**In code comments:**
- `cbpos/core/reports/definitions/financial_reports.py:215` "for filing VAT/SSCL returns with Inland Revenue".
- `cbpos/core/utils/amount_to_words.py:2,108` "for tax invoice compliance". That utility is defined at `:89` but **is not called anywhere** in `cbpos/` or `scripts/`.

**In docs (marketing-style claims, none backed by any approval artifact in the repo):**
- `public-releases-readme.md:99` "Sri Lankan Tax Compliance"; `:101` "Tax invoice generation (2026 mandate compliant)"; `:224` "VAT & SSCL tax compliance".
- `README.md:28,31` "Security & Compliance" / "Sri Lankan Tax Compliance".
- `PRODUCT.md:17,21,57` "tax compliance", "Sri Lanka-specific tax compliance handled correctly out of the box", "Correct-by-default compliance".
- `docs/archive/PRD.md:22,47` "Compliance-Ready", "SRI LANKAN COMPLIANCE & TAX MODULE"; `docs/Roadmap.md:272` "Sri Lankan Compliance Module (Tax) — Mostly Complete".
- `CHANGELOG.md:211-221` "Added — Tax Compliance", and `:339` "Receipt content — Sri Lanka compliance".
- **IRD approval / certification: UNKNOWN — not found.** No document, certificate or reference number appears anywhere.

**Changelog vs code (tax invoice):** `CHANGELOG.md:215` describes a `generate_tax_invoice()` with a "YYMMM_QQQQ_XXXX serial number", "amount in words" and "ORIGINAL/DUPLICATE watermarks". The current code has **no `generate_tax_invoice`** and no YYMMM serial format. The A4 invoice uses the normal document number, default format `INV-{Y}-{seq:05d}` (`cbpos/core/services/document_service.py:25`; used at `cbpos/core/services/invoice_service.py:305,330`). It prints no amount in words (the utility is unused) and has no ORIGINAL/DUPLICATE watermark. A "DUPLICATE" marker exists only on reprinted thermal receipts (`cbpos/core/services/printer_service.py:82,101`). The "2026 mandate compliant" claim (`public-releases-readme.md:101`) should not be repeated as fact.

## D. Products & inventory

### D1. AVCO costing

**Implemented only on GRN commit.** `PurchaseService.commit_purchase()` (`cbpos/core/services/purchase_service.py:61-189`):
- Formula: `new_cost = (old_qty × old_cost + qty_received × unit_cost) / (old_qty + qty_received)` (`cbpos/core/services/purchase_service.py:128-136`).
- Applied only `if total_qty > 0` (`:134`). Quantized to 0.01 with default (half-even) rounding into `Product.cost`, which is `Numeric(12,2)` (`:136`; `cbpos/core/models/__init__.py:357`).
- If stock was negative before receipt, `old_qty` is negative and still goes into the formula (`:122-133`). The code has no special handling for this.
- The same transaction writes a PURCHASE `StockMovement` (`:139-148`).

**When cost is NOT recalculated:**
- Sales, voids and refunds/returns never touch `cost`. `transaction_service.py` has no reference to `cost` at all.
- Stock-take adjustments change quantity only (`cbpos/core/services/stock_count_service.py:372-382`).
- Manual edits: the product editor lets the user overwrite `cost` (and `stock_qty`) directly, which bypasses AVCO (`cbpos/ui/dialogs/product_editor.py:626-627`; applied by `InventoryService.update_product`, `cbpos/core/services/inventory_service.py:78-117`).
- CSV import can also set cost (`cbpos/core/services/import_service.py:116`).
- There is no GRN void or reversal (no void path in `purchase_service.py`), so a wrong cost cannot be undone by reversing the GRN.

**Historical cost is not kept per sale.** `SaleItem` has no cost column (`cbpos/core/models/__init__.py:494-512`). The P&L uses the *current* product cost (`cbpos/core/reports/definitions/financial_reports.py:51-56`). Stock-count variance value uses current cost (`cbpos/core/services/stock_count_service.py:215,338`).

Docs: CLAUDE.md says "Costing Method: Weighted Average Cost (AVCO)" (`CLAUDE.md:256`). This holds only for GRN receipts, as above.

### D2. Weighed goods

- **Quantity precision: 3 decimals.** `Numeric(10,3)` on `Product.stock_qty`, `SaleItem.qty`, `PurchaseItem.qty_received` and `StockMovement.qty_change` (`cbpos/core/models/__init__.py:358,502,536,569`). `Precision.QUANTITY = 0.001` (`cbpos/core/constants/status.py:71`). Display decimals come from the unit, capped at 3 (`cbpos/core/utils/formatters.py:73-85`).
- **Seeded units** (fresh DB and demo DB are identical): Piece/pcs (0 decimals), Kilogram/kg (3), Gram/g (0), Liter/L (3), Meter/m (2), Pack/pk (0), Box/box (0), Dozen/dz (0) (`cbpos/core/services/database_setup_service.py:164-171`; `scripts/seed.py:165-172`).
- Custom units can be added with their own decimal places (`UnitService.create(name, abbreviation, decimal_places)`, `cbpos/core/services/unit_service.py:42`; Unit Manager dialog opened from Inventory, `cbpos/ui/views/inventory_view.py:280-282`).
- **Product flag:** `Product.is_weighted` (`cbpos/core/models/__init__.py:359`), a "weighted item" checkbox in the product editor (`cbpos/ui/dialogs/product_editor.py:284,632`). It is used to choose 3-decimal counting in stock take and PO checks (`cbpos/ui/views/stock_take_view.py:207-218`; `cbpos/core/services/purchase_order_service.py:189`).

**How weight gets in:**
1. **Typed.** The Quantity dialog opens when a product is added via search or scan (`cbpos/ui/views/sales_view.py:756,1450`). It accepts 0.001-999999 with up to 3 decimals (`cbpos/ui/dialogs/quantity_dialog.py:54`).
2. **Scale-printed barcode label (weight-embedded EAN-13).** `ScaleService.parse_barcode()` reads `PP IIIII WWWWW C` (`cbpos/core/services/scale_service.py:9-24,27-81`):
   - Default prefix "20". Default 3 decimals, so `WWWWW` 06780 means 6.780 (`:17-18,73-76`).
   - The EAN-13 check digit is validated (`:84-111`).
   - The 5-digit `IIIII` is matched against the product's **internal ID ("Item Code")**, not its barcode (`cbpos/ui/views/sales_view.py:777-805`; CODE search is by `Product.id`, `cbpos/core/services/product_service.py:50-52`).
   - A product whose real barcode equals the scanned code takes precedence (`cbpos/ui/views/sales_view.py:793`).
   - Prefix and decimals are set in Settings › Hardware (`cbpos/ui/views/settings_pages/hardware.py:383-384,418-419`; defaults `cbpos/core/services/config_service.py:68-69`).
   - **Only weight is embedded, not price.** The class docstring says "price-embedded" (`cbpos/core/services/scale_service.py:6`), but the parsed field is always used as quantity (`:78`).
3. **Direct scale connection (serial/USB live weight): UNKNOWN — not found.** `cbpos/infrastructure/hardware/` contains only `escpos_driver.py`, `print_worker_peripherals.py`, `scanner.py` and `text_raster.py`, with no scale driver.

### D3. Barcodes and labels

**Scanning:**
- Keyboard-wedge (HID) scanners only. A global key-event filter treats a burst of at least 3 characters followed by Enter as a scan (`cbpos/infrastructure/hardware/scanner.py:5-15`). That makes scanning symbology-agnostic: whatever text the scanner types is looked up.
- `Product.barcode` is a unique, required string of up to 50 characters (`cbpos/core/models/__init__.py:352`).
- Optional "Auto-Select on Barcode Match" picks the exact match among several results (`cbpos/ui/views/sales_view.py:745-752`; default on, `cbpos/core/services/config_service.py:80`).
- Specific symbology validation: none found (no barcode validators in `cbpos/core/utils/`).

**Internal and in-store barcodes:**
- **Auto-generated in-store EAN-13 with prefix "29"**: `29` + 10-digit zero-padded product ID + check digit (`cbpos/core/services/inventory_service.py:23,30-43`). This applies to new products saved without a barcode when "auto_generate_barcodes" is on (default True; `cbpos/core/services/inventory_service.py:51-63`; `cbpos/core/services/config_service.py:76`).
- **Scale (weight-embedded) EAN-13 with prefix "20"**, configurable; see D2. No other 20-29 prefix handling was found.

**Barcodes printed by the app:**
- Product labels: **CODE128** (`cbpos/core/services/label_service.py:22-31`).
- Sales receipt: the invoice number as **CODE39** (when `show_barcode` is on) and an optional **QR** code (`cbpos/core/services/sales_receipt_builder.py:227-235`). Config default for `show_barcode` is `False` (`cbpos/core/services/config_service.py:47`).
- The ESC/POS driver prints QR via `printer.qr` and every 1-D type via `python-escpos` `printer.barcode(code, type, function_type="B")` (`cbpos/infrastructure/hardware/escpos_driver.py:334-348`).

**Label printing:**
- Entry: Inventory › Print Labels (`cbpos/ui/views/inventory_view.py:287-289`; `cbpos/ui/dialogs/label_print_dialog.py:86`). You choose products and quantities and they go out as one batch (`cbpos/core/services/label_service.py:55-76`).
- **Fixed layout:** product name (English) / CODE128 barcode / barcode text / price / feed / **cut** (`cbpos/core/services/label_service.py:24-36`). No templates, no label-size setting (no `label_size`, `label_width` or `label_printer` keys found), no Sinhala/Tamil name option.
- **Printer: the same ESC/POS receipt printer**, sent as a `print_commands` job (`cbpos/ui/dialogs/label_print_dialog.py:426-443`; `cbpos/infrastructure/hardware/escpos_driver.py:23-25`). Connection types are WIN32 / NETWORK / USB (`cbpos/core/services/config_service.py:41-42`). There is no ZPL, TSPL, EPL or sheet-label (A4) output.
- The preview dialog draws a mock that "mimics a 50x30mm thermal label" (`cbpos/ui/dialogs/label_preview_dialog.py:25`). Its bars are a hash-based imitation, not a real CODE128 encoding (`:30-37`).

### D4. Expiry dates, batches, serial numbers

- **Expiry dates on products or stock: not supported.** The only `expiry_date` column is on `Proforma`, the quote validity date (`cbpos/core/models/__init__.py:276`). No product, stock or purchase-item expiry field exists (`cbpos/core/models/__init__.py:341-380,528-543`).
- **Batches / lots: not supported.** No batch or lot model or column exists. Searches for `batch_no`, `lot_no` and `lot_number` find nothing in `cbpos/core`, and no migration adds one. "batch" in the code means print or bulk batches (e.g. `cbpos/core/services/label_service.py:55`).
- **Serial numbers / IMEI: not supported.** Searches for `serial_no`, `serial_number` and `imei` find nothing.

### D5. Suppliers, POs, GRN, payables, adjustments, stock take

Management screen tabs include Purchase (index 2), Stock Take (index 9) and Reorder (index 10) (`cbpos/ui/views/management_view.py:260-292`).

| Feature | Exists? | Evidence |
|---|---|---|
| Suppliers (CRUD, deactivate) | Yes | Model: company, contact, phone, email, address, `tax_number`, `current_payable`, `payment_terms` in days (`cbpos/core/models/__init__.py:471-491`); service (`cbpos/core/services/supplier_service.py:18-151`); Purchase › Suppliers tab (`cbpos/ui/views/purchase_view.py:265,679-716`) |
| Purchase Orders | Yes, created from Reorder suggestions | `PurchaseOrder` model (`cbpos/core/models/__init__.py:242-262`); `create_purchase_order` with status "ORDERED" (`cbpos/core/services/purchase_order_service.py:18-50`); "Create Purchase Order" button in Reorder view (`cbpos/ui/views/reorder_view.py:97,181,233`). No standalone PO editor or PO print was found. |
| GRN / goods receiving | Yes | `Purchase` = GRN (`cbpos/core/models/__init__.py:220-239`). The GRN tab commits via `create_purchase` then `commit_purchase` (`cbpos/ui/views/purchase_view.py:307,862,911-925`). Commit updates stock, AVCO cost, StockMovement and supplier payable (`cbpos/core/services/purchase_service.py:61-189`). |
| Partial receipt against PO | Yes | `qty_received` tracked per PO line. Status becomes RECEIVED or PARTIALLY_RECEIVED (`cbpos/core/services/purchase_service.py:103,155-160`). Over/under/not-on-order/not-received differences are reported for confirmation but never block the GRN (`cbpos/core/services/purchase_order_service.py:91-110`; used at `cbpos/ui/views/purchase_view.py:896`). |
| Supplier payables | Yes | Ledger with entry types PURCHASE / PAYMENT / ADJUSTMENT (`cbpos/core/models/__init__.py:798-816`); payments (`cbpos/core/services/supplier_payable_service.py:20`; `cbpos/ui/dialogs/supplier_payment_dialog.py:181`); balance adjustments (`cbpos/core/services/supplier_payable_service.py:133`; `cbpos/ui/views/purchase_view.py:1520`); Payables tab (`cbpos/ui/views/purchase_view.py:948`). `get_overdue_suppliers()` exists (`cbpos/core/services/supplier_payable_service.py:218`) but has no UI caller. |
| Supplier returns / debit notes | **No: UNKNOWN — not found.** | No return-to-supplier, purchase-return or debit-note code or i18n. No GRN void/reversal (only a VOID status filter in history, `cbpos/ui/views/purchase_view.py:560`). |
| Input VAT on GRN | Yes, typed by hand | See C3 (`cbpos/core/services/purchase_service.py:62,152`). |
| Stock adjustments (ad hoc) | **Partial / effectively unreachable** | `InventoryService.adjust_stock()` writes `InventoryLog` + `AuditLog`, but **not** a `StockMovement` (`cbpos/core/services/inventory_service.py:136-173`). Its only caller, `StockAdjustmentDialog`, calls it as `InventoryService.adjust_stock(self.product.id, change, reason)` (`cbpos/ui/dialogs/stock_adjustment_dialog.py:104`). That is an instance method needing `user_id`, so the signature doesn't match, and nothing in `cbpos/` opens the dialog. In practice stock is changed by editing `stock_qty` in the product editor, which records no movement (`cbpos/ui/dialogs/product_editor.py:610,627`), or by stock take. |
| Stock take | Yes | `StockCount` / `StockCountItem` documents (`cbpos/core/models/__init__.py:746-776`). Flow: create (`cbpos/core/services/stock_count_service.py:61`) → add all products or one category (`:91`) or single items (`:147`) → enter or increment counts (`:192,224`) → finalize to COUNTED, which requires every line counted and computes variance at current cost (`:300-352`) → approve & apply, writing an ADJUSTMENT `StockMovement` per variance (`:355-397`). DRAFT or COUNTED counts can be voided (`:399-424`). UI: `cbpos/ui/views/stock_take_view.py`. It applies the variance captured at finalize time, not "set to counted". |
| Reorder suggestions | Yes | Items with `stock_qty <= reorder_point` (`cbpos/ui/views/reorder_view.py:36,125`). |
| Negative stock | Blocked by default | `allow_negative_stock` default False, enforced in `StockService._execute_movement` (`cbpos/core/services/config_service.py:75`; `cbpos/core/services/stock_service.py:89-99`). |
| Stock movement audit trail | Yes, with gaps | Types SALE, PURCHASE, ADJUSTMENT, RETURN, VOID (`cbpos/core/constants/status.py:45-52`; `cbpos/core/models/__init__.py:560-578`). Product-editor stock edits and `adjust_stock()` do not create movements (above). |

## E. Hardware

### E1. Receipt printers

**Protocol:** ESC/POS through `python-escpos` (`pyproject.toml:13`, `cbpos/infrastructure/hardware/escpos_driver.py:156-163`).

**Connection types** (`cbpos/core/constants/hardware.py:10-18`, `cbpos/infrastructure/hardware/escpos_driver.py:210-236`):
- **WIN32:** raw ESC/POS through the Windows print spooler, by Windows printer name. Uses `escpos.printer.Win32Raw` and needs pywin32 (`pyproject.toml:26`, `escpos_driver.py:219`).
- **NETWORK:** raw TCP to an IP address, default port 9100 (`IP:port` allowed), 5 s timeout (`escpos_driver.py:20-21`, `:224-229`).
- **USB:** direct by VID:PID through `escpos.printer.Usb`/pyusb. Needs a WinUSB driver on Windows (`cbpos/core/constants/hardware.py:16`, `cbpos/i18n/en.json:1711`).
- **NONE:** the default (`cbpos/core/services/config_service.py:41-42`).
- **Serial and Bluetooth:** not supported. UNKNOWN — not found (no serial or Bluetooth code). A Bluetooth printer installed as a Windows printer might work through WIN32, but nothing in the code or docs says so.

**Paper width:** 58 mm or 80 mm (default 80 mm), chosen in Settings → Hardware and in the setup wizard (`cbpos/core/services/config_service.py:60`, `cbpos/ui/views/settings_pages/hardware.py:91`, `cbpos/ui/dialogs/setup_wizard.py:128-130`).
- Line widths: 32 characters (58 mm) or 42 characters (80 mm) (`cbpos/core/services/base_receipt_builder.py:124-125`).
- Image widths: 384 dots (58 mm) or 576 dots (80 mm) (`cbpos/core/utils/thermal_image.py:14`).

**Other printer settings:**
- Auto-print, number of copies, auto-cut on/off (for tear-bar printers), partial or full cut, and 1–8 feed lines before the cut (`cbpos/core/services/config_service.py:59-64`, `cbpos/ui/views/settings_pages/hardware.py:166-173`).
- Optional logo (dithered for thermal printing), barcode or QR on the receipt (`cbpos/infrastructure/hardware/escpos_driver.py:320-345`, `cbpos/core/services/config_service.py:94-95`).
- Test Print and Test Drawer buttons (`cbpos/core/services/hardware_test_service.py:122-152`).

**A4 tax invoice** for VAT-registered customers:
- Generated as a PDF and sent via PowerShell `Start-Process -Verb Print` (`cbpos/core/services/printer_service.py:136-213`).
- Observation: the configured `a4_printer_name` is validated but never passed to the print command. Windows would therefore use the default printer for PDFs (`:203-213`).

**Barcode labels:** sent to the same thermal printer as ESC/POS commands (CODE128) (`cbpos/core/services/label_service.py:1-30`).

**Specific models:** none named or tested. UNKNOWN — not found. "epson" appears only as an invalid-input string in tests (`tests/unit/test_receipt_printer_windows_connection.py:93`).

**Doc disagreements:**
- `public-releases-readme.md:78` says "no drivers to install", and `:195` says "connected via USB". In code, WIN32 needs a printer installed in Windows, direct USB needs a WinUSB driver, and NETWORK is also supported.
- `public-releases-readme.md:159` says to set up the printer in "Settings > Receipt Settings". In code the printer is configured on Settings → Hardware (`cbpos/ui/views/settings_pages/hardware.py:1`).
- `docs/PROJECT_OVERVIEW.md:600-604` and `:905-910` mention a "MockPrinter" (the code has `NullPrinter`, `escpos_driver.py:123`), leave out WIN32, and give drawer pin 2 only.

### E2. Sinhala/Tamil printing

- **Method: bitmap.** A text line containing Sinhala (U+0D80–0DFF) or Tamil (U+0B80–0BFF) characters is drawn as a 1-bit image and sent with `printer.image()`. English lines stay as plain ESC/POS text (`cbpos/core/utils/text_scripts.py:4-9`, `cbpos/infrastructure/hardware/escpos_driver.py:309-319`).
- Why: printer code pages print these scripts as "?" (`cbpos/infrastructure/hardware/text_raster.py:1-9`).
- **Rendering:**
  - Qt draws the text with `QPainter` into a grayscale `QImage` the full paper width (384 or 576 dots), about 24 px high and shrunk to a minimum of 14 px if the line is too long (`cbpos/infrastructure/hardware/text_raster.py:27-30`, `:42-91`).
  - Pillow then thresholds it to 1-bit (`:89-91`).
  - Qt does the script shaping; Pillow is used only for the conversion.
  - This runs on the print worker thread.
- **No printer code page** is used for Sinhala or Tamil.
- **Fonts:** bundled Noto Sans Sinhala, Noto Sans Tamil and Noto Sans, in Regular/Medium/SemiBold/Bold (`cbpos/assets/fonts/Noto_Sans_Sinhala/static/*.ttf`, `Noto_Sans_Tamil/static/*.ttf`, `Noto_Sans/static/*.ttf`). They are registered at startup (`cbpos/infrastructure/resource_loader.py:28-58`), and the rasterizer uses the families `["Noto Sans Sinhala", "Noto Sans Tamil", "Noto Sans"]` (`text_raster.py:27`).
- **A4 PDFs:** the same Qt rendering produces PNG images, because ReportLab cannot shape these scripts (`text_raster.py:97-148`).
- **Receipt language** can differ from the screen language (setting `receipt_language`) (`cbpos/ui/views/settings_pages/receipt.py:534`, `cbpos/core/services/base_receipt_builder.py:43-49`).
- Caveat in code: "Glyph output still needs checking on the shop's real printer" (`escpos_driver.py:288-291`).

### E3. Scales

- **No live scale connection.** No serial, RS-232 or USB scale protocol and no brand support exists. UNKNOWN — not found (no pyserial; grep turns up nothing). This is confirmed by `docs/Roadmap.md:164-166`: "no live serial connection exists — only embedded-barcode weight parsing".
- **What is supported: weight-embedded EAN-13 labels** printed by a label scale, in the format `PP IIIII WWWWW C` (`cbpos/core/services/scale_service.py:4-14`, `:26-80`):
  - prefix, default "20", 2 digits;
  - 5-digit item code, matched to the product's Item Code;
  - 5-digit weight;
  - EAN-13 checksum is validated.
- Scanning a label adds the item at the printed weight (`cbpos/ui/views/sales_view.py:777-806`).
- The prefix and decimal places (default 3) are set in Settings → Hardware → Weighing Scale (`cbpos/ui/views/settings_pages/hardware.py:202-214`, `:403-405`; `cbpos/core/services/config_service.py:68-69`).
- Reading mode: on demand, per scanned label. Continuous reading is not applicable.
- Price-embedded labels are UNKNOWN — not found. The parser treats the 5 digits as weight only.
- **Doc disagreement:** `CLAUDE.md:412` says pyusb is used for "scanner, scale". The code has no pyusb use for either: no `import usb` in `cbpos/`. pyusb is only used by python-escpos's USB printer.
- Units: Kilogram, Liter and Meter allow 3/3/2 decimal places for weighed items (`cbpos/core/services/database_setup_service.py:164-170`).

### E4. Scanners, cash drawers, customer displays

**Barcode scanners:**
- HID keyboard-wedge only. A global Qt event filter treats keystrokes less than 50 ms apart, ending in Enter and at least 3 characters long, as a scan (`cbpos/infrastructure/hardware/scanner.py:5-15`, `:35-84`).
- When a text field has focus, the field handles the scan itself (`:86-101`).
- The scan goes to the active screen (`cbpos/ui/main_window.py:40-41`, `:198`).
- Serial or USB-POS scanner modes: UNKNOWN — not found.
- Docs say "USB HID (keyboard emulation)" (`docs/PROJECT_OVERVIEW.md:912-914`).

**Cash drawer:**
- Opened through the receipt printer with the ESC/POS kick `printer.cashdraw(pin)`. Pin 2 or 5 (default 2) is set in Settings → Hardware (`cbpos/infrastructure/hardware/escpos_driver.py:367-376`, `cbpos/core/constants/hardware.py:21-22`, `cbpos/ui/views/settings_pages/hardware.py:131-133`). No separate drawer interface exists.
- With no printer configured, the drawer is never kicked (`escpos_driver.py:508-512`).
- After a sale, the receipt prints first and then the drawer opens (`cbpos/infrastructure/hardware/print_worker_peripherals.py:37-48`).
- With `drawer_on_cash_only` (default True, a checkbox in Settings), the drawer opens only if a payment's method name is "CASH" (any case) (`escpos_driver.py:459-470`, `cbpos/ui/views/settings_pages/hardware.py:393`).
- The per-method `open_drawer` flag is stored and edited, but the worker's kick decision does not read it (only the name check above).
- Observation: F8 / Ctrl+D send a kick job with no payment data (`cbpos/ui/views/sales_view.py:1584-1590`). Under the default `drawer_on_cash_only` = True, the worker skips such a job ("no payment methods provided", `escpos_driver.py:463-466`). The manual open is also not gated by `cash.open_drawer` in Sales.
- The Settings and Admin Tools test buttons use their own drawer test path (`cbpos/core/services/hardware_test_service.py:136`).

**Customer / pole display:** not implemented. UNKNOWN — not found in code. `docs/Roadmap.md:167-168` says "Customer Display Interface: not implemented — no secondary-screen output … see #498". The VFD pole display is still an unchecked item (`docs/archive/PRD.md:127`).

### E5. Hardware compatibility list

**No compatibility list of models, brands or tested devices exists anywhere in the repo.** UNKNOWN — not found. A grep for Epson, Xprinter, TM-T, Star, Bixolon, Citizen, Rongta, Gprinter, Honeywell, Zebra, CAS, DIGI, Mettler and similar names finds no model mentions in code or docs.

Generic hardware statements in docs:
- `README.md:24`: "Native support for ESC/POS thermal printers and USB barcode scanners".
- `PRODUCT.md:28`: ESC/POS, 58 mm/80 mm.
- `public-releases-readme.md:118-122`: Windows 10 64-bit; optional hardware is a USB barcode scanner and an ESC/POS thermal printer.
- `public-releases-readme.md:195`: "Any ESC/POS compatible thermal receipt printer connected via USB. Most 58mm and 80mm thermal printers sold in Sri Lanka work out of the box." This is a claim only; the repo has no test evidence for it.
- `docs/PROJECT_OVERVIEW.md:903-921` (Hardware Support section): USB VID:PID and network printers, drawer pin 2, USB HID scanners, scale barcode format. It is outdated against the code (no WIN32, no pin 5; see E1).
- `docs/Roadmap.md:155-168`: only `IPrinter` is a formal interface; the scale and customer-display interfaces are not built.

## F. Languages & receipts

### F1. UI languages and how the language is chosen

**Languages:** English (`en`), Sinhala (`si`) and Tamil (`ta`). There are no others.
- `SUPPORTED_LANGUAGES = ("en", "si", "ta")`: `cbpos/i18n/translation_service.py:23`. Any other code falls back to `en`: `cbpos/i18n/translation_service.py:87-89`.
- The picker labels come from `LanguageService.get_available_languages()`, which returns `{"en": "English", "si": "Sinhala", "ta": "Tamil"}`: `cbpos/core/services/language_service.py` (last method in the file).
- Lookup order: current language, then English, then the raw key: `cbpos/i18n/translation_service.py:113`.
- Bundled fonts: `cbpos/assets/fonts/{Noto_Sans, Noto_Sans_Sinhala, Noto_Sans_Tamil}`.

**How the language is chosen:**
- **Setup wizard: no language step.** The wizard's fields are shop info, hardware and admin PIN only (`cbpos/ui/dialogs/setup_wizard.py:71-170`). It saves no `language` key (`cbpos/ui/dialogs/setup_wizard.py:312-328`).
- **Default is English:** `"language": "en"` (`cbpos/core/services/config_service.py:43`). It is applied at startup with `set_language(saved_language)` (`main.py:361-362`).
- **Settings:** Settings → Shop Info → Appearance tab → "Language" combo (`cbpos/ui/views/settings_pages/shop_info.py:144-149`, tab label `shop_info.py:172`). It is saved as `"language"` (`shop_info.py:302`). Saving settings requires the `ADMIN_SETTINGS` permission or a manager override (`cbpos/ui/views/settings_view.py:466`).
- **No live switch in practice. A restart is required.** Changing the language sets `restart_required` (`cbpos/ui/views/settings_view.py:526-532`). A code comment says theme, language and font size are "only saved here, never applied live … They apply at the next launch" (`settings_view.py:523-525`, issue #581). The user is asked "Restart now / Later" in both the old and the new language (`settings_view.py:561-591`). The UI hint says the same thing: "language changes apply after CB POS restarts" (`cbpos/i18n/en.json:1578`).
  - The live-switch plumbing is still there (`register_language_callback`, `cbpos/i18n/__init__.py:74`), but Settings never calls it on save.
  - **Docs disagree with the code:** `README.md:37` ("Live Language Switching: Change language without restarting"), `public-releases-readme.md:84` ("Switch language instantly, no restart needed") and `docs/PROJECT_OVERVIEW.md:945` all claim live switching.
- **Per terminal:** in PostgreSQL "network" DB mode, `language` is a per-terminal key (`cbpos/core/services/config_service.py:149-163`). In standalone or LAN-Sync mode each PC has its own `settings.json` (`config_service.py:26`).

**Completeness (counted by flattening the JSON files):**

| File | Leaf keys | Missing vs en | Values identical to English |
|---|---|---|---|
| `cbpos/i18n/en.json` | 2,789 | — | — |
| `cbpos/i18n/si.json` | 2,789 | 0 | 58 (mostly brand names and format strings, e.g. `common.cb_pos`, `common.website`, `setup_wizard.paper_80mm`) |
| `cbpos/i18n/ta.json` | 2,773 | **16** | 61 |

- The 16 Tamil keys missing today are all new sales-history and reprint strings: `receipt_reprint.filter_{today,yesterday,this_week,this_month}`, `receipt_reprint.preview_title`, `receipt_reprint.select_to_preview`, and `sale_history.{change,copied,copied_to_clipboard,copy_invoice_tooltip,discount,grand_total,sales_found,subtotal,tax,tendered}`. They fall back to English at runtime (`translation_service.py:113`).
- **Docs disagree on the counts:** `docs/PROJECT_OVERVIEW.md:932-933,949` says "2,090 keys, 97%+ translated". `CHANGELOG.md` [Unreleased] says "2,090/2,090 keys match". Both are stale; the real count is 2,789.

### F2. Receipt language, layout, logo, header/footer and branding

**Receipt language is per installation (per PC), not per bill.**
- Setting: Settings → Receipt → "Receipt language" combo. Options are "Same as UI language" (empty value), English, සිංහල (Sinhala) and தமிழ் (Tamil) (`cbpos/ui/views/settings_pages/receipt.py:218-222`). It is saved as `receipt_language` (`receipt.py:534`).
- The builder reads it once per receipt; if empty, it uses the UI language (`cbpos/core/services/base_receipt_builder.py:35-49`). Receipt strings use `translate_in(lang, "receipt_strings.*")` (`base_receipt_builder.py:43`).
- **No per-bill language choice was found.** The post-sale dialog offers only Preview, Print, Email and Save PDF (`cbpos/ui/dialogs/receipt_options_dialog.py:150-159`).
- `receipt_language` is **not** in the per-terminal key list (`config_service.py:149-163`). On a shared PostgreSQL setup it is therefore one global value; in standalone or LAN-Sync mode each PC's `settings.json` holds its own.
- **Caveat: item names on thermal receipts are always English.** The sales, void and refund builders print `item.product.name_en` whatever the receipt language (`cbpos/core/services/sales_receipt_builder.py:119`, `void_receipt_builder.py:93`, `refund_receipt_builder.py:67`). Products do store Sinhala and Tamil names (`cbpos/core/models/__init__.py:354-355`), and the **A4 invoice** uses them (`cbpos/core/services/invoice_service.py:216`).
- **Printing Sinhala/Tamil on thermal printers:** ESC/POS has no code page for these scripts, so any line containing Sinhala or Tamil is drawn as an image with the bundled Noto fonts (`cbpos/infrastructure/hardware/escpos_driver.py:287-291,310-315`; `cbpos/infrastructure/hardware/text_raster.py:1-15`). The code itself says glyph output "still needs checking on the shop's real printer" (`escpos_driver.py:289-291`).

**Layout options:**

| Option | Values / default | Where in Settings | Evidence |
|---|---|---|---|
| Paper width | `80mm` (default) or `58mm`. Gives 42 or 32 characters per line | Hardware; also the setup wizard | `hardware.py:91`; `config_service.py:60`; `base_receipt_builder.py:125`; `setup_wizard.py:128-130` |
| Copies | 1–5, default 1 | Hardware | `hardware.py:109`; `config_service.py:59`; `printer_service.py:40` |
| Auto print after sale | default on | Hardware | `config_service.py:61`; `hardware.py:416` |
| Auto cut / cut type / feed lines before cut | on; `partial` or `full`; 1–8 lines (default 3) | Hardware | `hardware.py:171,420-422`; `config_service.py:62-64`; `base_receipt_builder.py:67-75` |
| Show barcode (CODE39 of the invoice number) | default **off** | Receipt | `config_service.py:47`; `sales_receipt_builder.py:227-229` |
| Merge duplicate items | default off | Receipt | `config_service.py:49`; `sales_receipt_builder.py:115` |
| Tax breakdown (taxable / exempt / VAT / SSCL) | default off; only prints when VAT is active or the sale has stored tax | Receipt | `config_service.py:48`; `sales_receipt_builder.py:185-201` |
| QR code (shop-entered link, e.g. WhatsApp or website) | default off | Receipt | `config_service.py:94-95`; `sales_receipt_builder.py:232-235` |
| Cashier name / terminal ID | default off / off | Receipt | `config_service.py:92-93`; `sales_receipt_builder.py:87-99` |
| Loyalty points block | on (needs loyalty enabled) | Sales & Tax page | `config_service.py:116`; `settings_pages/sales_tax.py:373`; `sales_receipt_builder.py:222,290-296` |
| Post-sale receipt dialog | default off | System | `config_service.py:91`; `cbpos/ui/views/sales_view.py:1619-1620` |

- Note: `sales_receipt_builder.py:87` and `:227` use a fallback of `True`, but `ConfigService.get` returns the default of `False` first (`config_service.py:449-450`). So both are effectively **off** until the shop turns them on.

**Header, footer and logo:**
- **Header text** (free text, top of receipt, wrapped to paper width). Default "Welcome to Ceylon Byte" (`config_service.py:44`; `base_receipt_builder.py:129-132`).
- **Footer text.** Default "Thank You! Come Again." (`config_service.py:45`; `base_receipt_builder.py:103-115`).
- **Shop identity block** printed from Shop Info: shop name (bold), address, phone and TIN (`base_receipt_builder.py:141-157`).
- **Logo:**
  - Picked with Browse or cleared on the Receipt page (`receipt.py:146-155,465`).
  - Copied into the data folder as `assets/receipt_logo.<ext>` and stored as a relative path, so it travels with backups (`cbpos/core/services/receipt_logo_service.py:1-9,29-44`).
  - Printed as an image, resized to 384 dots (58mm) or 576 dots (80mm) and dithered (`cbpos/core/utils/thermal_image.py:14-32`; `escpos_driver.py:322-332`).
  - The **A4 invoice does not print the logo**: there is no "logo" anywhere in `cbpos/core/services/invoice_service.py`.
- **Reprints** add a "duplicate" marker (`sales_receipt_builder.py:241-242`).

**Branding line (always on, cannot be turned off):**
- Every thermal receipt ends with the English lines **"Powered by CB POS"** and **"ceybyte.com"** (`base_receipt_builder.py:60-64`). This applies to sale, void, refund, proforma, statement and shift-report slips (`sales_receipt_builder.py:245`, `void_receipt_builder.py:104`, `refund_receipt_builder.py:128`, `proforma_receipt_builder.py:107`, `statement_receipt_builder.py:106`, `shift_report_builder.py:94`).
- No setting to disable it was found.

### F3. Other localised outputs

| Output | Exists? | Language | Evidence / caveats |
|---|---|---|---|
| A4 Tax Invoice PDF (ReportLab) | Yes. Printed to the configured A4 printer, or via "Save PDF" in the post-sale dialog | Receipt language, else UI language. Item names localised | `invoice_service.py:167-169,216,270-273`; `printer_service.py:150-170`; `receipt_options_dialog.py:258-270`. Sinhala/Tamil text drawn as images (`text_raster.py:14-15`, `invoice_service.py:118-121`). Footer "Powered by CB POS — ceybyte.com" in English (`invoice_service.py:36,154-160`) |
| Thermal slips (sale, void, refund, proforma, customer statement, shift report) | Yes | Receipt language (see F2) | builders listed in F2 |
| Reports (on screen, 11 definition files in `cbpos/core/reports/definitions/`) | Yes | Titles and categories via `_t()` = **UI language** | `cbpos/core/reports/base_report.py:35-36`; e.g. `definitions/audit_reports.py:23` |
| Report export to PDF (xhtml2pdf) | Yes | Title in UI language. "Generated on" label translated | `cbpos/core/services/export_service.py:83-127`. Uses only `font-family: Helvetica` (`export_service.py:99`) and not the Sinhala/Tamil image workaround, while the code notes ReportLab "can't shape Sinhala or Tamil" (`text_raster.py:14-15`). **Sinhala/Tamil output in report PDFs is likely broken (not verified).** Table headers are the raw DataFrame column names (`export_service.py:90`) |
| Report / data export to Excel or CSV | Yes (Data Safety → Export: products, customers, sales; also report export) | Data as stored | `cbpos/ui/views/data_safety/export_types.py:74-75`; `cbpos/core/services/data_export_service.py:25,61,87`. Excel has an English "Powered by CB POS — ceybyte.com" footer (`export_service.py:72`) |
| Email: report as PDF attachment | Yes (report viewer → Email). Needs SMTP settings (Shop Info → Email tab) | Subject and body in **UI language** | `cbpos/ui/views/reports/report_viewer.py:745-766`; `cbpos/ui/workers.py:612-628`; SMTP with STARTTLS `cbpos/core/services/email_service.py:43-67` |
| Email: automatic daily sales report | Yes, behind `auto_report_enabled` (default off) at `auto_report_time` (default 22:00) | **English only** (hard-coded subject, body and PDF title) | `config_service.py:128-134`; `cbpos/core/services/scheduler_service.py:16,94,114,132-150` |
| Email: receipt to customer | **Button exists but appears broken.** The dialog calls `EmailService.send_receipt(...)` (`receipt_options_dialog.py:246`), but `EmailService` defines only `send_email` and `send_email_with_pdf` (`email_service.py:102,127`). No `send_receipt` exists anywhere in `cbpos/`. The dialog only shows when `show_receipt_dialog` is on (default off) | — | code trace |
| SMS receipts | **UNKNOWN — not found** (no SMS, Twilio or similar code in `cbpos/`) | — | — |
| WhatsApp receipts | **Not found as a feature.** The only WhatsApp link is the shop-entered QR content field on receipts | — | `config_service.py:95`; `sales_receipt_builder.py:231-235` |

## G. Data, backup & restore

### G1. Local database engine, location, encryption at rest

**Engine:**
- Default is SQLite via SQLAlchemy (`db_mode = "standalone"`): `cbpos/core/database.py:46-52`, `config_service.py:97`.
- PRAGMAs set on each connection: `journal_mode=WAL`, `busy_timeout=30000`, `foreign_keys=ON` (`database.py:73-80`). Expect `cbpos.db-wal` and `cbpos.db-shm` files next to the database.
- Optional "network" mode uses **PostgreSQL** (psycopg2) instead (`database.py:53-63,94-118`). See G4.

**File location:** `DATA_DIR/cbpos.db` (`cbpos/config.py:38`).

| Environment | DATA_DIR | Evidence |
|---|---|---|
| Windows (installed / frozen) | `%LOCALAPPDATA%\CB POS` | `cbpos/config.py:28-29` |
| macOS (installed) | `~/Library/Application Support/CB POS` | `config.py:30-31` |
| Linux (installed) | `~/.local/share/cbpos` | `config.py:32-33` |
| Running from source | project root | `config.py:34-36` |

- The same folder also holds `settings.json` (`config_service.py:26`), `.encryption_key` (`:169`), `.backup_password` (`:175`), `logs/` (`main.py:243`), `product_images/`, `assets/` (logo), and the LAN-Sync TLS cert and key (`cbpos/infrastructure/sync_tls.py:35-36`).
- Older installs that kept data next to the exe are migrated on first launch (`main.py:187-233`).

**Is the database encrypted at rest? No.**
- It is a plain SQLite file. There is no SQLCipher or similar in the dependencies (`pyproject.toml:6-26`), and the engine is created from a plain `sqlite:///` URI (`config.py:38`, `database.py:65-70`).
- User PINs are bcrypt-hashed, not encrypted (`database_setup_service.py:27`; `pyproject.toml:7`).

**What `.encryption_key` encrypts (Fernet, from the `cryptography` package):**
1. Three settings values inside `settings.json`: `network_db_password`, `smtp_pass` and `sync_shared_secret` (`_SENSITIVE_KEYS`, `config_service.py:166`). They are encrypted on save (`:404-419`) and decrypted on load (`:306-315`). Everything else in `settings.json` is plain JSON.
2. The shop backup password, stored Fernet-encrypted in the separate file `.backup_password` (`config_service.py:171-176,259-303`).

**Nothing else.** The database, backups (which use their own password, see G2), logs and images are not encrypted with this key.

**How the key is made:**
- If `.encryption_key` is missing, the key is **derived from the machine's hostname and OS**: `sha256("cbpos-{hostname}-{system}")`. It is then saved to the file (`config_service.py:218-231`).
- So the key is predictable from the hostname, not random. Do not market it as strong secret storage.
- The file is written with owner-only permissions and an atomic replace (`config_service.py:178-208`). The code notes that on Windows this is only the read-only attribute, plus AppData's per-user ACL (`:187-190`).

### G2. Backup

**Format:** a `.zip` archive written with `pyzipper`. Contents:
- `cbpos.db` (a consistent copy made with SQLite's online backup API, not the live file)
- `products/…` (product images)
- `settings.json`
- `assets/…` (receipt logo)

Evidence: `cbpos/core/services/backup_service.py:96-152,162-180`. The archive does **not** contain `.encryption_key` or `.backup_password`.

**Encryption:** **AES** via `pyzipper.WZ_AES` (WinZip AES), compression `ZIP_DEFLATED` (`backup_service.py:27-28,122-127`). The module docstring says "AES-256" (`backup_service.py:4`); `WZ_AES` defaults to 256-bit in pyzipper, and no strength is set explicitly. It is not ZipCrypto. A backup **cannot be made without a password** (`backup_service.py:91-92`).

**Password handling:**
- There is one "shop backup password" for every backup (manual, auto and safety snapshot). Minimum length is 6 characters (`config_service.py:176,299-300`).
- It is stored Fernet-encrypted in `DATA_DIR/.backup_password` with the `.encryption_key` (`config_service.py:171-176,289-303`). It deliberately lives outside `settings.json`, so restores do not roll it back (`config_service.py:171-174`).
- It is set or changed in Data Safety → Backup → "Set/Change Password" (`cbpos/ui/views/data_safety/backup_tab.py:106-117,325-335`). If none is set, the user is prompted to create one before the first manual backup (`backup_password_dialog.py:140-152`; `backup_tab.py:300`).
- Changing it affects new backups only (`config_service.py:293`).

**Manual vs automatic:**
- **Manual:** Data Safety → Backup → create backup (`backup_tab.py:293-310`). File name `cbpos_backup_YYYYMMDD_HHMMSS.zip` (`backup_service.py:44,106-107`).
- **Offered after closing a shift:** Yes/No prompt with a folder picker (`cbpos/ui/dialogs/shift_closing_dialog.py:242-290`).
- **Automatic on app close:** default **on** (`auto_backup_on_close`, `config_service.py:136`; toggle in Settings → System, `settings_pages/system.py:210,227`; runs in `cbpos/ui/main_window.py:317-341`). File name `cbpos_auto_*.zip` (`backup_service.py:45`). It is **skipped, with a warning, if no backup password is set** (`backup_service.py:199-204`; message at `en.json:95`).
- **No time-based schedule** (daily, hourly and so on) was found. The scheduler only runs the daily email report (`scheduler_service.py:55-65`). Frequency options: **UNKNOWN — not found**.

**Default destination:**
- `~/Documents/CB-POS-Backups` (`backup_service.py:648-650`).
- Can be changed in Data Safety → Backup → change folder; saved as `backup_dir` (`backup_tab.py:285-290`; `config_service.py:138`).

**Retention:**
- Keep the newest **N per kind** (manual, auto, pre-restore snapshot). Default N is **5**, configurable from **1 to 50** in Settings → System (`config_service.py:137`; `settings_pages/system.py:99,211,228`; `backup_service.py:531-578`).
- Auto backups prune only their own kind after each run (`backup_service.py:206`).
- Manual backups are pruned only when the user clicks "Clean Old Backups" (`backup_tab.py:356-369`; `en.json:1242`).

**Cloud or email backup:** **UNKNOWN — not found.** No cloud-storage or emailed-backup code; backups are written to a local or user-chosen folder only. `public-releases-readme.md:201` says data "is never sent anywhere online".

### G3. Restore, and moving to a new PC

**UI path:** Settings sidebar → **Data Safety** → **Restore** tab (`cbpos/ui/views/settings_view.py:110,155-164`; tabs at `cbpos/ui/views/data_safety_view.py:59-67`). A backup can also be restored from a row in the Backup list (`data_safety_view.py:70,73-77`).
- Note: `CLAUDE.md` lists Data Safety under ManagementView, but the code puts it in Settings.

**Steps (code trace):**
1. The user needs the `DATA_SAFETY_RESTORE` permission or a manager override (`restore_tab.py:193`).
2. Pick the `.zip` and type its password. If the field is left empty, the current shop backup password is used (`restore_tab.py:137-143`). There is an optional "Verify" step that extracts the archive and runs an integrity check (`backup_service.py:603-640`).
3. **A shop backup password must be set on this PC** (to lock the safety snapshot). Otherwise the restore is refused (`restore_tab.py:215`; `backup_service.py:258-261`).
4. Confirm the dialog: "This will replace your current database … A safety snapshot will be saved first … The application will need to restart" (`restore_tab.py:224`; `en.json:1260`).
5. The service then:
   - extracts the archive to a temp folder and checks it contains `cbpos.db`; a wrong password is reported (`backup_service.py:349-367`)
   - runs `PRAGMA integrity_check` and checks for the CB POS tables (`backup_service.py:373-395`)
   - writes a **pre-restore safety snapshot** `cbpos_backup_*.pre_restore.zip` (`backup_service.py:258-271`)
   - disposes the DB engine and **overwrites** `cbpos.db`, `settings.json`, product images and the logo (`backup_service.py:273-302`).
6. The user sees "Please restart the application for changes to take effect" (`restore_tab.py:255`; `en.json:1263`). **There is no automatic restart.**
7. On the next launch, an older database schema is upgraded automatically by Alembic (`main.py:165-177`).

**Moving to a new PC:**
- **Supported route:** install CB POS on the new PC, complete first-run setup, set a backup password there (required for the safety snapshot), then restore the `.zip` with the password it was made with (see above).
- **Is the old `.encryption_key` needed? No, not to open the backup.** The zip uses only the backup password (`backup_service.py:349-351`).
- **Caveats:**
  - The restored `settings.json` carries the old PC's Fernet-encrypted `smtp_pass`, `network_db_password` and `sync_shared_secret`. These cannot be decrypted with the new PC's key; the decode falls back and returns an unusable value (`config_service.py:242-256`). **These three secrets must be re-entered** unless `.encryption_key` is copied manually. Copying the key manually is not a documented flow.
  - The code explicitly expects this for the backup password, which is why it is kept out of `settings.json` (`config_service.py:171-174`).
  - The restored `settings.json` also brings over printer, terminal and LAN-Sync settings from the old PC (`backup_service.py:284-289`). Those may need adjusting.
- The receipt logo travels with the backup (`receipt_logo_service.py:1-9`).

### G4. Multi-terminal on a LAN

There are **two separate mechanisms** in the code. The UI says to use one or the other, not both (`settings.network.mode_explainer`, `en.json:1830`).

#### A. LAN Sync (Main PC hub + terminals, each with its own local SQLite)

**Status:**
- Shipped in `v1.3.0` per `CHANGELOG.md:48-71` (the tag exists, 2026-09-27). TLS and shared-secret auth were already in `v1.3.0`; checked with `git show v1.3.0:…`.
- Major correctness work came **after** `v1.3.0` and is unreleased at HEAD:
  - Main-side ID remapping (`sync_apply_service.py`, #671; that file does not exist at `v1.3.0`)
  - re-sending edited rows (#677)
  - balance sync (#678)
  - customers created on a terminal (#680)
  - loyalty (#716)
- There is **no feature flag or licence gate**. It is a normal Settings option and is off by default (`terminal_mode = "standalone"`, `config_service.py:120`). `LicenseService` is a stub that is not used for gating (`cbpos/core/services/license_service.py:20-26`).
- Roadmap: "Built — needs real-world testing … not tested with real clients in production" (`docs/Roadmap.md:25,703-706`). This line describes the PostgreSQL phase, but it is the only production-readiness statement found.

**Setup UI:** Settings → **Network** → **LAN Sync** tab (`cbpos/ui/views/settings_pages/network.py:394`).

| Field | Values / range | Evidence |
|---|---|---|
| Terminal Mode | Standalone / Main PC (Hub) / Terminal | `network.py:298-300,531-533` |
| Terminal ID | default `TERM-01` | `config_service.py:118`; `network.py:607` |
| Sync port | 1024–65535, default 5555 | `network.py:329`; `config_service.py:121` |
| Main PC address | IP:port | `config_service.py:122` |
| Sync interval | 1–60 seconds, default 3 | `network.py:353`; `config_service.py:123` |
| Shared Secret | password field | `network.py:363`; `config_service.py:124` |
| Buttons | "Test Sync Connection", "Forget trusted Main PC" | `network.py:373,384,813,873-888` |

- Changing the mode requires a restart, because the sync threads start at boot (`settings_view.py:526-532`; `main.py:514-567`).

**Which PC is the master:**
- The PC set to **Main PC** runs the server and owns the master data (`main.py:529-542`).
- Terminals pull master ("catalog") tables and push their own transactions (`cbpos/core/services/sync_protocol.py:42-92`).
- There is no election or auto-discovery; the terminal is given the Main PC's address by hand (`sync_client.py:406-416`).

**Protocol:**
- HTTPS + JSON over Python's built-in `http.server`, with a threaded server bound to `0.0.0.0:<port>` and TLS-wrapped (`cbpos/infrastructure/sync_server.py:1-9,633,638`).
- Protocol version `"1.0"` (`sync_protocol.py:25`).
- Money values are sent as strings, not floats (`sync_protocol.py:98-110`).
- Endpoints (`sync_protocol.py:35-40`; routing at `sync_server.py:230-256`):

| Endpoint | Purpose |
|---|---|
| `GET /sync/heartbeat` | health check |
| `POST /sync/register` | terminal announces itself |
| `GET /sync/pull-catalog?since=` | incremental via `last_modified`; full download if `since` is omitted (`sync_server.py:302-319`) |
| `GET /sync/pull-stock` | current stock quantities |
| `POST /sync/push-transactions` | terminal sends sales and other transactions |
| `POST /sync/push-audit` | terminal sends audit logs |

**Client loop:**
- register → initial full catalog sync → every *interval* seconds push, then pull catalog, then pull stock (`sync_client.py:312-373`).
- Reconnect backoff up to 30 seconds (`sync_client.py:337`).
- If the Main PC is unreachable, local rows stay `synced=False` and are re-sent later. The pending count is shown in the status widget (`sync_client.py:262-267,454-500`).

**Security:**
- **TLS:** the Main PC generates a self-signed RSA-2048 certificate valid for 10 years (`sync_tls.py:55-66`). Terminals **do not verify the certificate** (`CERT_NONE`, `check_hostname=False`, `sync_tls.py:92-100`). The module docstring says this protects against passive sniffing but **not against active man-in-the-middle**, and that certificate pinning is "left for later" (`sync_tls.py:1-17`).
- **Auth:** every request carries the `X-Sync-Token` header with the shared secret, compared in constant time (`sync_server.py:215-226`; `sync_client.py:291`). An empty secret refuses all requests (`sync_server.py:218-224`). The app refuses to start sync without a secret (`main.py:518-527`).
- **Pairing:** there is no approval or PIN pairing step. Any client with the secret can register (`sync_server.py:272-298`).
- **Main PC identity check:** a terminal remembers the Main PC's random `main_instance_id` from the first connection and refuses to sync if it changes, until "Forget trusted Main PC" is used (`sync_server.py:49-62`; `sync_client.py:406-435`; `config_service.py:125-126`).

**What syncs:**
- **Main PC → terminals (catalog):** roles, permissions, users, void reasons, units, categories, suppliers, customers, price lists and price-list items, products, promotions, payment methods, composite items (`sync_protocol.py:46-61`). Stock quantities are overwritten from the Main PC (`sync_client.py:763-796`).
- **Terminals → Main PC (transactions):** customers created on the terminal and their contacts; documents, sales, sale items and payments; purchases and purchase items; stock movements; shifts; cash movements; audit logs; customer payments and ledger; loyalty ledger; supplier payments and ledger; suspended transactions; inventory logs (`sync_protocol.py:72-92`).
  - The Main PC stores them under its own IDs through `sync_id_map`, so re-sends are idempotent (`cbpos/core/services/sync_apply_service.py:1-38`).
  - Stock and balances move only on the first arrival of a row (`sync_server.py:410-416`; `sync_apply_service.py:33-38`).
  - Rows edited after a push (a void, a shift close) are re-sent (`cbpos/core/services/sync_change_tracking.py:1-24`).
- **Not synced (inferred from the table lists):**
  - other terminals' sales to a terminal: transaction tables are push-only, so a terminal's reports cover its own sales plus master data. The Main PC holds everything.
  - app settings (shop name, receipt header/footer, logo, language), which live in each PC's `settings.json` (`config_service.py:26`) and are not in either table list.
- **Docs disagree:** the guide string "sync automatically … in real-time" (`en.json:1902`) is really a polling interval (default 3 seconds). `CHANGELOG.md:52` says "2-10 registers", but no terminal limit was found in `sync_server.py`.

**Status indicator:** a coloured dot in the main window top bar, hidden in standalone mode (`cbpos/ui/main_window.py:61-64`; `cbpos/ui/widgets/sync_status_widget.py:41,87`).

#### B. Shared PostgreSQL "Network" database mode

- Settings → Network → Mode tab: "Standalone" or "Network". The Server tab takes host, port, database name, user and password; there is a test-connection button (`network.py:83-115,227,476-477,594-605`). Mode changes need a restart (`settings_view.py:526-532`).
- All terminals use one PostgreSQL server: pool size 10 + 20 overflow, statement timeout, optional `sslmode` defaulting to `prefer` (`database.py:53-63,94-118`; `config_service.py:97-105`). Some settings are stored per terminal under a prefixed key (`config_service.py:145-163,426-437`).
- One-click **SQLite → PostgreSQL migration** on the Migration tab (`network.py:230-256,737`; `cbpos/core/services/migration_service.py:1-4,94`).
- `public-releases-readme.md:204` presents this as *the* multi-cashier answer ("point each terminal to a shared PostgreSQL database"). Roadmap: built, needs real-world testing (`docs/Roadmap.md:703-711`).
- **Backups do not cover PostgreSQL.** `create_backup` always reads the local `DATA_DIR/cbpos.db` (`backup_service.py:96`), and there is no `pg_dump` anywhere in `cbpos/`.

#### Cloud sync

**UNKNOWN — not found.** There is no internet or cloud sync service. The PostgreSQL mode connects to whatever host is configured; there is no hosted backend in the code.

## H. Cloud Sync

#### Read this first: there is no "Cloud Sync" — there are two different LAN multi-PC features

I searched case-insensitively for `postgres|psycopg|asyncpg|supabase|neon|rds|cloud sync|cloud_sync|CloudSync|sslmode|DATABASE_URL` across `cbpos/`, `main.py`, `pyproject.toml`, `uv.lock`, `docs/`, `alembic/`, `scripts/`, `CHANGELOG.md`, `PRODUCT.md` and `CONTEXT.md`. I also ran `git grep` over every local and remote branch and tag, and searched GitHub issues and PRs (all states) for "sync", "cloud" and "postgres".

- **No cloud sync exists.** There is no code, setting, dependency, branch, issue or PR for an internet or cloud sync service. The only "cloud sync" wording is in two old planning docs: `docs/archive/PRD.md:40` ("Cloud sync (if enabled) happens asynchronously") and `docs/archive/Docs.md:30` / `docs/archive/Docs.md:106` (`SyncWorker`, `sync_status` "Cloud Sync State"). Both were moved to the archive and marked superseded (`CHANGELOG.md:20`). Neither `SyncWorker` nor a `sync_status` column exists in `cbpos/`.
- **No Supabase, Neon, RDS, asyncpg or `DATABASE_URL` code exists** (no matches). The only "neon" hits are the colour name "Neon Green" (`cbpos/ui/styles/dark.qss:8`).
- **PostgreSQL does exist, but as a shared database, not as sync.** This is "Network" database mode (Settings > Network > Mode/Server/Migration). Every PC connects live to one PostgreSQL server on the local network instead of its own SQLite file (`cbpos/core/database.py:27`, `cbpos/core/database.py:53-63`, `cbpos/core/services/config_service.py:97-103`). Nothing is copied or replicated.
- **The feature actually called "sync" is LAN Sync** (Settings > Network > LAN Sync). One "Main PC" runs an HTTPS server. "Terminal" PCs (tills) each keep their own **SQLite** database and push/pull over the LAN (`cbpos/infrastructure/sync_server.py:1-9`, `cbpos/infrastructure/sync_client.py:1-13`). It uses no PostgreSQL. The changelog describes it as "Connect 2-10 registers over a LAN cable with zero internet required" (`CHANGELOG.md:52`).
- The app itself says to use one or the other: "'Mode' switches where this PC's database lives (a local file, or a shared network server). 'LAN Sync' is a different, simpler way to keep separate registers in sync over a direct cable — use one or the other, not both." (`cbpos/i18n/en.json:1830`; code comment at `cbpos/ui/views/settings_pages/network.py:50-55`). `PRODUCT.md:26` says the same: both are opt-in mode switches, and local SQLite is the baseline.

Each answer below has three parts: **(A) Cloud/PostgreSQL sync**, **(B) PostgreSQL Network mode** (the real PostgreSQL feature), and **(C) LAN Sync** (the real sync feature).


### H1. Implementation and release status

**(A) Cloud/PostgreSQL sync:** UNKNOWN — not found. It is not implemented, not behind a flag, not on any branch, and no GitHub issue or PR covers it.

**(B) PostgreSQL Network mode:** It is implemented and has been in the code since PR #22 (merged 2026-02-18). It is in `v1.3.0`: `git show v1.3.0:cbpos/core/database.py` contains `_get_postgres_uri` with `sslmode` at lines 101-105.
- The roadmap calls it unproven: "Phase 18: Multi-Terminal *(Built — Needs Real-World Testing)*… has not been tested with real clients in production. No further development investment until a client needs it." (`docs/Roadmap.md:703-706`).
- Audit issue #474 (closed) repeats that caveat.
- No unit test touches PostgreSQL. `grep -ril postgres tests/` returns nothing, and CI (`.github/`) has no PostgreSQL service.
- It is off by default: `"db_mode": "standalone"` (`cbpos/core/services/config_service.py:97`).

**(C) LAN Sync:** It is implemented and shipped in `v1.3.0`, off by default (`"terminal_mode": "standalone"`, `cbpos/core/services/config_service.py:120`).
- `git ls-tree -r v1.3.0` includes `sync_server.py`, `sync_client.py`, `sync_tls.py`, `sync_protocol.py`, `sync_status_widget.py` and migration `91ce190ffa8b`.
- The changelog lists it under `## [1.3.0]` ("Added — Multi-Terminal LAN Sync", `CHANGELOG.md:48-71`). TLS and shared-secret hardening came in PR #237 (merged 2026-09-05, before the tag). The v1.3.0 server already checks `X-Sync-Token` and wraps the socket in TLS.
- **The v1.3.0 build has known data-loss bugs that were fixed only after the tag. The fixes are unreleased.**
  - #671 (critical): pushed rows from different tills were merged by integer id, so tills overwrote each other's sales on the Main PC. In v1.3.0 the server used `session.merge()` (`git show v1.3.0:cbpos/infrastructure/sync_server.py`, around line 542).
  - Also fixed after the tag: #677 (voids and shift closes never re-sent), #678 (credit/payable balances), #679 (GRN numbering), #680 (till-created customers never pushed), #715, #716 (loyalty points overwritten), #717.
  - These fixes landed 2026-10-07 to 2026-10-15 (PRs #685, #713, #723, #750, #764), with new files `cbpos/core/services/sync_apply_service.py`, `sync_change_tracking.py`, `sync_customer_renumber.py` and migrations `e177823b8aa9` (sync_id_map) and `c3f1a9d27e54` (customers.synced). None of these files exist in `v1.3.0`.
  - `pyproject.toml:3` is still `version = "1.3.0"`. The `## [Unreleased]` changelog section (`CHANGELOG.md:5-47`) does not mention any of these sync fixes.
- The Phase 18 "needs real-world testing" caveat (`docs/Roadmap.md:706`) covers multi-terminal in general.

### H2. Supported PostgreSQL versions and provider-specific code

**(A) Cloud/PostgreSQL sync:** UNKNOWN — not found. There is no Supabase, Neon, RDS or other provider code, and no tested-provider list.

**(B) PostgreSQL Network mode:**
- **Supported or tested PostgreSQL server versions:** UNKNOWN — not found. No version check, documentation or CI matrix exists.
- **Driver:** `psycopg2-binary>=2.9.13` (`pyproject.toml:11`), locked at `2.9.13` (`uv.lock:1778-1779`). It uses the SQLAlchemy dialect `postgresql+psycopg2` (`cbpos/core/database.py:108`).
- **PostgreSQL-specific SQL in the code:**
  - `-c statement_timeout=…` connect option (`cbpos/core/database.py:55-57`)
  - `SET TRANSACTION ISOLATION LEVEL SERIALIZABLE` (`cbpos/core/database.py:192-194`)
  - `pg_get_serial_sequence` / `setval` during migration (`cbpos/core/services/migration_service.py:189-202`)
- **Connection target:** a plain host, port, database, user and password (`cbpos/core/database.py:96-115`). Defaults are `localhost:5432`, database `cbpos`, user `postgres` (`cbpos/core/services/config_service.py:98-101`).
- **Provider-specific handling:** none exists (no pooler or PgBouncer flags, no IAM auth, no SSL root-certificate setting). The UI describes it as "a central PostgreSQL database server on your network" (`cbpos/i18n/en.json:1845`).

**(C) LAN Sync:** Not applicable. It does not use PostgreSQL. Tills and the Main PC each use their local SQLite file (`cbpos/config.py:38`). The transport is the Python standard library `http.server` and `urllib` (`cbpos/infrastructure/sync_server.py:7-8`, `cbpos/infrastructure/sync_client.py:16-17`).

### H3. Sync direction, data and frequency

**(A) Cloud/PostgreSQL sync:** UNKNOWN — not found.

**(B) PostgreSQL Network mode:** There is no sync. Every read and write goes directly to the shared PostgreSQL database through the app's single engine (`cbpos/core/database.py:44-70`). The only data movement is a **one-time, one-way, manual upload** from local SQLite to an **empty** PostgreSQL database: the "Migration" tab's upload button (`cbpos/ui/views/settings_pages/network.py:685-760`, which calls `cbpos/core/services/migration_service.py:94-232`).
- The upload refuses if `users`, `products`, `sales` or `customers` already contain rows (`migration_service.py:123-140`).
- It copies the models listed in `MIGRATION_ORDER` (`migration_service.py:60-91`). That list does not explicitly name units, payment methods, the customer, supplier and loyalty ledgers, customer and supplier payments, stock counts or proformas. Whether those tables arrive through SQLAlchemy relationship cascades was not verified.
- No reverse path (PostgreSQL back to SQLite) exists. `grep` finds no such function.

**(C) LAN Sync:** It is two-way, hub and spoke. The Main PC is the authority for catalog data. Tills own their transactions.
- **Till to Main (push):** `POST /sync/push-transactions` (`cbpos/core/services/sync_protocol.py:37`). It carries every row with `synced = False`, collected in `cbpos/infrastructure/sync_client.py:502-572`:
  - customers created on the till, with their contacts
  - documents, sales, sale_items, sale_payments
  - purchases, purchase_items
  - stock_movements, shifts, cash_movements
  - customer_payments, customer_ledger, loyalty_ledger
  - supplier_payments, supplier_ledger

  The server's allow-list (`TRANSACTION_TABLES`) also includes `audit_logs`, `suspended_transactions` and `inventory_logs` (`sync_protocol.py:72-92`). The client never sends those three in the regular push. `push_audit_logs()` exists (`sync_client.py:801-844`; its docstring says "e.g., every 30 seconds"), but nothing calls it: `grep` finds only its definition.
- **Main to till (pull):**
  - `GET /sync/pull-catalog?since=…` returns rows of 14 catalog tables: roles, permissions, users, void_reasons, units, categories, suppliers, customers, price_lists, price_list_items, products, promotions, payment_methods, composite_items (`sync_protocol.py:46-61`). Rows are filtered by `last_modified > since` where the table has that column (`cbpos/infrastructure/sync_server.py:342-351`).
  - `GET /sync/pull-stock` returns every product's `stock_qty` (`sync_server.py:373-393`).
  - The Main PC returns shop-wide customer debt, supplier payable and loyalty balances in each push reply (`sync_server.py:471-483`). The till applies them (`sync_client.py:637-655`).
- **Not synced at all:**
  - Purchase orders, quotations and stock counts stay on the till that created them (`cbpos/core/services/document_service.py:34-38`; `cbpos/core/services/sync_apply_service.py:130-137`).
  - Catalog edits made on a till are never pushed, because catalog tables are not in `TRANSACTION_TABLES`.
  - Deletions never propagate in either direction. The Main PC "never deletes a pushed row" (`cbpos/core/services/sync_change_tracking.py:112-117`), and the catalog pull only returns rows that still exist, with no deletion markers (`sync_server.py:337-351`).
  - `settings.json` is per PC and not synced (it is a file, `cbpos/core/services/config_service.py:26`).
- **Frequency and trigger:**
  - The till runs a timed loop. Each cycle pushes, then pulls the catalog, then pulls stock (`sync_client.py:364-373`).
  - The default interval is 3 seconds (`config_service.py:123`, `main.py:552`), adjustable from 1 to 60 seconds in the UI (`cbpos/ui/views/settings_pages/network.py:353`).
  - The first successful connection in each app session does a full catalog pull (`sync_client.py:330-332`, `437-450`).
  - The till starts the client at app startup when `terminal_mode == "terminal"`. The Main PC starts the server when `terminal_mode == "main"` (`main.py:529-559`).
- **Wire format:** a JSON envelope with `protocol_version` "1.0", `terminal_id`, `timestamp`, `sequence`, `type` and `payload` (`sync_protocol.py:25`, `255-279`). Decimals are sent as strings (`sync_protocol.py:98-114`). The default port is 5555 (`sync_protocol.py:30`).

### H4. Offline behaviour and reconnect

**(A) Cloud/PostgreSQL sync:** UNKNOWN — not found.

**(B) PostgreSQL Network mode:** There is no offline mode or local queue. Sessions go straight to the server.
- Transient `OperationalError`s are retried up to 2 extra times (`cbpos/core/database.py:17`, `186-211`), and stale pooled connections are detected with `pool_pre_ping` (`database.py:58-63`). After that the error is raised.
- What the till UI does while the server is unreachable: UNKNOWN — not found. No offline buffering exists for this mode.

**(C) LAN Sync:** Tills are offline-first. Every sale is written to the till's own SQLite file first.
- **The change queue is a per-row `synced` flag**, not a queue table.
  - Transaction rows default to `synced = False` (for example, `Document.synced` at `cbpos/core/models/__init__.py:179`, plus the other `synced` columns listed by `grep -n synced cbpos/core/models/__init__.py`).
  - The client pushes every `synced = False` row each cycle (`cbpos/infrastructure/sync_client.py:502-572`). It marks a row synced only after the Main PC acknowledges it, and only if the row did not change while the push was in flight (`sync_client.py:602-622`).
  - A session-wide `before_flush` hook sets `synced` back to `False` whenever a pushed row changes later, for example a void, a GRN commit or a shift close (`cbpos/core/services/sync_change_tracking.py:95-110`).
- **The `sync_queue` table is unused.** It exists with a docstring describing an outbox (`cbpos/core/models/__init__.py:850-869`), but nothing writes to it. Its only references are in the table map (`cbpos/core/services/sync_protocol.py:350`, `394`).
- **On reconnect:**
  - The client retries registration with linear backoff, `min(interval × failures, 30)` seconds (`sync_client.py:333-339`).
  - After 3 consecutive failed cycles it shows "disconnected" (`sync_client.py:349-352`).
  - Once registered again, the next cycle pushes everything still unsynced.
  - Re-sent rows are idempotent on the Main PC. Each row is found again through `sync_id_map` and updated in place, and stock and balance side effects run only on first arrival (`cbpos/core/services/sync_apply_service.py:1-11`, `309-341`, `618-642`).
  - A batch is applied all or nothing (`cbpos/infrastructure/sync_server.py:418-458`).
  - The catalog watermark is held in memory only (`sync_client.py:229`), so every app restart starts with a full catalog pull.
- **Status indicator:** the main-window widget shows Synced, Syncing (N pending), Disconnected or Main PC (`cbpos/ui/widgets/sync_status_widget.py:7-11`). `set_pending_count()` and `SyncClient.pending_count` are never called (`grep` finds only their definitions), so the pending number is not filled from the database.
- **Caveat seen in the code:** a cycle still pulls stock even if its push failed (`sync_client.py:370-372`). The pull sets the till's `stock_qty` to the Main PC figure (`sync_client.py:786-789`), and nothing adds back the till's own unpushed stock movements. Balances, by contrast, do get the till's unpushed amounts added back (`sync_client.py:122-136`).

### H5. Conflict resolution; multi-terminal and multi-branch support

**(A) Cloud/PostgreSQL sync:** UNKNOWN — not found.

**(B) PostgreSQL Network mode:** All tills share one live database, so there is nothing to merge.
- **Concurrency controls:**
  - Optimistic locking on `Product` through `version_id` (`cbpos/core/models/__init__.py:345-346`, `372`, `387`). `StaleDataError` is caught on stock adjustment paths (`cbpos/core/services/inventory_service.py:113`, `170`).
  - `SERIALIZABLE` sessions for document numbering and credit operations (`cbpos/core/services/document_service.py:278`; `cbpos/core/services/customer_credit_service.py:55`, `135`; mechanism in `cbpos/core/database.py:180-194`).
  - Per-terminal settings keys such as printer, language and theme, prefixed `TERM-xx.` in network mode (`cbpos/core/services/config_service.py:149`, `424-436`; `CHANGELOG.md:79`).

**(C) LAN Sync:**
- **Ownership rules** (`cbpos/core/services/sync_apply_service.py:13-37`):
  - The Main PC owns catalog data. A catalog pull overwrites the till's copy by id with `session.merge` (`cbpos/infrastructure/sync_client.py:702-711`), so the Main PC always wins.
  - Tills own their transactions. The Main PC stores each pushed row under an id it assigns and records `(terminal, id space, local id) → server id` in `sync_id_map` (`cbpos/core/models/__init__.py:872-897`; `sync_apply_service.py:309-341`, `522-540`).
  - Re-sent rows overwrite the Main PC's copy column by column, except non-nullable columns sent as null and a changed `type` (`sync_apply_service.py:591-616`).
  - A re-sent stock movement never changes the stored quantity (`sync_apply_service.py:593-606`).
- **Customers created on a till:**
  - If the phone number or loyalty card matches an existing customer, the till's customer is merged into it and the Main PC's details are kept (`sync_apply_service.py:380-410`).
  - Otherwise the customer is inserted, and the till renumbers its copy to the Main PC id (`cbpos/core/services/sync_customer_renumber.py:1-11`; `sync_client.py:624-635`).
- **Balances** (customer debt, supplier payable, loyalty points): ledger rows move the Main PC figure once, on first arrival. The adjusted figure is sent back to the till (`sync_apply_service.py:33-37`, `630-642`).
- **Stock races between tills** hit the `Product.version_id` lock on the Main PC. The server retries the batch up to 3 times, then answers HTTP 409 (`cbpos/infrastructure/sync_server.py:422-453`).
- **Document numbers** for sales, returns and GRNs are prefixed with the terminal in sync modes so they don't collide (`document_service.py:34-39`).
- **Multi-terminal:** yes. One Main PC plus terminals with distinct `terminal_id`s (`cbpos/core/services/config_service.py:117-126`). There is no enforced maximum. "2-10 registers" is only a changelog statement (`CHANGELOG.md:52`).
  - There is no discovery or election. A terminal pins the Main PC's `instance_id` the first time it connects and refuses to sync if it changes (`sync_server.py:49-63`; `sync_client.py:406-433`). The pin can be cleared with "Forget trusted Main PC" (`cbpos/ui/views/settings_pages/network.py:873-890`).
- **Multi-branch / multi-location:** not supported. The models have no branch, store or location column (`grep branch_id|store_id|multi-location` finds nothing in `cbpos/core/models/__init__.py`). The roadmap removed "Phase 28: Multi-Location & Warehouse — Single-store target" (`docs/Roadmap.md:744`). LAN Sync is single-site by design (`CONTEXT.md:3`).

### H6. Connection security, authentication and credential storage

**(A) Cloud/PostgreSQL sync:** UNKNOWN — not found.

**(B) PostgreSQL Network mode:**
- **TLS is optional.** The setting `network_db_sslmode` defaults to `"prefer"`, with documented options `disable, allow, prefer, require, verify-full` (`cbpos/core/services/config_service.py:103`). It is added to the URL unless set to `disable` (`cbpos/core/database.py:101-105`).
  - The Settings UI has no sslmode field: load and save cover only host, port, database, user and password (`cbpos/ui/views/settings_pages/network.py:575-579`, `594-605`). Changing it means hand-editing `settings.json`.
  - "Test connection" and "Migrate" build their URLs **without** sslmode (`cbpos/core/database.py:148-155`; `cbpos/ui/views/settings_pages/network.py:712-719`), so the libpq default applies to them.
- **Certificate verification and pinning:** nothing in the repo configures it. There is no `sslrootcert` setting, so verification only happens if a user hand-sets `verify-full` with system-level certificates. UNKNOWN — not found.
- **Auth:** a PostgreSQL username and password. The default user is `postgres` (`config_service.py:101`). There is no other auth mechanism.
- **Credential storage on the PC:**
  - `network_db_password` is encrypted with Fernet in `settings.json`. It is one of `_SENSITIVE_KEYS` (`config_service.py:166`, `404-419`).
  - The key is the file `DATA_DIR/.encryption_key` (`config_service.py:169`). On first run that key is derived from `hostname + OS name` (`config_service.py:221-228`) and then saved.
  - Both files are written owner-only, mode 0600 (`config_service.py:179-190`). On Windows the code relies on the AppData folder's access rules (same docstring).
  - The password field is masked in the UI (`network.py:202-204`).
  - Encrypted backups include `settings.json` (`cbpos/core/services/backup_service.py:142-145`) but not `.encryption_key`.

**(C) LAN Sync:**
- **TLS is always on and cannot be turned off.**
  - The server wraps its socket with TLS (`cbpos/infrastructure/sync_server.py:633-643`).
  - The client rewrites `http://` or a bare host to `https://` (`cbpos/infrastructure/sync_client.py:234-244`).
  - The Main PC generates a self-signed RSA-2048 certificate valid for 10 years, with `CN=CB POS LAN Sync` and SAN `*` (`cbpos/infrastructure/sync_tls.py:56-68`). It is stored as `sync_tls_cert.pem` / `sync_tls_key.pem`, 0600, in DATA_DIR (`sync_tls.py:35-36`, `39-46`, `78-79`).
- **No certificate verification or pinning.** The client uses `check_hostname = False` and `verify_mode = CERT_NONE` (`sync_tls.py:92-100`). The module docstring says this protects against passive sniffing but not an active man-in-the-middle, and that pinning "is a larger UX addition left for later" (`sync_tls.py:3-16`).
  - Observation, not stated in the repo: the client sends the shared secret in the `X-Sync-Token` header on every request (`sync_client.py:291`, `cbpos/ui/workers.py:670`) over this unverified TLS. An active man-in-the-middle could therefore read the secret.
- **Auth is a shared secret.**
  - The value must be identical on the Main PC and every terminal (`cbpos/i18n/en.json:1918`). It is sent as `X-Sync-Token` and compared with `hmac.compare_digest` (`sync_server.py:215-226`).
  - An empty secret refuses every request (`sync_server.py:218-224`). The app will not start sync without one (`main.py:518-527`).
  - All endpoints require the token (`sync_server.py:230-256`).
  - There is no pairing flow. The secret is typed in by hand (`network.py:358-365`).
  - No rate limiting or lockout on bad tokens was found in `sync_server.py`.
  - The `instance_id` pin (H5) detects a different Main PC. It is not a cryptographic check.
- **Network exposure:** the server listens on all interfaces, `0.0.0.0:<port>` (`sync_server.py:633`). Port 5555 by default, configurable from 1024 to 65535 (`network.py:329-330`). The installer has no firewall rule (no `firewall`, `netsh` or `5555` in `installer/cbpos.iss`).
- **Credential storage:** `sync_shared_secret` is encrypted with Fernet in `settings.json` (`config_service.py:124`, `166`), using the same key file and permissions as (B). The field is masked in the UI (`network.py:361-363`).

### H7. Who creates and migrates the remote schema; required privileges

**(A) Cloud/PostgreSQL sync:** UNKNOWN — not found.

**(B) PostgreSQL Network mode:**
- **Creation:** the app creates the schema with `Base.metadata.create_all()` when the user clicks the Migration tab's upload button (`cbpos/core/services/migration_service.py:142-143`). `DatabaseSetupService.create_empty_database()` also calls `create_all` on whatever engine is active (`cbpos/core/services/database_setup_service.py:81-82`).
- **Upgrades: Alembic never runs against PostgreSQL.**
  - `alembic/env.py:32` forces `sqlalchemy.url` to `Config.DB_URI`, which is SQLite (`cbpos/config.py:38`).
  - The startup auto-migration also targets only the local SQLite file (`main.py:130-132`, `147-149`).
  - `create_all` only creates missing tables; it does not alter existing ones. **The code shows no path that upgrades an existing PostgreSQL schema after an app update.**
- **Required privileges:** not documented (UNKNOWN — not found). From the code alone, the connecting role needs CREATE TABLE on the target schema, SELECT/INSERT/UPDATE, and `setval` on sequences (`migration_service.py:143`, `176-206`). The default username is `postgres` (`cbpos/core/services/config_service.py:101`).
- **Who installs and runs the PostgreSQL server:** UNKNOWN — not found. There are no setup docs. The UI only says "use the Migration tab once" (`cbpos/i18n/en.json:1847`).

**(C) LAN Sync:** There is no remote schema. Each PC's local SQLite schema is upgraded by Alembic at app startup (`main.py:110-180`).
- Sync-related migrations: `91ce190ffa8b` (sync columns, `sync_logs`, `sync_queue`; created 2026-09-02), `de0680f959ba` (terminal_id; 2026-03-12), `e177823b8aa9` (`sync_id_map`; 2026-10-07), `c3f1a9d27e54` (`customers.synced`; 2026-10-14), all under `alembic/versions/`.
- **Version skew between PCs:**
  - Protocol major version "1." must match (`cbpos/core/services/sync_protocol.py:293-295`).
  - An older Main PC rejects tables it doesn't know. The till keeps those rows unsynced to send after the Main PC is upgraded (`cbpos/infrastructure/sync_client.py:139-148`, `489-492`; `cbpos/core/services/sync_apply_service.py:226-230`).
- **Privileges:** the app needs no database privileges. OS firewall permission for the inbound port is not handled by the installer (H6).

### H8. Turning sync off, and what happens to remote data

**(A) Cloud/PostgreSQL sync:** UNKNOWN — not found.

**(B) PostgreSQL Network mode:**
- **Turning it off:** switch Mode back to Standalone (`db_mode = "standalone"`). The settings screen asks for a restart (`cbpos/ui/views/settings_view.py:526-532`; `cbpos/i18n/en.json:1848`). After the restart the app opens the local SQLite file again (`cbpos/core/database.py:46-52`).
- **Remote data:** nothing deletes or touches the PostgreSQL data. No code drops it. No PostgreSQL-to-SQLite copy-back exists, so the local file holds only what it had before the switch.
- Whether the user is warned about this: UNKNOWN — not found beyond the generic mode-change warning label (`cbpos/ui/views/settings_pages/network.py:628-629`).

**(C) LAN Sync:**
- **Turning it off:** set Terminal mode to "Standalone", which "disables LAN Sync" (`cbpos/i18n/en.json:1892`). This needs a restart (`settings_view.py:531`). On the next start no server or client thread is created (`main.py:566-567`). The threads are stopped on window close (`cbpos/ui/main_window.py:299-303`).
- **Data on the Main PC:** kept. Pushed rows are never deleted (`cbpos/core/services/sync_change_tracking.py:112-117`).
- **Data on the till:** kept in its own SQLite file. Unpushed rows stay `synced = False`. No purge or cleanup code was found, so they would be pushed if sync is turned back on.
- `sync_id_map` and `sync_logs` are kept. No cleanup code was found.
- The secret and pinned instance id stay in `settings.json` until changed (`config_service.py:124-126`).

### H9. Do logs or crash dumps contain connection strings, secrets or passwords?

**(A) Cloud/PostgreSQL sync:** UNKNOWN — not found.

**Logging setup (applies to everything):**
- The file log is `DATA_DIR/logs/cbpos.log`: WARNING and above only, rotating at 5 MB with 3 backups (`main.py:236-258`). There is no redaction filter: `grep -i redact|scrub|sanitize|mask` finds nothing in `cbpos/` or `main.py`.
- Uncaught exceptions are logged with the full traceback through `sys.excepthook` (`main.py:75-89`, `343-345`). No separate crash-dump or minidump mechanism was found.
- Users can view and export log entries (`cbpos/core/services/error_log_service.py:36`, `131`).
- Some `print()` statements go to stdout. For example, `main.py:547` prints the Main PC address. The packaged Windows build has no console (`main.py:79-80`).

**(B) PostgreSQL Network mode:**
- No repo code puts the password or full URL into a log call. A grep for `logger|logging|print(...secret|password|url)` in `cbpos/` and `main.py` matched only backup-password status messages, none of which include the password value.
- The repo does log driver exception text:
  - transient connection errors at WARNING (`cbpos/core/database.py:204-209`)
  - migration failures with a traceback (`cbpos/ui/views/settings_pages/network.py:752-755`)
  - "Connection failed: {e}" strings shown in dialogs (`cbpos/core/database.py:164-165`; `cbpos/core/services/migration_service.py:120-121`, `225-226`)
- Whether psycopg2 or SQLAlchemy exception text includes host, user, database name or password is up to those libraries: UNKNOWN from the repo. The repo applies no redaction of its own.
- The URL is passed as a SQLAlchemy `URL` object, not a formatted string (`database.py:107-116`).

**(C) LAN Sync:**
- The shared secret is never passed to a logger. It appears only in the request header (`cbpos/infrastructure/sync_client.py:291`; `cbpos/ui/workers.py:670`).
- The server never logs headers. Its HTTP access log goes to DEBUG (`cbpos/infrastructure/sync_server.py:190-192`), below the file threshold, and `?terminal_id=…&since=…` is the only query data. A 401 is not logged.
- Messages at WARNING and above include:
  - request errors with method and endpoint (`sync_client.py:303-308`)
  - "Push failed: <server JSON reply>" (`sync_client.py:499`)
  - Main PC identity mismatch with both instance ids (`sync_client.py:425-431`)
  - push and apply failures carrying exception text (`sync_server.py:442-458`, `511-513`)
- The server address appears only in INFO logs (`sync_client.py:315-320`, `sync_server.py:643`), which are not written to the file at the default WARNING level.
- Sync errors (up to 5 per batch) are also stored in the `sync_logs` table (`sync_server.py:525-549`; model at `cbpos/core/models/__init__.py:834-847`). These are row-level error messages, not credentials.
- The TLS private key is a separate 0600 file and is never logged. Only its path is logged, at INFO (`cbpos/infrastructure/sync_tls.py:80`).

## I. Setup & onboarding

### I1. First-run setup wizard

**When it runs:** `main.py:428-437` shows `SetupWizard` if `settings.json` does not exist. Cancelling exits the app.

**Code-trace finding (traced independently twice; GUI not launched): the wizard is skipped on a fresh install.**
- Earlier, `main.py:361` calls `ConfigService.get("language")`. That call writes a default `settings.json` when none exists (`config_service.py:323-325`, via `get()` → `load()` at `:448-449`).
- So the existence check at `main.py:429` should already find the file.
- I confirmed the file-creation behaviour in isolation by calling `ConfigService.get()` against a temp path, which created the file. I did not launch the GUI.

**Second finding: the admin PIN entered in the wizard is probably not applied.**
- The wizard runs before the database is created (`main.py:428` comes before `main.py:439-458`).
- `update_admin_pin` returns `False`, without an error, when there is no admin user yet (`cbpos/core/services/user_service.py:58-69`).
- The empty database then creates `admin` with PIN **1234** (`database_setup_service.py:136`).
- `public-releases-readme.md:140-145` tells users to log in with admin/1234 and change it, which is consistent with this.

**Steps and fields (labels from `en.json:579-581`):**

| Step | Title | Fields | Evidence |
|---|---|---|---|
| 1 of 3 | Shop Information | Shop Name * (required), Address, Phone, VAT Number (optional) | `setup_wizard.py:71-86,220-226` |
| 2 of 3 | Hardware Setup | Connection type (Windows printer / Network / USB); Receipt Printer (Windows printer list, or "None"); Printer IP (Network); USB ID `VID:PID` (USB); A4 Printer (system list); Paper Width (80mm / 58mm). Validates IP or USB ID | `setup_wizard.py:102-139,262-293` |
| 3 of 3 | Security | Admin PIN * and Confirm PIN *. At least 4 characters, digits only, must match | `setup_wizard.py:159-170,240-258` |

- Finish saves `shop_name`, `shop_address`, `shop_phone`, `vat_number`, `paper_width`, `printer_type`, `printer_path`, `receipt_printer_name` and `a4_printer_name`, then tries to update the admin PIN (`setup_wizard.py:307-343`).
- **There is no language step** (see F1).
- **Then the Database Setup dialog** appears if there is no database or it has no users (`main.py:439-458`; `database_setup_service.py:55-70`). It offers "Start Fresh" or "Load Demo Data" (`cbpos/ui/dialogs/database_setup_dialog.py:22-23,66-136`). See I2.
- **Duration:** **UNKNOWN — not found** in the code or the app text. `public-releases-readme.md:128` ("click Next a few times") refers to the Windows *installer* wizard.

### I2. Sample / demo data option

**How to get it:** first launch → Database Setup dialog → **"Load Demo Data"** (`database_setup_dialog.py:99-136`). The dialog text reads "Pre-loaded with 80+ products, customers, sample sales, and suppliers" (`en.json:2894`).
- It runs `scripts/seed.py: seed_data()` (`database_setup_service.py:180-197`), which **drops and recreates all tables** (`scripts/seed.py:62-63`).
- The other choice, "Start Fresh", creates the admin user (PIN 1234), Admin/Manager/Cashier roles with permissions, 6 void reasons, 6 payment methods and 8 units (`database_setup_service.py:73-177`; `en.json:2890`).
- `cbpos.spec` does not list `scripts/` in `datas` or `hiddenimports` (`cbpos.spec:6-53`). Whether PyInstaller still bundles it through the in-function import is **UNKNOWN — not verified**.

**What the demo contains (from `scripts/seed.py`):**

| Data | Contents | Evidence |
|---|---|---|
| Users | 4: `admin/1234`, `manager/5678`, `cashier/0000`, `nimal/1111` (cashier) | `seed.py:123-126`, `:2076` |
| Roles and permissions | Admin / Manager / Cashier | `seed.py:71-118` |
| Void reasons | 6 | `seed.py:136-143` |
| Price lists | 3: Standard, Wholesale, Happy Hour. Wholesale prices on popular items | `seed.py:150-157,1617-1643` |
| Units | 8 | `seed.py:163-174` |
| Categories | 20 (10 parent + 10 sub). Pharmacy is tax-exempt | `seed.py:179-237,189,2077` |
| Suppliers | 8 | `seed.py:239-325` (8 `Supplier(` calls) |
| Products | **80**: 79 catalogue items + 1 composite "New Year Hamper". Groups: rice and flour, spices, canned goods, oil, snacks and biscuits, soft drinks, tea and coffee, dairy, cleaning, laundry, personal care, pharmacy (tax exempt), weighed vegetables and fruit, essentials, stationery, electronics, service items. Most have **English, Sinhala and Tamil names** | `seed.py:327-1407,1409-1436` |
| Customers | 15 Sri Lankan customers (incl. 3 B2B companies), with credit limits, debts and loyalty points | `seed.py:1438-1615,2080` |
| Promotions | 3: "Weekend 5% Off All Snacks", "Evening Happy Hour - 10% Off Beverages", "Rs.50 Off Sunlight Products" | `seed.py:1650-1668` |
| Payment methods | 6: Cash, Card, Credit, QR/Mobile, Cheque, Transfer | `seed.py:1684-1689` |
| Sales history | Random 1–4 sales per day over the last 15 days (about 15–60 in total) | `seed.py:1695-1794` |
| Purchases | 5 | `seed.py:1796-1881` |
| Other | Stock movements, 7 shifts, cash movements, audit logs, inventory adjustment logs | `seed.py:1883-2071` |

- The sales count is random. A code comment and the docs say "30 sales" (`seed.py:1695`; `PRODUCT.md:51` "30+"), and the summary prints `~{sale_counter}` (`seed.py:2081`).
- The demo seed does **not** change shop settings in `settings.json`: there is no ConfigService or settings reference in `scripts/seed.py`.

## J. Logs, errors & support hooks

### J1. Log files: location, format, rotation, in-app viewer and export

#### Data directory, per OS (`Config.DATA_DIR`)
The log folder is `DATA_DIR/logs` (`main.py:243`, `cbpos/core/services/error_log_service.py:20`). `DATA_DIR` depends on the OS:

| Environment | DATA_DIR | Full log path | Source |
|---|---|---|---|
| Windows (installed / frozen) | `%LOCALAPPDATA%\CB POS` (if `LOCALAPPDATA` is unset, it falls back to the user's home folder) | `%LOCALAPPDATA%\CB POS\logs\cbpos.log` | `cbpos/config.py:26-29` |
| macOS (installed) | `~/Library/Application Support/CB POS` | `~/Library/Application Support/CB POS/logs/cbpos.log` | `cbpos/config.py:30-31` |
| Linux / other (installed) | `~/.local/share/cbpos` | `~/.local/share/cbpos/logs/cbpos.log` | `cbpos/config.py:32-33` |
| Running from source (dev) | project root (`BASE_DIR`) | `<repo>/logs/cbpos.log` | `cbpos/config.py:34-36`, `cbpos/config.py:16` |

The installer comments confirm that logs live in user data: "User data (database, settings, logs) lives in %LOCALAPPDATA%\CB POS" (`installer/cbpos.iss:12`).

#### File names, format and rotation (`setup_logging()` in `main.py`)
- Handler: `logging.handlers.RotatingFileHandler(log_dir / "cbpos.log", maxBytes=5 * 1024 * 1024, backupCount=3, encoding="utf-8")` (`main.py:246-251`).
- So the files are `cbpos.log`, plus rotated copies `cbpos.log.1`, `cbpos.log.2` and `cbpos.log.3`. The rotated naming is documented at `cbpos/core/services/error_log_service.py:28`, and the count of 3 comes from `backupCount=3` (`main.py:249`). Each file holds up to 5 MB, so the maximum is about 20 MB in total.
- Level: only WARNING and above go to the file (`main.py:252`, `main.py:257-259`). The docstring says "Writes WARNING+ messages to logs/cbpos.log with rotation (5 MB max, 3 backups)" (`main.py:240-241`).
- Format string: `"%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"` (`main.py:253`). Example line from the parser docstring: `2026-02-28 10:30:00,123 | WARNING  | module.name | message` (`cbpos/core/services/error_log_service.py:174`).
- Crashes: `sys.excepthook = _report_crash` (`main.py:345`). It logs to the `cbpos.crash` logger at CRITICAL with the traceback (`main.py:89`). It then shows a dialog: "CB POS encountered an unexpected error and needs to close.\n\nDetails were saved to the logs folder." (`main.py:103-107`). That string is hard-coded English, not i18n.
- Qt's own messages are printed to stdout only, not written to the log file (`main.py:262-286`, installed at `main.py:302`).
- No other file log handlers exist in `cbpos/`, `main.py` or `scripts/` (grep for `FileHandler|basicConfig` finds only `main.py:246`).
- The separate "audit log" is a database table (`AuditLog`), not a file (`cbpos/core/services/logging_service.py:10`, `:78-80`).

#### In-app error log viewer (yes, it exists)
**Menu path (English labels):** Sales screen hamburger button (☰) → side menu bottom toolbar **gear icon** (tooltip "Settings") → **Settings** sidebar → **Admin Tools** → **Error Logs** tab.
- Hamburger button: `cbpos/ui/views/sales_view.py:169-176`. Side menu gear button: `cbpos/ui/widgets/side_menu.py:340-342`. Tooltip text "Settings": `cbpos/i18n/en.json:637`. Gear opens Settings: `cbpos/ui/main_window.py:109`.
- Settings sidebar button "Admin Tools": `cbpos/ui/views/settings_view.py:111`, `cbpos/ui/views/settings_view.py:179`. Label: `cbpos/i18n/en.json:1529`. The view is embedded in Settings: `cbpos/ui/views/settings_view.py:154`, `:166-167`, `cbpos/ui/views/admin_tools_view.py:2`.
- Tabs: "Database", "Error Logs", "Hardware" (`cbpos/ui/views/admin_tools_view.py:130-132`, `:981-983`; labels at `cbpos/i18n/en.json:1128-1130`). Page title "Admin Tools" and subtitle "Diagnostic tools for troubleshooting and system administration." (`cbpos/i18n/en.json:1125-1126`).
- Who can see it: the Admin Tools page needs permission `admin.settings` or `admin.tools`, and either one is enough (`cbpos/core/constants/permissions.py:182`, `:71-72`; any-of check at `cbpos/core/services/permission_service.py:55-59`). The gear button is hidden when the user can see no Settings page (`cbpos/ui/widgets/side_menu.py:465`, `cbpos/core/services/permission_service.py:68-70`).
- **Discrepancy:** `CLAUDE.md` and `public-releases-readme.md:161` place "Admin Tools" under *Management*. The code puts it under **Settings** (see above). The Management sidebar has no Admin Tools button (`cbpos/ui/views/management_view.py:105-117`).

**What the Error Logs tab does** (`cbpos/ui/views/admin_tools_view.py:330-620`):
- Filters: Level ("All", WARNING, ERROR, CRITICAL; `admin_tools_view.py:344-346`), a From/To date range, and a "Search logs..." box (`cbpos/i18n/en.json:1141-1146`). The "Apply" button runs the filters.
- Reads `cbpos.log*` (newest first) and returns at most 500 entries by default (`cbpos/core/services/error_log_service.py:24-42`, called at `admin_tools_view.py:477`).
- Stats line: "Warnings: {warnings} | Errors: {errors} | Critical: {critical} | Log size: {size}" (`cbpos/i18n/en.json:1182`; service `error_log_service.py:110-153`).
- Buttons: "View Details", "Export Logs", "Clear Logs", "Refresh" (`cbpos/i18n/en.json:1149-1153`).
  - **View Details** (also double-click or Enter on a row) opens the "Log Entry Details" dialog (`admin_tools_view.py:400-402`, `:552-564`). That dialog has a **"Copy Error Details"** button (`cbpos/ui/dialogs/log_detail_dialog.py:132-134`, label `cbpos/i18n/en.json:1150`). It copies Timestamp / Time / Level / Source / Message to the clipboard (`log_detail_dialog.py:151-163`).
  - **Export Logs** opens a save dialog with default name `cbpos_logs.txt`, filter "Text Files (*.txt)" (`admin_tools_view.py:579-581`). It exports the currently filtered entries (`admin_tools_view.py:570`, `:478`). The file starts with the header "CB POS Error Log Export", "Exported: …", "Entries: N" (`error_log_service.py:139-145`). Success message: "Exported {count} entries to:\n{path}" (`cbpos/i18n/en.json:1187`).
  - **Clear Logs** asks "This will delete all log entries.\n\nContinue?" (`cbpos/i18n/en.json:1191`). It then empties `cbpos.log` and deletes the rotated files (`error_log_service.py:156-167`).
- **Opening the folder:** there is no "open logs folder" button. **Settings → Admin Tools → Database → "Open Folder"** (`cbpos/i18n/en.json:1134`) opens the folder that holds the database (`admin_tools_view.py:318-326`), which is `DATA_DIR` (`cbpos/config.py:38`). The `logs` subfolder is inside it.
- **"Export diagnostics" / support bundle:** UNKNOWN — not found. A grep for `diagnos|support bundle|send.*log` in `cbpos/` finds only the docstring at `admin_tools_view.py:4`. Logs are not sent anywhere automatically.
- Other admin tools on the same page: "Check for Updates" button (`cbpos/i18n/en.json:1127`, `admin_tools_view.py:144-149`) and a version label `v{Config.VERSION}` (`admin_tools_view.py:118`).

### J2. Every website URL the app links to or prints

A grep for `http`, `www.`, `mailto:`, `wa.me`, `tel:`, `ceybyte` was run across `cbpos/`, `main.py`, `installer/`, `cbpos.spec`, `pyproject.toml`, `.github/` and `scripts/`.

**Summary:** the app has **no clickable help, docs, report-bug, website or GitHub link anywhere in the UI.** The only `QDesktopServices.openUrl` call opens a local folder (`cbpos/ui/views/admin_tools_view.py:326`). There is no About dialog (no `about` dialog file exists in `cbpos/ui/dialogs/`). There are no `mailto:` or `tel:` links in the app.

#### Printed or embedded on outputs (branding)
| Text / URL | Where it appears | Source |
|---|---|---|
| `Powered by CB POS` + `ceybyte.com` (two centred lines, after a 1-line feed) | Thermal receipts. `_append_branding()` is shared by sales receipts, refund receipts, void receipts, proforma receipts, customer statements and shift reports | `cbpos/core/services/base_receipt_builder.py:60-64`; called from `sales_receipt_builder.py:245`, `refund_receipt_builder.py:128`, `void_receipt_builder.py:104`, `proforma_receipt_builder.py:107`, `statement_receipt_builder.py:106`, `shift_report_builder.py:94` |
| `Powered by CB POS — ceybyte.com` | Footer row of Excel exports (italic, grey #999999, 8pt) | `cbpos/core/services/export_service.py:69-72` |
| `Powered by CB POS &mdash; ceybyte.com` | Footer of HTML/PDF report exports | `cbpos/core/services/export_service.py:111-113` |
| `Powered by CB POS — ceybyte.com` | Footer of every page of A4 PDF tax invoices | `cbpos/core/services/invoice_service.py:36`, `:154-159`, `:309` |
| `CB POS (ceybyte.com)` | PDF metadata "creator" field on A4 invoices | `cbpos/core/services/invoice_service.py:307` |
| i18n strings `"powered_by": "Powered by CB POS"`, `"website": "ceybyte.com"` | Defined in `common`, but no Python code uses them (the receipt builders hard-code the text) | `cbpos/i18n/en.json:62-63` |

The domain is printed as the bare text `ceybyte.com`, with no scheme and no query parameters.

#### Network URLs (auto-update)
| URL | Purpose | Source |
|---|---|---|
| `https://raw.githubusercontent.com/ceybyte/cbpos-releases/main/latest.json` | Update manifest, fetched with header `User-Agent: CBPOS-Updater`, 15 s timeout | `cbpos/core/services/update_service.py:36`, `:39`, `:62-63` |
| `https://github.com/ceybyte/cbpos-releases/releases/download/v{version}/{installer_name}` (for example `.../v1.1.0/CBPOSSetup-1.1.0.exe`) | Installer download. The app downloads it itself (60 s timeout) and checks it against the `sha256` in the manifest. It does not open a browser | Template `.github/workflows/release.yml:249`; docstring example `cbpos/core/services/update_service.py:14`; download `update_service.py:102-103`; dialog `cbpos/ui/dialogs/update_dialog.py:150-169` |
| Manifest fields: `version`, `release_date`, `download_url`, `changelog` (CI writes it as empty), `min_version`, `sha256` | — | `.github/workflows/release.yml:245-253`; `installer/latest.json.template:1-8` |

When the update check runs:
- Silently, 3 s after startup (`main.py:572-581`).
- Manually, from Settings → Admin Tools → "Check for Updates" (`cbpos/ui/views/admin_tools_view.py:144-149`).

Note: `public-releases-readme.md:189` and `:201` say that data is "never sent anywhere online" and that internet is needed "only to download the installer". The app does make an outbound HTTPS GET for the update manifest on every startup (`main.py:578-581`).

#### Installer (Windows "Add/Remove Programs" links)
- `#define MyAppURL "https://ceybyte.com"` is used for `AppPublisherURL`, `AppSupportURL` and `AppUpdatesURL` (`installer/cbpos.iss:27`, `:38-40`).

#### User-configured / example URLs (not CB POS links)
- Receipt QR code placeholder: `e.g. https://wa.me/94771234567` (`cbpos/i18n/en.json:1764`; same in `si.json:1734`, `ta.json:1725`). The real value is the shop's own `receipt_qr_content`, empty by default (`cbpos/core/services/config_service.py:95`).
- LAN sync: `https://{server_address}` built from the user-entered Main PC address, always forced to TLS (`cbpos/infrastructure/sync_client.py:209-212`, `:234-240`; `cbpos/ui/workers.py:663-666`).

#### URLs in docs only (not in the app)
`public-releases-readme.md` links to:
- `https://ceybyte.com` (`:9`, `:207`, `:235`, `:243`, `:245`, `:254`)
- `https://github.com/ceybyte/cbpos-releases/releases/latest` (`:14`, `:126`)
- `https://github.com/ceybyte/cbpos-releases/releases` (`:216`)
- `https://github.com/ceybyte/cbpos-releases/issues`, the bug / feature-request channel (`:207`, `:244`)
- shields.io badges (`:14-17`)

`SECURITY.md:20` links to `https://ceybyte.com`. CI commits as `bot@ceybyte.com` (`.github/workflows/release.yml:263`).

**Help / docs / report-bug URL inside the app:** UNKNOWN — not found. The migration-failure message says "Please contact CB POS support. Details were saved to the logs folder." with no contact details (`cbpos/i18n/en.json:87`). The login hint says "Forgot PIN? Contact your administrator." (`cbpos/i18n/en.json:78`).

## K. Licence & legal

### K1. Software licence and whether the source is public

- **Licence type: proprietary freeware (free to use, closed source).** No open-source licence anywhere.
  - `README.md:174-178`: "## License / **Proprietary Software**. / Copyright 2026 Ceylon Byte. All Rights Reserved. / Unauthorized copying of this file, via any medium is strictly prohibited."
  - `README.md:7`: "**Free software** for small-to-medium shop owners …". The wording says "free software", but the licence is proprietary.
  - `README.md:168`: "…since CB-POS is closed-source and Pages is public."
  - `PRODUCT.md:17`: "CB POS is free, closed-source point-of-sale software …". `PRODUCT.md:21`: "genuinely free (not a trial or freemium tier)".
  - `public-releases-readme.md:209-210`: "**Is this open source?** No. CB POS is free to use but the source code is proprietary. You may not copy, modify, or redistribute the software."
  - `public-releases-readme.md:185-186`: "Free to download, free to use, no trial period, no feature limits, no monthly fees."
- `pyproject.toml`: no `license`, `classifiers` or `authors` field (`pyproject.toml:1-5` has only name, version, description and requires-python; grep for `licen|classifier|author` finds nothing).
- LICENSE files: none for CB POS. The only `LICENSE` file is from a third-party agent plugin, `.agents/plugins/ponytail/LICENSE`, which is not part of the app.
- Installer: no `LicenseFile`, `InfoBefore` or `InfoAfter`. The comment reads "; No license page — free software" (`installer/cbpos.iss:43`). There is no `AppCopyright` directive either.
- `cbpos/core/services/license_service.py:5-34` contains a stub `LicenseService` (machine-ID hash, plus `validate_license()` that always returns False, meaning "Trial Mode"). No other code references it (grep finds no callers), so it has no effect on users.
- **Repo visibility** (checked read-only with `gh repo view`, 2026-10-21):
  - `HMAHD/CB-POS` (source) is **PRIVATE**.
  - `ceybyte/cbpos-releases` is **PUBLIC**, with an empty description.
  - CI publishes installers and `latest.json` to the public repo: "Publish to the PUBLIC releases repo (ceybyte/cbpos-releases)" (`.github/workflows/release.yml:201`, `:224-266`). Release notes text: "Download and run the installer. Your existing data is preserved automatically." plus the SHA-256 (`.github/workflows/release.yml:235-239`).
  - `public-releases-readme.md` looks like the README for that public repo (its relative links `assets/…` and `SECURITY.md` point at that repo's layout; `public-releases-readme.md:2`, `:235`). That it is the deployed README is an inference.

### K2. Existing EULA, privacy, disclaimer, warranty, terms and copyright text

Grep for `warranty|eula|privacy|disclaimer|terms (of|and)|liabilit|copyright|all rights reserved` (case-insensitive) across the repo, excluding `.venv`, `node_modules`, `graft`, `graphify-out`, `.git`, `docs/_build`, `.agents` and `.claude`.

- **EULA:** UNKNOWN — not found.
- **Privacy policy:** UNKNOWN — not found. The closest is the FAQ answer in `public-releases-readme.md:200-201`: "**Is my data safe?** Your data stays on your computer — it is never sent anywhere online. We recommend regular backups using the built-in backup feature." Also `public-releases-readme.md:188-189`: "**Do I need internet to use CB POS?** No. CB POS works 100% offline. Your data is stored locally on your computer. Internet is only needed to download the installer." (See the J2 note: the app also fetches the update manifest.)
- **Warranty / disclaimer / limitation of liability:** UNKNOWN — not found. All "liability" hits are tax-report code, for example `TaxLiabilityReport`.
- **Terms of use:** UNKNOWN — not found. All "terms" hits are supplier/customer `payment_terms`.
- **Redistribution restriction:** `public-releases-readme.md:210`: "You may not copy, modify, or redistribute the software." `README.md:178`: "Unauthorized copying of this file, via any medium is strictly prohibited."
- **Security policy:** `SECURITY.md:1-59`. Supported versions table: 1.2.x and 1.1.x supported, 1.0.x and earlier not (`:5-10`). Reporting: "Send a detailed report to the repository owner via GitHub private messaging or the contact information listed on the [Ceylon Byte website](https://ceybyte.com)" (`:20`). Response targets: "acknowledge receipt … within **48 hours**", assessment "within **7 days**", critical fixes "typically within **14 days**" (`:30-32`). Note: `cbpos/config.py:13` says the current version is 1.3.0, but SECURITY.md does not list 1.3.x.

**Copyright notices found:**
| Text | Location |
|---|---|
| `Copyright 2026 Ceylon Byte. All Rights Reserved.` | `README.md:177` |
| `Copyright &copy; 2026 Ceylon Byte. All rights reserved.` | `public-releases-readme.md:255` |
| `"version_footer": "Version {version} \| © 2026 Ceylon Byte"`, shown on the login screen | `cbpos/i18n/en.json:81`; used at `cbpos/ui/views/login_view.py:333` |
| `copyright = "2025, Ceylon Byte"` / `author = "Akash Hasendra"` (Sphinx) | `docs/conf.py:16-17` |
| Installer `AppCopyright` | UNKNOWN — not found. `installer/cbpos.iss` has no copyright directive. Publisher fields: `#define MyAppPublisher "Ceylon Byte"` → `AppPublisher` / `VersionInfoCompany` (`installer/cbpos.iss:26`, `:37`, `:68`); `VersionInfoDescription` = "Free Point of Sale System for Sri Lankan Retail" (`installer/cbpos.iss:29`, `:69`) |
| PyInstaller version-info resource (`version_file=` / `VSVersionInfo`) | UNKNOWN — not found in `cbpos.spec`. It only sets `icon='cbpos/assets/ico/cbpos_multi.ico'` (`cbpos.spec:113`) |
| About dialog | UNKNOWN — not found (no About dialog exists) |

Other brand identity strings:
- Windows AppUserModelID `CeyByte.CBPOS` (`cbpos/infrastructure/app_identity.py:19`).
- Login subtitle "Free POS software built for Sri Lankan businesses" (`cbpos/i18n/en.json:75`).
- Setup wizard "Welcome to Ceylon Byte POS" (`cbpos/i18n/en.json:578`).
- Default receipt footer "Thank You! Come Again." (`cbpos/core/services/config_service.py:45`).

## L. Assets for marketing

### L1. Logo, brand files, icons, screenshots and sample receipts

All files are git-tracked under `cbpos/assets/` (checked with `git ls-files`). Sizes come from `stat` and dimensions from `sips`.

#### Logos (`cbpos/assets/logo/`)
| File | Size | Pixels | Used by / notes |
|---|---|---|---|
| `CBPOS_Banner.png` | 306,574 B | 1280×640 | README hero image (`README.md:3`) |
| `Logo_dark.png` | 60,835 B | 1000×1000 | Installer welcome/finish panel (`installer/cbpos.iss:56-57`) |
| `Logo_light.png` | 107,831 B | 1000×1000 | Not referenced in code (grep) |
| `cover_white.png` | 40,179 B | 1000×200 | Wordmark for the dark theme; sales header (`cbpos/core/services/theme_service.py:188-191`, `cbpos/ui/views/sales_view.py:515`) |
| `cover_black.png` | 29,554 B | 1000×200 | Wordmark for the light theme (`cbpos/core/services/theme_service.py:184-187`) |
| `CB-header.png` | 28,426 B | 1000×200 | Not referenced in code (grep) |
| `01.png` | 243,843 B | 6834×4397 | High-res "CB" monogram, black with a blue parallelogram accent, transparent background (viewed). Not referenced in code |
| `02.png` | 239,916 B | 6834×4397 | Same monogram in white, for dark backgrounds (viewed). Not referenced in code |
| `Ceylon Bytes.png` | 51,777 B | 450×150 | Company wordmark "CEYLON BYTES" with a glowing blue style (viewed). Not referenced in code. Note the spelling "Bytes", while every other source says "Ceylon Byte" (`installer/cbpos.iss:26`, `README.md:177`) |

#### App icons (`cbpos/assets/ico/`)
| File | Size | Pixels | Used by |
|---|---|---|---|
| `cbpos.png` | 60,453 B | 1000×1000 | Splash (`cbpos/ui/startup_splash.py:34`), window icon (`cbpos/infrastructure/app_identity.py:41`), installer small image (`installer/cbpos.iss:58`) |
| `cbpos_multi.ico` | 27,405 B | 256×256 (multi-res) | EXE icon (`cbpos.spec:113`), installer icon (`installer/cbpos.iss:49`), `app_identity.py:30` |
| `cbpos_16x16.ico` … `cbpos_256x256.ico` | 279 B – 15,366 B | 16, 20, 24, 32, 40, 48, 64, 128, 256 px | Per-size icons |

#### UI glyphs (`cbpos/assets/icons/`)
14 tiny SVGs, 159–283 B each, 16×16 or 24×24: `check-*`, `chevron-down-*`, `info-circle-*`, `minus-*`, `plus-*`. These are QSS widget glyphs, not brand assets.

#### Badges (`cbpos/assets/badge/`)
`admin.png`, `banned.png`, `designer.png`, `dev.png`, `member.png`, `mod.png`, `new-member.png`, `sponsor.png` (3.5–14.8 KB each). No code references them (grep). They are described as "UI icons" in `docs/PROJECT_OVERVIEW.md:107`.

#### Fonts (`cbpos/assets/fonts/`)
Noto Sans (8 weights), Noto Sans Sinhala (4), Noto Sans Tamil (4), all `.ttf`.

#### Brand colours
Navy `#001F3F` and cyan `#00BCEB` (`cbpos/config.py:41-42`).

#### Screenshots
**UNKNOWN — not found.** The repo has no screenshot images. `public-releases-readme.md:40-52` references `assets/screenshots/sales-screen.png`, `dashboard.png`, `inventory.png` and `receipt-print.png` with the note "*Screenshots coming soon.*". It also references `assets/CBPOS_Banner.png` and `assets/CBPOS_Logo.png` (`:2`, `:251`). These paths would be in the releases repo and do not exist in this repo.

#### Sample receipts
**UNKNOWN — not found** as image or PDF files. The receipt layout is defined in code (`cbpos/core/services/sales_receipt_builder.py`, `base_receipt_builder.py:60-64`). The app has an on-screen preview widget (`cbpos/ui/widgets/receipt_preview_widget.py`), but no exported sample exists.

No brand images were found in `docs/`, `installer/` (only the `.iss` and the `latest.json.template`), the repo root, or `.github/`.

### L2. Existing docs and help content that could seed website docs

#### Root Markdown
| File | Lines | Audience | Notes |
|---|---|---|---|
| `public-releases-readme.md` | 256 | **User-facing**, English | Features, system requirements (Win 10 64-bit, 4 GB RAM, 200 MB, 1024×768; `:114-122`), install steps with a SmartScreen tip (`:124-133`), first launch with default `admin`/`1234` (`:139-163`), FAQ (`:183-210`), security tips (`:229-235`), support channels (`:239-245`). **Stale or inaccurate points:** "Current Version: 1.2.2" (`:218`) vs `cbpos/config.py:13` 1.3.0; "Management > Admin Tools" for staff accounts (`public-releases-readme.md:161`) vs Users in Management / Admin Tools in Settings (see J1); "Settings > Receipt Settings" for the printer (`public-releases-readme.md:159`) vs the sidebar labels "Hardware" / "Receipt" (`cbpos/i18n/en.json:1523-1524`) |
| `README.md` | 178 | Mixed, mostly developer | Feature list (`:9-40`), dev setup, project tree, docs table (`:155-166`), licence (`:174-178`) |
| `PRODUCT.md` | 64 | Internal product/marketing context | Positioning and principles (`:17`, `:21`). Useful for website copy tone |
| `SECURITY.md` | 59 | Public policy | See K2 |
| `CHANGELOG.md` | 992 | Developer-leaning release history | Could seed "What's new" |
| `CONTEXT.md` | 47 | Developer (domain glossary) | — |

#### `docs/` (all English)
| File | Lines | Audience |
|---|---|---|
| `docs/TAX.md` | 66 | Explains backward VAT/SSCL from MRP in plain language. **Best candidate for a user-facing explainer** |
| `docs/onboarding.md` | 52 | Developer ("Developer Onboarding Guide", `:1`) |
| `docs/PROJECT_OVERVIEW.md` | 1065 | Developer architecture reference |
| `docs/Roadmap.md` | 746 | Internal roadmap |
| `docs/archive/PRD.md`, `docs/archive/Docs.md` | 163 / 168 | Archived inception docs ("do not treat as current", `docs/archive/Docs.md:5-7`) |
| `docs/adr/*.md`, `docs/agents/*.md`, `docs/plans/*.md`, `docs/superpowers/**` | — | Developer / agent-internal |
| Sphinx: `docs/conf.py`, `docs/index.rst` (toctree: onboarding, PROJECT_OVERVIEW, Roadmap, TAX, api/modules, contributors; `docs/index.rst:9-18`), `docs/contributors.rst`, `docs/api/` (140 autogenerated files), built output in `docs/_build/html` | — | Developer API reference. Not published, because the repo is closed-source (`README.md:168`). Theme deps `shibuya`, `myst-parser` (`pyproject.toml:36-39`) |

#### In-app help content (trilingual: `cbpos/i18n/en.json`, `si.json`, `ta.json`)
- **Translation coverage:** en and si each have 2,789 leaf string entries, and ta has 2,773 (counted by grep on `"key": "` lines). Missing ta keys fall back to English (per CLAUDE.md).
- **Tooltips:** 75 keys containing `tooltip` in en and si, 74 in ta. Example: `"tooltip_show_qr": "Print a scannable QR code linking to your shop's WhatsApp, website, or a digital copy of the receipt"` (`cbpos/i18n/en.json:1762`).
- **Step-by-step guide dialogs** (`cbpos/ui/dialogs/guide_dialog.py`, opened from "?" `HelpIconButton`s in Settings pages):
  - "SSCL Turnover Base Guide" (`cbpos/i18n/en.json:1615`; `cbpos/ui/views/settings_pages/sales_tax.py:110`, `:185-186`)
  - "Item Tax Exemptions Guide" (`en.json:1624`; `sales_tax.py:125`, `:200-201`)
  - "Database Mode Guide" (`en.json:1841`; `settings_pages/network.py:86`, `:422-423`)
  - "LAN Sync Terminal Mode Guide" (`en.json:1896`; `network.py:289`, `:446-447`)
  - "Email Setup Guide" (`en.json:1579`; `settings_pages/shop_info.py:88`, `:240-241`)
  - "Receipt Logo Guide" (`en.json:1731`; `settings_pages/receipt.py:156`, `:322-323`)
  - About 58 `*guide*` / `*step*` keys in each language file. Strong seed material for website how-to pages.
- **Keyboard shortcuts help:** press **F1** on the Sales screen (`cbpos/ui/views/sales_view.py:553-554`, `:1670-1674`). Strings: "Keyboard Shortcuts" / "Press F1 anytime to see this screen" plus a list of actions (`cbpos/i18n/en.json:2523-2543`).
- **Onboarding flows:**
  - First-run Setup Wizard, 3 steps: Shop Information, Hardware Setup, Security (`cbpos/i18n/en.json:576-582`; `main.py:430`).
  - Database setup dialog: "Start Fresh" or "Load Demo Data" (`main.py:443-452`).
- Empty-state widgets: 9 `EmptyStateWidget(` uses across `cbpos/ui` (grep count).

**Standalone end-user manual / help site / user-docs in Sinhala or Tamil:** UNKNOWN — not found. All Markdown and RST docs are English only. The only trilingual user-facing text is the in-app i18n JSON.
