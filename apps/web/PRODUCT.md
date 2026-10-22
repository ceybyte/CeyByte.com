# Product

<!-- impeccable:product-schema 1 -->

Drafted from `docs/01-PRD.md` and the CB POS facts audit (`docs/00-CBPOS_FACTS.md`, local only); confirmed by the owner before design work.

## Platform

web

## Users

- **Primary:** owners and cashiers of small Sri Lankan retail shops (grocery *kade*, mini-marts, pharmacies, hardware, bookshops). Often Sinhala- or Tamil-first, reading on a budget Android phone over mobile data, then installing on an old Windows 10 PC at the counter. Job: decide whether CB POS is trustworthy and free, download it, get it running, and get help in their own language.
- **Secondary:** IT freelancers and installers who set up POS for many shops (English-fluent, want hashes, setup references, shortcuts, bug tracker); supporters who donate by bank transfer; 1–3 Ceylon Byte maintainers running the admin console.

## Product Purpose

ceybyte.com is the only online touchpoint for CB POS, a free, offline-first, keyboard-first Windows point-of-sale app. The site converts a visiting shop owner into an installed user (download gate → installer → setup guide), hosts trilingual docs and a public bug/feature tracker, shows real adoption on a privacy-safe Sri Lanka merchant map, and collects donations. Success: shop owners download and set up CB POS without phone support, in Sinhala, Tamil or English.

## Positioning

Free forever, bills without internet, and works out Sri Lankan VAT and SSCL backward from the shelf MRP — with receipts in Sinhala, Tamil or English. Cloud POS products stop when the router drops and charge monthly; CB POS keeps every sale on the shop's own PC.

## Operating Context

- Readers arrive from WhatsApp shares and search, mostly on phones, often on slow mobile data and in bright shop light.
- The product is used at a counter with a keyboard, barcode scanner, thermal printer and cash drawer; F-keys drive billing (F3 search, F5 pay, F12 quick cash).
- The installer is unsigned, so Windows SmartScreen warns on first run; the site must walk people through it.
- Trilingual at every point: `en`, `si`, `ta`, with Latin-script product terms (CB POS, VAT, SSCL, MRP).

## Capabilities and Constraints

- Static site + one API Worker on Cloudflare's free plan (branch `free`); a VPS variant exists on `main`.
- Every product claim must match the facts audit; features not yet shipped are never advertised (`docs/08-UPSTREAM_REQUESTS.md`).
- Never claim IRD approval or certification; CB POS *calculates* tax.
- Merchant phone numbers and names are never public.
- Live numbers (shops on the map, districts covered) are fetched, never invented.

## Brand Commitments

- Name: **CB POS** (non-breaking space), by **Ceylon Byte**, at **ceybyte.com**. Wordmark `[CB POS]` in monospace with a pulsing azure dot.
- Voice: a helpful person at the counter. Plain, warm and specific; names the shop owner's worry, then the fact that settles it; honest about limits; numbers before adjectives (03-DESIGN §11, humanizer skill).
- The visual system is specified and binding: `docs/03-DESIGN.md` (dark-first `#1E1E1E` canvas, 60-30-10 with a single `#39FF14` download CTA per viewport, `#0393DD` azure, `#FFD700` gold for supporters only, Geist / Inter / Noto Sans Sinhala / Noto Sans Tamil / JetBrains Mono, hairline grids with crosshairs, `@lucasmarkes/hairline` figures).
- Brand source: Vivid Azure (`#0EAAE9`, `#0393DD`, `#017FD2`, `#016CC7`) from the Ceylon Byte CB monogram, used as a subtle gradient. The desktop app still uses navy `#001F3F` and cyan `#00BCEB`.

## Evidence on Hand

- Real: the installer and SHA-256 hashes on GitHub Releases; the app's logo and monogram files; demo data with 80 Sri Lankan products with EN/SI/TA names.
- **Absent, must not be fabricated:** product screenshots (to be captured, UR-20), testimonials, customer counts, shop logos, press, benchmarks. Map and stats numbers appear only when the API returns them.

## Product Principles

1. Proof over promise: real UI, real hashes, real shops, honest disclaimers.
2. The download is the one loud action.
3. Three scripts, one rhythm: Sinhala and Tamil are first-class, never an afterthought.
4. Keyboard-first like the product it sells.
5. Privacy by default: least data collected, least exposed.

## Accessibility & Inclusion

WCAG 2.2 AA; full keyboard operation with visible azure focus rings; `prefers-reduced-motion` respected everywhere; Sinhala/Tamil typography rules to prevent diacritic clipping; legible on low-end Android and low-DPI Windows monitors.
