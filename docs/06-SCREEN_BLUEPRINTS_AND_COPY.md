# 06 — Screen Blueprints, Copy & Stitch Prompts

| | |
|---|---|
| Version | 1.0 |
| Date | 2026-10-21 |
| Status | Approved for build |
| Depends on | `03-DESIGN.md` (tokens/components), `04-APP_FLOW.md` (states), `01-PRD.md` (requirements) |

English copy below is final. It goes into `messages/en.json` under the keys shown. Sinhala and Tamil are produced by native translators from this English source, never by machine translation into production (`CLAUDE.md §1.6`). The product is **CB POS** (with a space, as the app writes it); in `messages/*.json` the space is a non-breaking space (`CB\u00A0POS`) so the name never splits across lines. Glossary terms stay in Latin script in every locale: `CB POS`, `VAT`, `SSCL`, `MRP`, `AVCO`, `.EXE`, `.ZIP`, `SQLite`, `ESC/POS`, `SHA-256`, `Windows`, `WhatsApp`.

---

## 0. Product facts behind the copy

Every product claim below carries the fact ID it rests on, in brackets after the copy (`[C2]` = `docs/00-CBPOS_FACTS.md` § C2). The brackets are for reviewers and aren't part of the string. If the facts change (re-audit on each tagged CB POS release), update the copy here first, then `messages/*.json`.

Corrections from the audit that changed this doc:

| Old assumption | What the app actually does | Fact |
|---|---|---|
| Windows 10/11 64-bit | Windows 10 or later; the installer runs in 32-bit mode, so don't say "64-bit" | [A2] |
| `F2` search, `F12` pay | `F3` search, `F5`/`F10` pay, `F12` quick exact cash, `F2` customer, `F6`/`F7` hold/recall, `F1` help | [B1] |
| Receipt language per bill | Per till (Settings › Receipt); item names print in English on thermal receipts | [F2] |
| Live USB/serial scales | Weight-embedded scale labels only (EAN-13, prefix 20) | [E3] |
| 2-minute, 4-step wizard | 3 setup screens (shop, hardware, admin PIN) + demo/fresh choice; may be skipped on fresh installs (UR-01) | [I1] |
| Scheduled backups | Manual, after shift close, and automatic on app close; needs a backup password | [G2] |
| Cloud Sync | Doesn't exist. LAN Sync and PostgreSQL network mode, both on the shop's own network | [H] |
| Works 100% offline | Bills offline; checks GitHub for updates on every launch | [A7] |
| SSCL on gross MRP | SSCL on the VAT-exclusive base; VAT/SSCL off until VAT registration is ticked | [C1], [C2] |

---

## 1. Shared Stitch preamble

Prepend this block to every screen prompt in §4 when generating with Google Stitch:

> **Design system — CB POS (Ceybyte.com).** Dark theme by default. Page background #1E1E1E. Cards and inputs #252526 with 1px #3E3E42 borders. Hover surfaces #2D2D30. Footer and legal surfaces #18181B. Faint 1px #333337 architectural grid lines across the background, with small "+" crosshair marks at line intersections near section corners. Primary text #FFFFFF, muted text #AAAAAA. **Only one bright green (#39FF14) element per screen: the main Download/primary button, with bold #121212 text.** Vivid Azure #0393DD for links, focus rings, small status dots and one soft radial glow (rgba(3,147,221,0.18)). Gold #FFD700 only for "Gold Supporter" badges and map pins. Error #FF4136, warning #FFDC00. Headlines in Geist ExtraBold with tight tracking (-0.025em). Body in Inter. All numbers, prices ("Rs. 1,180.00"), versions, hashes and keyboard keys in JetBrains Mono. Keyboard keys look like small dark keycaps (#141414). Radii: 4px buttons/inputs, 6px cards/dialogs. **No drop shadows, no gradients except the single azure glow, no glassmorphism, no stock photos, no people illustrations, no emoji, no browser-window chrome around screenshots.** Product screenshots are borderless real Windows POS screens on a #18181B backdrop with a subtle azure rim glow. The logo is the monospaced wordmark "[CB POS]" with a small pulsing azure dot. Tone: bold, direct, engineering-confident. Sri Lankan context: prices in Rupees ("Rs."), shop products like "Samba Rice 5kg", district names like Kurunegala and Jaffna.

---

## 2. Screen inventory (14 screens)

| ID | Screen | Route(s) | Auth | Feature | Primary action | Key components |
|---|---|---|---|---|---|---|
| S01 | Home (8 sections) | `/{locale}` | public | F-02 | Download CB POS | Hero, StatTile ×4, MapTeaser, ProblemCard ×3, BentoCard ×6, Steps, Accordion, Banner, Footer |
| S02 | Download Gate (a: Your shop · b: Location · c: What Next) | modal `?download=1`, full page `/{locale}/download` | public | F-03 | Download CB POS | Dialog/Vaul, PhoneInput, Select, Combobox, MiniMap, Checkbox, Turnstile, HashBlock, Rive check |
| S03 | Merchant Map | `/{locale}/map` | public | F-04 | Add my shop | MapLibre, FilterBar, DistrictGrid, ResultList, Popup/Sheet |
| S04 | Docs Hub | `/{locale}/docs` | public | F-05 | Search docs (`⌘K`) | Search trigger, CategoryCard ×10, StartHere list |
| S05 | Doc Article | `/{locale}/docs/{cat}/{slug}` | public | F-05 | Next article / Was this helpful | Fumadocs DocsLayout, TOC, Callout, Kbd, Screenshot, Steps |
| S06 | Releases | `/{locale}/releases` | public | F-06 | Download (via gate) | LatestReleaseCard, HashBlock ×2, VerifyExpander, Changelog |
| S07 | Feedback Board | `/{locale}/feedback` | public | F-07 | Report a bug / Request a feature | Tabs, Filters, TicketRow, VoteButton |
| S08 | Ticket Submit & Detail | `/{locale}/feedback/new`, `/{locale}/feedback/{CB-0142}` | public | F-07 | Send ticket / Vote | TypePicker, SimilarList, FileDrop, StatusTimeline |
| S09 | Donate | `/{locale}/donate` (+ `?ref=` resume) | public | F-11 | Get payment details → Send for confirmation | AmountChips, BankDetails, FileDrop, SupportersWall, Transparency |
| S10 | Blog (index + post) | `/{locale}/blog`, `/{locale}/blog/{slug}` | public | F-10 | Read post | PostCard, TagFilter, ArticleBody |
| S11 | Legal Center | `/{locale}/legal/{terms\|privacy\|tax-disclaimer\|data-safety\|cookies}` | public | F-12 | — | LegalNav, VersionStamp, ArticleBody |
| S12 | Sign in / Sign up | `/{locale}/login` | public | F-09 | Continue | AuthTabs, EmailOTP, Google button |
| S13 | Merchant Dashboard | `/{locale}/dashboard/*` | merchant | F-09 | Save listing | SideNav, ListingForm, MiniMap, TicketList, DonationList, DangerZone |
| S14 | Admin Console | `/admin/*` | admin | F-08 | Approve / Publish | AdminNav, Queue, DataTable, Editor, AuditList |

System states (not counted as screens): `not-found` (Hairline "unplugged cable" figure + search + home), `error` (request ID + reload), cookie consent bar, offline banner.

---

## 3. Homepage — 8-section conversion copy (S01)

### 3.0 Page meta
| Key | Copy |
|---|---|
| `home.meta.title` | CB POS: free point-of-sale software for Sri Lankan shops |
| `home.meta.description` | Free Windows point-of-sale software that keeps billing when the internet drops, works out 18% VAT and 2.5% SSCL from the shelf price, and prints Sinhala, Tamil or English receipts. No monthly fee. |

### 3.1 Section 1 — Hero

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [CB POS]•     Product  Map  Docs  Releases  Donate     EN·සිං·தமි  ☾       │
├──────────────────────────────────────────────────────────────────────────┤
│ +                                                                      + │
│  FREE WINDOWS POS · SRI LANKA                ╭──────────────────────╮    │
│                                              │                      │    │
│  Bill every customer.                        │ real CB POS capture  │    │
│  Even when the internet                      │   (Rive, azure rim)   │    │
│  doesn't show up.                            │                      │    │
│                                              ╰──────────────────────╯    │
│  Lead paragraph …                             Hairline keyboard figure   │
│                                                                          │
│  [ ⬇ Download CB POS for free ]   See how it works →                       │
│  Windows 10 or later · v{version} · {size} MB                            │
│                                                                          │
│  ✓ No monthly fee   ✓ Bills without internet  ✓ Sales stay on your PC  │
│ +                                                                      + │
└──────────────────────────────────────────────────────────────────────────┘
```

| Key | Copy |
|---|---|
| `home.hero.title` | Keep billing when the internet goes down. |
| `home.hero.lead` | CB POS is free point-of-sale software for Sri Lankan shops. It works out VAT and SSCL from the price on your shelf, prints receipts in Sinhala, Tamil or English, and keeps every sale on your own computer. [C1] [C2] [E2] [G1] |
| `home.hero.cta` | Download CB POS for free |
| `home.hero.ctaMeta` | Windows 10 or later · v{version} · {sizeMb} MB [A2] |
| `home.hero.secondary` | See how it works |
| `home.hero.assurance.1` | No monthly fee, now or later |
| `home.hero.assurance.2` | Bills without the internet [A8] |
| `home.hero.assurance.3` | Your sales stay on your computer [G1] |
| `home.hero.mockupAlt` | The CB POS sales screen with 1.250 kg of Samba rice in the cart and the bill total in rupees (real capture, UR-20) |

Layout: desktop 12-col, copy cols 1–6, mockup cols 7–12. Mobile: copy first, mockup below the CTA (the poster image is the LCP). The `h1` is the only `text-display` on the page.

### 3.2 Section 2 — Social proof & telemetry strip

| Key | Value (live) | Label |
|---|---|---|
| `home.stats.lag` | `0 ms` | spent waiting for the internet at the till. Each sale saves to your own computer first. [G1] |
| `home.stats.price` | `Rs. 0 / mo` | CB POS is free and stays free. There's no paid version waiting for you later. |
| `home.stats.districts` | `{covered}/25` | districts with a CB POS shop on the map |
| `home.stats.tax` | `18% + 2.5%` | VAT and SSCL worked out from your shelf price, once VAT registration is on* [C1] [C2] |
| `home.stats.taxNote` | * CB POS calculates these. The IRD hasn't certified it. Read the tax disclaimer. |
| `home.mapTeaser.title` | {shops} shops in {covered} districts, updated live |
| `home.mapTeaser.cta` | See the shops on the map |
| `home.mapTeaser.empty` | No CB POS shop in your district yet. Yours could be the first. | (when `shops = 0`) |

`{covered}` and `{shops}` are fetched from `/api/stats` in the browser. Skeletons while loading; hidden on error. Never hardcoded (`CLAUDE.md §1.4`).

### 3.3 Section 3 — Problem

| Key | Copy |
|---|---|
| `home.problem.title` | Where a small shop loses money every day |
| `home.problem.1.title` | The internet drops, and the bill stops. |
| `home.problem.1.body` | When the router blinks, a cloud POS can't save the sale. The queue grows while you wait, and some customers walk out. |
| `home.problem.2.title` | Paying every month, in busy months and slow ones. |
| `home.problem.2.body` | A subscription charges you whether you sold a lot or very little, and your sales history sits on someone else's server. |
| `home.problem.3.title` | VAT by calculator, weights by guesswork. |
| `home.problem.3.body` | Working VAT back from the MRP by hand, rounding 1.250 kg down to 1 kg, forgetting SSCL. Each slip is small, but they add up by the end of the month. |

Each card has an `--error` 1px "fault line" drawn by the GSAP scrub (`03 §9.4`), with icons `WifiOff`, `Repeat`, `Calculator`.

### 3.4 Section 4 — Solution bento grid

Desktop layout (3 columns × 3 rows, hairline-separated):

```
┌─────────────────────────────┬──────────────┐
│ 1 Keyboard Cashiering (2c)  │ 2 Offline    │
├──────────────┬──────────────┴──────────────┤
│ 4 Hardware   │ 3 Dual-Tax Engine (2c)      │
├──────────────┼──────────────┬──────────────┤
│ 5 Receipts   │ 6 Weighing & Backups (2c)   │
└──────────────┴─────────────────────────────┘
```

| Key | Copy |
|---|---|
| `home.solution.title` | Everything runs on the computer at your counter. |
| **Card 1** `home.bento.keyboard.title` | Bill without reaching for the mouse. |
| `home.bento.keyboard.body` | Every action has a key: F3 finds an item, F5 takes payment, F12 settles in exact cash and F6 holds a bill. Press F1 in CB POS whenever you need the full list. [B1] |
| `home.bento.keyboard.demo` | Try it here: press F3, then Enter, then F5 |
| **Card 2** `home.bento.offline.title` | Turn the Wi-Fi off. Keep selling. |
| `home.bento.offline.body` | Each sale is saved on the computer in your shop within milliseconds, so a dropped connection never stops a bill. [G1] [A8] |
| `home.bento.offline.toggleOn` | Wi-Fi on |
| `home.bento.offline.toggleOff` | Wi-Fi off, still billing |
| **Card 3** `home.bento.tax.title` | VAT and SSCL, worked out from the shelf price. |
| `home.bento.tax.body` | Type the MRP and CB POS works backward to the price before VAT, the 18% VAT, and the 2.5% SSCL on half of that price. Your customer still pays the MRP. [C1] [C2] |
| `home.bento.tax.inputLabel` | MRP |
| `home.bento.tax.base` | Price before VAT |
| `home.bento.tax.vat` | VAT (18%) |
| `home.bento.tax.sscl` | SSCL (2.5% on 50%) |
| `home.bento.tax.formula` | before VAT = MRP ÷ 1.18 · SSCL = before VAT × 50% × 2.5% |
| `home.bento.tax.note` | This applies once VAT registration is on in Settings. The figures are an example, so please check your rates with your accountant. Tax disclaimer [C1] |
| **Card 4** `home.bento.hardware.title` | Use the printer and scanner you already have. |
| `home.bento.hardware.body` | CB POS works with 58mm and 80mm ESC/POS receipt printers connected through Windows, your network or USB, with any barcode scanner that types like a keyboard, and with cash drawers that open through the printer. [E1] [E4] |
| `home.bento.hardware.status` | Connected |
| **Card 5** `home.bento.receipts.title` | Receipts your customers can read. |
| `home.bento.receipts.body` | Pick Sinhala, Tamil or English for each till's receipts in Settings. CB POS prints Sinhala and Tamil as images, so the letters come out right on ordinary thermal printers. Item names print in English. [E2] [F2] |
| **Card 6** `home.bento.weigh.title` | Scan the scale label and the weight is in. |
| `home.bento.weigh.body` | Rice, dhal and vegetables sell to three decimal places. Scan the barcode label your scale prints and CB POS reads the weight, so nobody types 1.250 kg by hand. You can back everything up to a password-protected, AES-encrypted .ZIP on a USB drive. [D2] [E3] [G2] |

Tax demo default: MRP `1,180.00` → base `1,000.00`, VAT `180.00`. Rounding is half-up to 2 dp, display only.

### 3.5 Section 5 — How it works

| Key | Copy |
|---|---|
| `home.how.title` | From download to your first bill |
| `home.how.1.title` | Download the installer |
| `home.how.1.body` | It's one free file of about {sizeMb} MB, and you don't need an account or a card. Windows will ask your permission to install it. [A3] [A4] |
| `home.how.2.title` | Answer a few setup questions |
| `home.how.2.body` | Your shop's details, your receipt printer and an admin PIN. After that you can load practice data to try things out, or start with a clean shop. [I1] [I2] |
| `home.how.3.title` | Plug in and make a sale |
| `home.how.3.body` | Connect your printer and scanner, press F3 to find an item and F5 to take payment. [B1] [E1] |
| `home.how.cta` | Read the full setup guide |

### 3.6 Section 6 — FAQs

| Key | Question | Answer |
|---|---|---|
| `home.faq.1` | Is CB POS really free? What's the catch? | There's no catch to find. CB POS has no subscription, no trial that runs out, no locked features and no ads. Ceylon Byte keeps building it with help from shops and people who choose to donate. |
| `home.faq.2` | What happens to my sales if the internet goes down? | Nothing changes at the counter. CB POS saves every sale to a database on your own computer first, so you keep billing without the internet. The only thing it does online by itself is check for a newer version when it starts, and that check sends none of your shop's data. Because your data lives with you, Ceylon Byte can't see it and can't recover it either, so please set a backup password and keep encrypted .ZIP backups on a USB drive. [A7] [G1] [G2] |
| `home.faq.3` | Is CB POS approved by the IRD? | No, and we won't suggest it is. CB POS works out 18% VAT and 2.5% SSCL from your MRP using the rates you set, but the Inland Revenue Department hasn't certified or endorsed it. Your tax filings are your responsibility, so it's worth checking your settings with your accountant once. **Read the tax disclaimer.** |
| `home.faq.4` | Windows warned me about the installer. Is it a virus? | No. Windows shows that warning for new programs that aren't code-signed, and CB POS isn't signed yet. To check your `CBPOSSetup` file is genuine, compare its SHA-256 with the one on the download page, then click **More info** and **Run anyway**. A code-signing certificate is the first thing donations will pay for. [A5] |
| `home.faq.5` | Will it work with my printer, scanner and scale? | Probably, if they're the usual kinds. Receipt printers need to be 58mm or 80mm ESC/POS, connected as a Windows printer, over your network or by USB. Scanners need to type like a keyboard, and cash drawers need to open through the receipt printer. For scales, CB POS reads the barcode labels your scale prints; it doesn't connect to the scale by cable. If you're unsure about a model, ask in the WhatsApp community before you buy anything new. [E1] [E3] [E4] |
| `home.faq.title` | Questions shop owners ask before installing. | |

### 3.7 Section 7 — Final conversion banner

| Key | Copy |
|---|---|
| `home.final.title` | Your next bill could be on CB POS. |
| `home.final.body` | It's free, it keeps billing without the internet, it works out your VAT, and you can set it up yourself. |
| `home.final.cta` | Download CB POS for free |
| `home.final.secondary` | Read the setup guide |

Full-width `surface` band with a hairline top and bottom, crosshairs at all 4 corners, and a pointer-follow azure glow (desktop).

### 3.8 Section 8 — Global architectural footer

| Key | Copy |
|---|---|
| `footer.mission` | Free point-of-sale software for Sri Lankan shops, made in Sri Lanka by Ceylon Byte. |
| `footer.latest` | Latest: v{version} · {channel} |
| `footer.col.product` | Product: Download · Releases · Docs · Keyboard shortcuts |
| `footer.col.community` | Community: Merchant map · Feedback · Donate · WhatsApp community · Blog |
| `footer.col.legal` | Legal: Terms · Privacy · Tax disclaimer · Data safety · Cookies |
| `footer.legalLine` | CB POS comes as is, without a warranty. Its tax calculations aren't certified by the IRD, and keeping backups of your data is up to you. |
| `footer.copyright` | © {year} Ceylon Byte. Made in Sri Lanka. |
| `footer.build` | build {sha} |

---

## 4. Screen blueprints & Stitch prompts

Each blueprint lists the layout, components, states and key copy. Each Stitch prompt is used **after** the §1 preamble.

### S01 — Home
Blueprint: §3 above. States: stats loading → skeleton tiles; `shops = 0` → empty teaser copy; release unavailable → CTA still opens the gate, meta line hidden.

**Stitch prompt (desktop, 1440 wide):**
> Landing page for "CB POS", a free offline Windows point-of-sale for Sri Lankan shops. Sticky header: "[CB POS]" mono logo with a azure dot at left; nav "Product, Map, Docs, Releases, Donate"; right side a compact language switcher "EN · සිං · தமி", a moon icon, and nothing else. **Hero:** left half has a huge Geist ExtraBold headline "Keep billing when the internet goes down.", a muted lead paragraph about 18% VAT, 2.5% SSCL, Sinhala/Tamil/English receipts, then a large neon green #39FF14 button "Download CB POS for free" with a download icon, a ghost link "See how it works →", a tiny mono line "Windows 10 or later · v1.3.0 · — MB", and three small check items. Right half: an empty borderless #18181B frame labelled in small mono text "real CB POS capture" with a soft azure rim glow (the real screenshot is dropped in later; do not draw a fake POS interface), and a fine isometric line drawing of a 60-key keyboard behind it. Below: a telemetry strip of four mono stats separated by vertical hairlines: "0 ms", "Rs. 0 / mo", "—/25", "18% + 2.5%" each with a short muted label, plus a small dark map thumbnail of Sri Lanka with azure dots and the line "— shops. — districts. Live." (dashes stand for live numbers; never invent them) Then a problem section headed "Where a small shop loses money every day" with three hairline-bordered cards each with a thin red line across the top; a solution bento grid headed "Everything runs on the computer at your counter." of six cards (keyboard keycaps F3 / Enter / F5, Wi-Fi toggle, MRP→VAT→SSCL calculator in mono, printer connection types with azure dots, receipt with EN/SI/TA tabs, a scale label barcode becoming a "1.250 kg" cart line); a how-it-works section with three numbered steps (the numbers carry the install order) joined by a hairline; an FAQ accordion with plus icons; a full-width final banner "Your next bill could be on CB POS." with the green button; and a dark #18181B four-column footer with crosshair marks at grid intersections.

**Stitch prompt (mobile, 390 wide):**
> Same CB POS landing page at 390px wide. Header shows only the logo, a language button and a hamburger. Hero stacks: headline over 4 lines, lead, full-width green "Download CB POS for free" button (56px tall), the mono meta line, three check items, then the product screenshot below. The telemetry strip becomes a 2×2 grid of stats followed by a full-width map thumbnail card. Problem cards stack. The bento grid becomes a single column of six cards, each with its small interactive demo. Steps are vertical with a vertical hairline connecting numbers 1–3. FAQ is a full-width accordion. The footer stacks its four columns with hairline separators. 16px side padding, no horizontal scroll.

---

### S02 — Download Gate

**S02-a Step 1 — Your shop**

| Key | Copy |
|---|---|
| `gate.step` | Step {n} of 2 |
| `gate.s1.title` | Tell us a little about your shop |
| `gate.s1.lead` | It takes about half a minute. We use these details to help if something goes wrong. Your shop only appears on the public map if you choose that on the next step. |
| `gate.fullName.label` | Your full name |
| `gate.shopName.label` | Shop name |
| `gate.shopName.placeholder` | For example, Perera Stores |
| `gate.category.label` | What kind of shop is it? |
| `gate.category.options` | Grocery · Mini-mart / supermarket · Pharmacy · Hardware · Bookshop & stationery · Textile & fashion · Mobile & electronics · Bakery & sweets · Cosmetics · Agro & fertilizer · Wholesale · Café / takeaway · Other |
| `gate.phone.label` | Phone number |
| `gate.phone.help` | A mobile or landline number. We never show it publicly. |
| `gate.whatsapp.label` | WhatsApp number (optional) |
| `gate.whatsapp.same` | Same as my phone number |
| `gate.s1.cta` | Continue |
| `errors.INVALID_PHONE` | That doesn't look like a Sri Lankan number. Try something like 77 123 4567. |
| `errors.required` | Please fill this in to continue. |

**S02-b Step 2 — Location**

| Key | Copy |
|---|---|
| `gate.s2.title` | Where is your shop? |
| `gate.district.label` | District |
| `gate.city.label` | Town or city |
| `gate.city.useTyped` | Use "{typed}" |
| `gate.detect` | Use my current location |
| `gate.detect.denied` | Your browser didn't share your location, and that's fine. Choose your district and drag the pin to your shop instead. |
| `gate.detect.approx` | We could only find your location roughly. Drag the pin to your shop's entrance. |
| `errors.LOCATION_OUTSIDE_SRI_LANKA` | That point is outside Sri Lanka. Drag the pin to where your shop is. |
| `gate.pin.help` | Drag the pin to your shop's entrance. |
| `gate.public.label` | Show my shop on the public CB POS map |
| `gate.public.help` | People will see your shop's name, its type and its town. Your name and phone numbers always stay private, and you can ask us to remove the listing at any time. |
| `gate.terms.label` | I understand that CB POS is free software provided as is, that my tax calculations and IRD filings are my own responsibility, and that I need to keep my own backups. |
| `gate.terms.links` | Terms · Tax disclaimer · Data safety |
| `gate.s2.back` | Back |
| `gate.s2.cta` | Download CB POS |
| `gate.s2.submitting` | Starting your download… |

**S02-c What Next**

| Key | Copy |
|---|---|
| `gate.done.title` | Your download has started. |
| `gate.done.file` | {fileName} · {sizeMb} MB |
| `gate.done.hashLabel` | SHA-256 |
| `gate.done.verify` | How to check this file |
| `gate.done.smartscreen.title` | If Windows says "Windows protected your PC" |
| `gate.done.smartscreen.body` | That warning is normal for new programs that aren't code-signed yet. Click **More info**, then **Run anyway**. |
| `gate.done.steps.title` | What to do next |
| `gate.done.steps.1` | Open the file you just downloaded. Windows asks for your permission, then the installer starts. [A4] |
| `gate.done.steps.2` | Fill in the setup screens: your shop's details, your printer and an admin PIN. If they don't appear, sign in with the PIN **1234** and change it straight away under Users. [I1] |
| `gate.done.steps.3` | Plug in your printer and scanner, then press F3 to find an item and F5 to take payment. [B1] |
| `gate.done.whatsapp` | Join the CB POS WhatsApp community (links to `WHATSAPP_COMMUNITY_URL` = `https://chat.whatsapp.com/BS73D23VD74BbseKuoC1BM`) |
| `gate.done.claim.title` | Keep your listing in your hands |
| `gate.done.claim.body` | Create a free account so you can change your shop's details, or remove them, whenever you like. |
| `gate.done.claim.cta` | Create an account |
| `gate.done.retry` | Download didn't start? Try again |
| `gate.done.mobile` | On your phone? Send this link to the computer in your shop. |
| `gate.done.mobileShare` | Share the link |
| `gate.leave.confirm` | Leave now? We'll keep what you typed on this device until you close the browser. |

**Stitch prompt (desktop dialog):**
> A centred modal dialog (560px wide, #252526, 1px #3E3E42 border, 6px radius) over a dimmed dark landing page. Header: "Step 1 of 2" in mono with a two-segment progress bar (first segment azure), and a close X. Title "Tell us a little about your shop" in Geist bold, a one-line muted lead. Form fields stacked with labels above: "Your full name", "Shop name" (placeholder "For example, Perera Stores"), "Business type" select, "Phone number" with a fixed mono "+94" prefix segment and helper "A mobile or landline number. We never show it publicly.", "WhatsApp number (optional)" with "+94" prefix and a small checkbox "Same as my phone number". Footer: a full-width neon green #39FF14 "Continue" button with dark bold text. Show a second variant for Step 2: title "Where is your shop?", District and Town selects side by side, a secondary button with a crosshair-target icon "Use my current location", a 200px-tall dark map of Sri Lanka with a single azure pin, a checkbox "Show my shop on the public CB POS map" with helper text, a required checkbox with the as-is/tax/backup statement and three small azure links, and footer buttons "Back" (secondary) and "Download CB POS" (green). Show a third variant "Your download has started." with a azure check, a mono file name, a SHA-256 hash box with a copy icon, a yellow-bordered note about Windows SmartScreen ("More info → Run anyway"), three numbered next steps, a WhatsApp community link, and a small card "Save your listing" with a secondary "Create account" button.

**Stitch prompt (mobile bottom sheet):**
> The same download form as a mobile bottom sheet covering 92% of a 390×844 screen, with a small grey drag handle at the top, 6px top corners, the same fields full-width, inputs 48px tall, and the green primary button pinned to the bottom above the safe area.

---

### S03 — Merchant Map

**Layout:** desktop: a 360px left panel (search, filters, district coverage grid, result list) + full-height map on the right. Mobile: full-screen map with a floating search bar on top and a Vaul results sheet (peek 120px → 50% → 92%).

| Key | Copy |
|---|---|
| `map.meta.title` | Shops using CB POS across Sri Lanka |
| `map.title` | Shops using CB POS across Sri Lanka |
| `map.subtitle` | {shops} shops in {covered} of 25 districts. We never show phone numbers. |
| `map.search.placeholder` | Search for a shop or town |
| `map.filter.district` | All districts |
| `map.filter.category` | All business types |
| `map.filter.supporters` | Gold Supporters only |
| `map.coverage.title` | Districts with CB POS shops |
| `map.results.inView` | {count} shops in view |
| `map.popup.since` | Using CB POS since {monthYear} |
| `map.popup.supporter` | Gold Supporter |
| `map.popup.directions` | Get directions |
| `map.popup.report` | Report this listing |
| `map.addShop` | Add my shop |
| `map.empty` | No shops are on the map yet. Yours could be the first. |
| `map.error` | We couldn't load the shop list just now. |
| `map.retry` | Try again |
| `map.noWebgl` | This device can't show the interactive map, so here's the list instead. |
| `map.attribution` | © OpenStreetMap contributors · Protomaps |

States: loading (panel skeleton + map tiles), empty, error, no-WebGL list mode, filtered-empty ("No shops match. Clear filters").

**Stitch prompt:**
> A full-screen dark map page for "CB POS Merchant Map". The left panel is 360px wide, #252526, with a hairline right border: title "Shops using CB POS across Sri Lanka", a mono subtitle "— shops in —/25 districts" (live numbers), a search input "Search for a shop or town", two selects "All districts" and "All business types", a toggle "Gold Supporters only", a 5×5 grid of small square cells labelled with district abbreviations (lit cells have a azure border, unlit cells are dim), then a scrolling list of shops (shop name, category · town in muted text, a small gold "Gold Supporter" badge on some). The right side is a near-black vector map (land #1E1E1E, water #141414, thin grey roads, Latin-script labels) tightly framed on Sri Lanka, with azure cluster circles showing counts in mono, individual azure dots with soft halos, and a few gold dots. One popup is open on a gold pin: shop name "Perera Stores", "Grocery · Kurunegala", mono "CB POS user since Aug 2026", a gold badge, and a azure "Get directions →" link. Minimal square zoom controls with hairline borders. Small attribution text at the bottom right. No phone numbers anywhere.

---

### S04 — Docs Hub

| Key | Copy |
|---|---|
| `docs.hub.title` | CB POS help |
| `docs.hub.lead` | Guides for setup, billing, tax settings, printers and backups, in English, Sinhala and Tamil. |
| `docs.search.trigger` | Search the help pages |
| `docs.search.hint` | ⌘K |
| `docs.startHere` | Start here |
| `docs.startHere.items` | Install CB POS · Get past Windows SmartScreen · First login and the default PIN · Connect a receipt printer |
| `docs.categories` | Getting Started · Cashiering · Products & Inventory · Tax · Hardware · Receipts · Backup & Restore · Multiple tills · Troubleshooting · Release Notes |
| `docs.help.title` | Can't find what you need? |
| `docs.help.body` | Ask in the WhatsApp community, or send us your question and we'll point you to the answer. |

**Stitch prompt:**
> A documentation home page in the CB POS dark style. Top: title "CB POS help", a muted lead, and a wide search field-button "Search the help pages" with a "⌘K" keycap on the right. A "Start here" row of four compact link cards with Lucide icons (download, shield, key, printer). Below, a 5×2 grid of category cards separated by shared 1px hairlines (no gaps), each with a small icon, a title (Getting Started, Cashiering, Products & Inventory, Tax, Hardware, Receipts, Backup & Restore, Multiple tills, Troubleshooting, Release Notes) and an article count in mono. The Tax card has a small yellow "Disclaimer" tag. A footer help strip: "Can't find what you need?" with links to the WhatsApp community and "Open a question ticket". Crosshair marks at the grid corners.

---

### S05 — Doc Article

**Layout:** Fumadocs `DocsLayout`. Left sidebar (category tree, 280px), centre article (max 72ch), right TOC (xl+). Mobile: sidebar in a sheet, TOC as a collapsible "On this page".

| Key | Copy |
|---|---|
| `docs.article.appliesTo` | For version {version} and later |
| `docs.article.updated` | Updated {date} |
| `docs.article.onThisPage` | On this page |
| `docs.article.helpful` | Did this page help? |
| `docs.article.yes` | Yes |
| `docs.article.no` | No |
| `docs.article.reason` | What was missing? (optional) |
| `docs.article.thanks` | Thank you. This tells us what to fix. |
| `docs.article.prev` | Previous |
| `docs.article.next` | Next |
| `docs.fallback.banner.si` | This page isn't in Sinhala yet, so you're reading the English version. |
| `docs.fallback.banner.ta` | This page isn't in Tamil yet, so you're reading the English version. |
| `docs.tax.callout` | CB POS works out tax from the rates you set. The IRD hasn't certified it, so please check your settings with a qualified accountant. Read the tax disclaimer. |
| `docs.copy` | Copy |
| `docs.copied` | Copied |

**Stitch prompt:**
> A dark documentation article page. Left sidebar with a collapsible tree (Getting Started expanded, "Install CB POS" highlighted with a 1px azure rule). Centre: breadcrumb "Docs / Getting Started", H1 "Install CB POS", mono badges "Applies to v1.4+" and "Updated 21 Oct 2026", body text in Inter, a numbered steps component with hairline connectors, a tip callout with a 1px azure rule, a borderless screenshot of a Windows installer on a #18181B backdrop, inline keycaps "Ctrl" "K", and a code block for a PowerShell command "Get-FileHash .\CBPOSSetup-1.3.0.exe -Algorithm SHA256" with a copy button. Right column: "On this page" table of contents in small muted text with the active item in azure. Bottom: "Was this helpful? Yes / No" and Previous/Next cards.

---

### S06 — Releases

| Key | Copy |
|---|---|
| `releases.title` | Releases |
| `releases.lead` | Every version of CB POS, with the SHA-256 for each installer so you can check your download is genuine. |
| `releases.latest` | Latest version |
| `releases.published` | Released {date} |
| `releases.download.exe` | Download the installer (.EXE) |
| `releases.verify.title` | Check that your download is genuine |
| `releases.verify.body` | Open PowerShell in your Downloads folder and run this command. The result should match the SHA-256 above exactly. If it doesn't, delete the file and download it again. |
| `releases.verify.file` | Your file is called `CBPOSSetup-{version}.exe`. [A3] |
| `releases.verify.ps` | `Get-FileHash .\{fileName} -Algorithm SHA256` |
| `releases.verify.cmd` | `certutil -hashfile {fileName} SHA256` |
| `releases.yanked` | We withdrew this version. Please don't install it. |
| `releases.changelog` | What changed |
| `releases.asIs` | CB POS comes as is, without a warranty. Back up your data before you update. |
| `releases.unavailable` | We can't show release details right now. Please try again in a few minutes. |

**Stitch prompt:**
> A dark "Releases" page. At the top, a large card for the latest stable version: mono "v1.3.0", "Released 27 Sep 2026", "Windows 10 or later", and one green button "Download installer (.EXE) — — MB". Under it is one SHA-256 hash box in mono with copy icons, then a collapsible "Check that your download is genuine" panel showing PowerShell and certutil commands in code blocks. A small muted as-is warning line. Below, a "What changed" timeline: a vertical hairline with version nodes, each a mono version, date, and markdown notes with "Added / Fixed / Changed" subheadings. One older version is shown struck through with a red "Withdrawn" tag. There is no beta toggle; CB POS has one stable channel.

---

### S07 — Feedback Board

| Key | Copy |
|---|---|
| `feedback.title` | Feedback |
| `feedback.lead` | Tell us what's broken or what you'd like next. We read every ticket and post updates on it here. |
| `feedback.new.bug` | Report a problem |
| `feedback.new.feature` | Suggest a feature |
| `feedback.tabs` | All · Bugs · Features |
| `feedback.filter.status` | Any status |
| `feedback.sort` | Most votes · Newest |
| `feedback.status.*` | Open · Triaged · Planned · In progress · Shipped · Closed · Duplicate · Won't fix |
| `feedback.shippedIn` | Fixed in v{version} |
| `feedback.empty` | No tickets match these filters. |
| `feedback.clear` | Clear filters |
| `feedback.vote` | Vote |
| `feedback.voted` | Voted |

**Stitch prompt:**
> A dark public feedback board. The header has the title "Feedback", a muted lead, and two buttons on the right: secondary "Suggest a feature" and secondary "Report a problem" (no green on this page). Tabs "All · Bugs · Features", a status select, and a sort toggle "Most votes / Newest". A list of ticket rows separated by hairlines: on the left a vote box (an up chevron and a mono count, azure when voted); in the middle a mono ticket number "CB-0142", a title, and a type tag (bug icon or lightbulb); on the right a status pill with a coloured dot ("Planned" yellow dot, "Shipped" green dot with "Fixed in v1.4.3", "Open" azure dot) and a relative date. Pagination at the bottom in mono.

---

### S08 — Ticket Submit & Detail

**Submit (`/feedback/new`)**

| Key | Copy |
|---|---|
| `ticket.new.title` | Tell us what happened |
| `ticket.type.label` | What's this about? |
| `ticket.type.bug` | Something isn't working |
| `ticket.type.feature` | I'd like something new |
| `ticket.type.question` | I have a question |
| `ticket.title.label` | Short title |
| `ticket.title.placeholder` | For example, receipts cut off halfway on a 58mm printer |
| `ticket.similar.title` | Is it one of these? |
| `ticket.similar.vote` | Vote for this one instead |
| `ticket.body.label` | Tell us more |
| `ticket.body.help.bug` | What were you doing, what did you expect, and what happened instead? |
| `ticket.version.label` | CB POS version |
| `ticket.version.unknown` | I'm not sure |
| `ticket.windows.label` | Windows version |
| `ticket.severity.label` | How much is this affecting you? |
| `ticket.severity.options` | CB POS closes or crashes · I can't bill customers · Totals or receipts are wrong · Something looks wrong |
| `ticket.log.label` | Error log (optional) |
| `ticket.log.help` | In CB POS, go to Settings › Admin Tools › Error Logs and click Export Logs. It saves `cbpos_logs.txt`, up to 5 MB. Please remove any passwords or network addresses before you upload it. Only our team sees logs. [J1] [H9] |
| `ticket.shot.label` | Screenshot (optional) |
| `ticket.shot.help` | PNG or JPG, up to 5 MB. We keep it private unless we mark it safe to show. |
| `ticket.contact.label` | Email or phone (optional) |
| `ticket.contact.help` | Only the Ceylon Byte team sees this, and only to follow up on your ticket. |
| `ticket.submit` | Send ticket |
| `ticket.created` | Ticket {number} is in. We'll post updates on it here. |
| `ticket.question.done` | Thank you. These pages might already answer your question: |
| `errors.FILE_TOO_LARGE` | That file is bigger than 5 MB. Please choose a smaller one. |
| `errors.FILE_TYPE_NOT_ALLOWED` | We can't accept that type of file here. |

**Detail (`/feedback/CB-0142`)**: title, number, type, status timeline (Open → Triaged → Planned → In progress → Shipped, with dates), body (Markdown), version/Windows/severity chips, public screenshot (if approved), the "Ceybyte team" response block (azure left border), and a vote button.

**Stitch prompt:**
> Two dark screens side by side. **Left: "Tell us what happened" form.** Three large selectable option cards in a row ("Something isn't working" with a bug icon, "I'd like something new" with a lightbulb, "I have a question" with a message icon; the first is selected with a azure border). A "Short title" input. Below it, a muted panel "Is it one of these?" listing two similar tickets, each with a mono vote count and a link "Vote for this one instead". A Markdown textarea "Tell us more", selects for "CB POS version" and "Windows version", a severity radio group, two dashed-border dropzones "Crash log (optional)" and "Screenshot (optional)" (one showing an upload progress bar in azure at 64%), an optional contact input, and a secondary-styled "Send ticket" button (no green). **Right: ticket detail "CB-0142".** Mono number, title, a horizontal status timeline with five steps (three completed in azure), chips "v1.3.0", "Windows 11", "Can't bill", the description text, and a response block with a 1px azure rule labelled "Ceybyte team". A vote box with a count.

---

### S09 — Donate

**Layout:** a two-column hero (pitch + what it funds | donation card), then the supporters wall and the transparency block.

| Key | Copy |
|---|---|
| `donate.title` | Help keep CB POS free for every shop in Sri Lanka. |
| `donate.lead` | CB POS has no subscription and no ads. Donations from shops and supporters pay for development, test equipment and a code-signing certificate. Giving is entirely optional, and the software is the same either way. |
| `donate.funds.title` | Where your donation goes |
| `donate.funds.items` | A code-signing certificate, so Windows stops warning people · Printers, scanners and scales to test with · Sinhala and Tamil translation · Hosting beyond the free plans |
| `donate.method.title` | Donate by bank transfer |
| `donate.method.help` | Use online banking, your banking app or CEFT, or deposit cash at any branch. |
| `donate.amount.label` | Amount |
| `donate.amount.chips` | Rs. 500 · Rs. 1,000 · Rs. 2,500 · Rs. 5,000 · Other |
| `donate.amount.min` | The minimum is Rs. 100.00 |
| `donate.name.label` | Name on the supporters wall |
| `donate.anonymous` | Keep my name private |
| `donate.message.label` | A message for the wall (optional, up to 140 characters) |
| `donate.showAmount` | Show my amount on the wall |
| `donate.link.label` | My shop is on the map. Add a Gold Supporter badge to my pin. |
| `donate.link.phone` | The phone number used for your listing |
| `donate.contact.label` | Email or phone, in case we need to check your transfer (optional, private) |
| `donate.create` | Show the bank details |
| `donate.ref.title` | Your reference: {ref} |
| `donate.ref.help` | Please add this reference to the transfer remark so we can match your donation. |
| `donate.bank.details` | Account name · Account number · Bank · Branch (each with a copy button; values from `DONATION_*` env vars) |
| `donate.slip.label` | Upload your deposit slip or a screenshot of the transfer |
| `donate.slip.help` | JPG, PNG or PDF, up to 5 MB. |
| `donate.txnRef.label` | Bank transaction reference (optional) |
| `donate.txnRef.help` | This helps us find your transfer faster. |
| `donate.submit` | Send for checking |
| `donate.pending.title` | Thank you. We'll confirm within 48 hours. |
| `donate.pending.body` | Once we've matched your transfer, your name appears on the supporters wall, and your shop's pin turns gold if you linked it. |
| `donate.approved.title` | Thank you. We've received your donation. |
| `donate.resume` | Already transferred? Upload your slip |
| `donate.wall.title` | Supporters |
| `donate.wall.anonymous` | Anonymous supporter |
| `donate.transparency.title` | Donations this month |
| `donate.transparency.body` | Rs. {total} from {count} supporters, updated daily. |
| `donate.legal` | Donations are voluntary and don't unlock any features. They aren't tax-deductible, and we can't refund them except where the law requires it. |

**Stitch prompt:**
> A dark donation page. Left: headline "Help keep CB POS free for every shop in Sri Lanka.", a muted lead, and a list "Where your donation goes" with four hairline-separated rows with icons. Right: a donation card (#252526, 6px radius) titled "Donate by bank transfer" with a muted line "Online banking, your banking app, CEFT, or a cash deposit at any branch.", amount chips in mono "Rs. 500, Rs. 1,000, Rs. 2,500, Rs. 5,000, Other" (one selected in azure), a name input with an "Keep my name private" checkbox, an optional message input with a "0/140" counter, a checkbox "Link to my shop on the map" with a small gold badge preview, and a gold #FFD700 button "Show the bank details" with dark text. Show the next state below the card: a mono reference "CB-DN-7K3Q9P" with a copy button, a key-value list of bank details (Account name, Account number in mono, Bank, Branch) each with a copy icon, a dashed dropzone "Upload your deposit slip or transfer screenshot" (JPG, PNG or PDF, up to 5 MB), an optional input "Bank transaction reference", and a gold "Send for confirmation" button. Below the main area: a "Supporters" wall grid of small hairline cards (name or "Anonymous supporter", month in mono, a gold award icon on some) and a transparency strip "Donations this month: Rs. — from — supporters" (live numbers). Small legal text at the bottom. No green on this page; gold is the accent.

---

### S10 — Blog (index + post)

| Key | Copy |
|---|---|
| `blog.title` | Blog |
| `blog.lead` | Release notes in plain language, tax changes explained, and stories from shops using CB POS. |
| `blog.tags.all` | All |
| `blog.readingTime` | {minutes} min read |
| `blog.alsoInEnglish` | Also available in English |
| `blog.related` | Related posts |
| `blog.rss` | RSS feed |
| `blog.empty` | No posts in this language yet. |

**Stitch prompt:**
> A dark blog index and article. **Index:** title "Blog", a muted lead, a row of tag pills (All, Releases, Tax, Shop stories, Hardware) with the active pill azure-bordered, and a featured post spanning full width (a cover image of a real POS counter on a #18181B backdrop, title in Geist ExtraBold, excerpt, mono meta "21 Oct 2026 · 5 min read"). Below it, a 3-column grid of post cards separated by hairlines. A small section "Also in English" lists two posts with an "EN" mono tag. **Article:** max 72-character text column, a large title, mono meta, a borderless cover, body with H2s, a pull quote with a 1px azure rule, a table of VAT examples in mono, and "Related posts" at the end.

---

### S11 — Legal Center

| Key | Copy |
|---|---|
| `legal.nav` | Terms · EULA · Privacy · Tax disclaimer · Data safety · Cookies |
| `legal.updated` | Last updated {date} · Version {version} |
| `legal.prevails` | If translations differ, the English version applies. |
| `legal.tax.summary` | When you turn on VAT registration, CB POS works out VAT backward from the MRP (price before VAT = MRP ÷ 1.18 at 18%) and SSCL at 2.5% on 50% of that price before VAT, using the rates you set. Amounts are rounded to the cent with round-half-even. CB POS is not certified, approved or endorsed by the Inland Revenue Department. You're responsible for checking rates, registration thresholds and filings with a qualified accountant. [C1] [C2] [C5] |
| `legal.data.summary` | CB POS keeps your data in a SQLite file on your PC. The file isn't encrypted, so protect the Windows account it lives in. Backups are AES-encrypted .ZIP files that need a backup password; without one, automatic backups don't run. Ceybyte can't see or recover your data. If you use network mode, your PostgreSQL server holds the data and CB POS backups don't cover it. [G1] [G2] [G4] |
| `legal.asIs.summary` | CB POS is free, proprietary software by Ceylon Byte, provided "as is" without warranty of any kind. You may use it for free but not copy, modify or redistribute it. Ceylon Byte isn't liable for losses from its use, including lost data, incorrect tax calculations or business interruption, to the extent Sri Lankan law allows. [K1] |
| `legal.privacy.summary` | We collect what each feature needs: shop details from the download form, tickets you send, donations you make, and account details if you sign up. Phone numbers are never public. The CB POS app itself checks GitHub for updates each time it starts, sending no shop data, and sends nothing else unless you set up email, LAN Sync, a network database or a network printer. You can ask us to correct or delete your data at any time. [A7] [A8] |

Each page has a "Summary" box (`surface-legal`, hairline) at the top in plain language, then the full text. The page uses `surface-legal` as its background tone.

**Stitch prompt:**
> A calm, text-focused legal page in the dark CB POS style with a #18181B background. Left: a sticky vertical nav (Terms, Privacy, Tax disclaimer, Data safety, Cookies) with the active item marked by a 1px azure rule and a surface step. Centre: title "Tax disclaimer", a mono line "Last updated 21 Oct 2026 · Version 2026-10-01", a hairline-bordered "Summary" box with three short plain-language paragraphs, then numbered sections in readable Inter body text (max 70 characters wide). A small note at the end: "If translations differ, the English version applies." No accents except azure links.

---

### S12 — Sign in / Sign up

| Key | Copy |
|---|---|
| `auth.title.signin` | Sign in |
| `auth.title.signup` | Create your account |
| `auth.claim.context` | Create an account to look after your shop's listing on the CB POS map. |
| `auth.google` | Continue with Google |
| `auth.or` | or |
| `auth.email.label` | Email |
| `auth.otp.sent` | We sent a 6-digit code to {email}. It can take a minute to arrive. |
| `auth.otp.label` | 6-digit code |
| `auth.submit` | Continue |
| `auth.switch.toSignup` | New here? Create an account |
| `auth.switch.toSignin` | Have an account? Sign in |
| `auth.error.invalid` | That code is wrong or has expired. Send a new one. |
| `auth.otp.send` | Email me a sign-in code |
| `auth.otp.resend` | Send a new code |
| `auth.error.banned` | This account is turned off. Please contact us if you think that's a mistake. |

**Stitch prompt:**
> A minimal dark sign-in screen centred on a grid background with crosshair marks. A 420px card: the "[CB POS]" logo, title "Create your account", a muted context line "Create an account to manage your shop on the CB POS map.", a secondary full-width "Continue with Google" button with the Google G icon in monochrome, an "or" divider with hairlines, an email input with a secondary "Email me a sign-in code" button, then (second state) six single-digit mono code boxes, a secondary-styled full-width "Continue" button (no green on this screen), and a footer link "Have an account? Sign in".

---

### S13 — Merchant Dashboard

**Layout:** a left side nav (Overview, My listing, My tickets, My donations, Settings), with content on the right. Mobile: a top tab scroller.

| Key | Copy |
|---|---|
| `dash.overview.title` | Your shop |
| `dash.status.listed` | Shown on the map |
| `dash.status.private` | Not shown on the map |
| `dash.status.hidden` | We're reviewing it |
| `dash.status.hiddenBody` | We're taking a quick look at your listing. You can keep editing it while we do. |
| `dash.supporter` | Gold Supporter since {monthYear} |
| `dash.update.available` | Version {version} of CB POS is ready. |
| `dash.update.cta` | See what's new |
| `dash.listing.title` | My listing |
| `dash.listing.public` | Show my shop on the public map |
| `dash.listing.save` | Save changes |
| `dash.listing.saved` | Saved. The map shows your changes within a minute. |
| `dash.empty.title` | There's no shop linked to this account yet |
| `dash.empty.body` | Download CB POS from this browser to add your shop, or contact us if you've already registered it. |
| `dash.tickets.title` | My tickets |
| `dash.donations.title` | My donations |
| `dash.settings.language` | Language |
| `dash.settings.delete.title` | Delete my listing and account |
| `dash.settings.delete.body` | Your shop disappears from the map straight away, and we erase your personal details within 30 days. This can't be undone. |
| `dash.settings.delete.confirm` | Type your shop name to confirm |
| `dash.settings.delete.cta` | Delete permanently |

**Stitch prompt:**
> A dark merchant dashboard. Left nav (#252526, hairline right border): logo, then "Overview, My listing, My tickets, My donations, Settings" with the active item marked by a 1px azure rule and a surface step. Main area "Your shop": a summary card with shop name "Perera Stores", "Grocery · Kurunegala", a status pill "Shown on the map" with a azure dot, a gold "Gold Supporter since Aug 2026" badge, and an info strip "CB POS v1.3.1 is available. See what's new". Below it, the "My listing" form: shop name, business type, district and town selects, a 240px dark mini-map with a draggable azure pin, a toggle "Show my shop on the public map", and a secondary "Save changes" button. At the bottom of Settings, a "Danger zone" card with a red-outlined "Delete permanently" button.

---

### S14 — Admin Console

**Layout:** an English-only, dense, keyboard-first console. The top bar has global search (`/`) and a shortcut help button (`?`). The left nav has modules with count badges. Content areas are queue lists with a detail pane on the right (split view).

| Module | Key elements |
|---|---|
| Overview | KPI tiles (today's gate submissions, downloads, pending slips, open tickets, districts covered) + sparkline of daily downloads (14 days) |
| Merchants | Table (shop, district, category, status, public, supporter, created) + filters + detail drawer with contacts (masked by default, "Reveal" logs an audit entry) |
| Donations | Queue `pending_review` oldest first. The detail pane has the slip preview (iframe/img), amount, reference, method, linked merchant, and Approve `a` / Reject `r` (reason select + note) |
| Feedback | Triage queue + status select + duplicate picker + release picker + response editor + "Mark screenshot safe" |
| Docs | Category tree (drag to sort), article list by translation group showing EN/SI/TA status dots, split Markdown editor + live preview, Publish button, "Rebuild search index" |
| Blog | Post list, editor, cover upload, schedule picker |
| Releases | Table of synced releases, "Force sync", yank toggle, last sync status |
| Users | Table, role select, ban/unban |
| Audit | Reverse-chronological list with actor, action, entity, diff viewer |

| Key | Copy |
|---|---|
| `admin.donations.approve` | Approve (a) |
| `admin.donations.reject` | Reject (r) |
| `admin.donations.rejectReasons` | Amount doesn't match · Slip unreadable · Duplicate · Not found in statement · Other |
| `admin.merchants.reveal` | Reveal contact (logged) |
| `admin.docs.publish` | Publish |
| `admin.docs.reindex` | Rebuild search index |
| `admin.releases.forceSync` | Sync now |
| `admin.shortcuts.title` | Keyboard shortcuts |

**Stitch prompt:**
> A dense dark admin console for "CB POS Admin". A top bar with the logo, a global search field showing a "/" keycap hint, and a "?" shortcuts button. A left nav with modules (Overview, Merchants, Donations, Feedback, Docs, Blog, Releases, Users, Audit) and small mono count badges (Donations "7", Feedback "12"). The main area shows the Donations queue in split view: on the left a list of items (mono reference "CB-DN-7K3Q9P", "Rs. 2,500.00", method icon, relative time), with the selected item marked by a 1px azure rule and a surface step; on the right a detail pane with a large preview of a bank deposit slip image, a key-value list (Amount, Reference, Method, Display name, Linked shop "Perera Stores · Kurunegala"), and two buttons at the bottom: "Approve" with an "A" keycap and a red-outlined "Reject" with an "R" keycap. Compact 44px rows, mono numbers right-aligned, hairline row separators, no green except a small success toast in the corner reading "Approved CB-DN-7K3Q9P".

---

## 5. Microcopy standards

| Situation | Pattern | Example |
|---|---|---|
| Button | Verb + object | "Upload slip", "Send ticket" |
| Error | What happened + what to do, never blame the reader | "That file is bigger than 5 MB. Please choose a smaller one." |
| Empty state | Fact + one action | "No tickets match these filters." · "Clear the filters" |
| Success toast | Past tense, specific, says what happens next | "Ticket CB-0142 is in. We'll post updates on it here." |
| Loading | Present continuous, specific | "Starting your download…", "Uploading your slip… 64%" |
| Rate limit | Fact + time | "That's a lot of tries in a short time. Please wait 45 seconds and try again." |
| Offline banner | Fact + reassurance | "You're offline. CB POS keeps billing without the internet, but this website needs a connection." |
| Numbers | Mono, Western digits, `Rs. 1,250.00`, `1.250 kg`, `v1.3.0`, `{covered}/25` | — |
| Dates | `21 Oct 2026` (en). Localized month names in si/ta via `Intl` | — |

**How the copy should feel.** Every string is written for a shop owner who has been burned before: by a POS that froze when the internet dropped, by a subscription that kept charging, by software they couldn't read. Write the way a helpful person at the counter would talk to them. The rules are in `03-DESIGN.md §11` and the copy gate in `CLAUDE.md §7.2`.

**Banned words** (CI grep on `messages/en.json`): seamless, revolutionize, revolutionary, unlock, elevate, empower, cutting-edge, game-changer, robust, leverage, effortless, next-gen, world-class, IRD approved, IRD certified, officially compliant, guaranteed compliance.
