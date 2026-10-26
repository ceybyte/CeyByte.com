# 0002 — Payment Gateway & LankaQR Feasibility for Donations

| | |
|---|---|
| Status | Accepted |
| Date | 2026-10-26 |
| Deciders | Ceylon Byte Core Engineering & Financial Working Group |
| Branches | `free` · `main` |

## Context

In Phase 11, CB POS introduced Screen S09 (`/donations`) and the Admin Review Queue (`/admin/donations`), enabling supporters and merchants to contribute voluntarily via local bank transfer (CEFT / SLIPS) and upload transfer receipts.

Supporters and high-volume retail merchants have requested automated payment methods:
1. Credit and debit cards (Visa, Mastercard, LankaPay).
2. Instant mobile payment via LankaQR (Central Bank of Sri Lanka EMVCo standard).

This document evaluates the legal, technical, security, and economic feasibility of integrating automated online payment gateways in Sri Lanka.

## Options Considered

### Option 1: Card Payment Gateways (PayHere, WEBXPAY, Commercial Bank IPG)
Online Internet Payment Gateways (IPGs) provide hosted payment modals or redirect pages for Visa and Mastercard transactions.

- **For:**
  - Instant donor confirmation and automated supporter status activation without manual admin slip review.
  - Supports international diaspora donors using foreign cards.
  - Established webhook workflows for asynchronous settlement confirmation.
- **Against:**
  - **High Transaction Fees:** Typical Sri Lankan IPGs charge a Merchant Discount Rate (MDR) between 2.5% and 3.5% + fixed fee of Rs. 10.00 – Rs. 30.00 per transaction. On a modest Rs. 1,000 donation, up to Rs. 40 – Rs. 50 is lost to intermediary fees.
  - **Setup & Annual Maintenance Costs:** Sri Lankan commercial acquiring banks require upfront integration fees (Rs. 25,000 – Rs. 75,000) and recurring annual maintenance fees (Rs. 15,000 – Rs. 30,000).
  - **Corporate Eligibility:** Gateways require an active Sri Lankan Business Registration (Form 1 / Form 20 or NGO registration), a dedicated corporate bank account, and tax identification (TIN).
  - **Chargeback & Fraud Exposure:** Open public web donation endpoints attract card testing attacks, requiring Turnstile rate-limiting and fraud prevention infrastructure.

### Option 2: LankaQR (Central Bank Mandated EMVCo Standard)
LankaQR is the national unified QR code standard introduced by the Central Bank of Sri Lanka (CBSL) for interbank retail payments via CEFT/LankaPay.

- **For:**
  - **Minimal MDR:** LankaQR merchant fees are capped by CBSL guidelines at 0.5% (or 0% for micro-merchants), dramatically lower than card gateways.
  - **Ubiquitous App Adoption:** Supported natively by all major Sri Lankan banking apps (Commercial Bank COMBANK Q+, Sampath WePay, BOC SmartPay, HNB SOLO, Frimi).
  - **No Card Data Exposure:** Donors authenticate directly within their own regulated banking apps.
- **Against:**
  - **Dynamic LankaQR API Access:** Generating dynamic transaction-specific QR codes with automated webhook callbacks requires a direct merchant acquiring API agreement with a partner bank.
  - **Static QR Limitation:** Displaying a static merchant LankaQR code is simple, but bank transaction payloads cannot transmit dynamic donor reference numbers reliably without manual slip confirmation.

### Option 3: Manual Direct Bank Transfer + Slip Verification (Current Baseline)
Donors initiate CEFT/SLIPS transfers from any bank account to the Ceylon Byte project bank account and upload a transaction slip or screenshot.

- **For:**
  - **Zero Intermediary Fees (0% MDR):** 100% of donor contributions fund open-source development and Sinhala/Tamil documentation.
  - **Zero Chargeback Risk:** Bank transfers are final and non-reversible by payment networks.
  - **No Bank Setup Fees:** Standard personal or society bank account with no recurring API subscription costs.
  - **Full Privacy:** No third-party tracking scripts or payment gateway cookies embedded on the site.
- **Against:**
  - Requires human verification via `/admin/donations` before supporter badges and donor messages appear publicly.
  - Friction for impulse donors who prefer one-click card checkout.

## Technical Architecture & Security Requirements (When Automating)

When an automated gateway is integrated in a future milestone, the following specifications must be strictly observed:

1. **PCI-DSS Compliance (SAQ A):**
   - The Next.js frontend and Cloudflare Worker backend must never receive, transmit, or store raw Primary Account Numbers (PAN), CVVs, or card expiry dates.
   - All card data entry must occur exclusively within a PCI-DSS Level 1 certified hosted modal (e.g. PayHere hosted popup or Bank iframe).

2. **Cryptographic Webhook Signature Verification:**
   - Webhooks must be verified using HMAC-SHA256 against a shared secret before updating donation status in D1:
     $$\text{Signature} = \text{HMAC-SHA256}(\text{merchant\_id} + \text{order\_id} + \text{amount} + \text{currency} + \text{status\_code}, \text{secret})$$
   - Timing-safe equality checks (`crypto.subtle.timingSafeEqual`) must be used to prevent timing attacks.

3. **Replay & Idempotency Safeguards:**
   - Webhook processing must enforce atomic idempotency in D1 using unique transaction IDs (`txn_reference`).
   - Duplicate notifications for already-settled donations must return HTTP 200 without re-dispatching audit logs or supporter triggers.

4. **Rate Limiting & Anti-Testing:**
   - Cloudflare Turnstile token validation and rate limiting on checkout initialization to prevent automated card-testing bots.

## Decision

We adopt a **phased hybrid approach**:

1. **Current Milestone (Phase 11–13):**
   - Retain the zero-fee **Direct Bank Transfer + Slip Upload** system on `/donations` as the primary payment channel.
   - Display a verified **Static LankaQR Code** alongside bank account details on `/donations` for instant smartphone scanning.
   - Maintain 100% fee-free donation receipts for project sustainability.

2. **Future Milestone (M4 / Post-Launch):**
   - Upon completion of formal institutional registration, integrate a Sri Lankan payment gateway supporting both LankaPay cards and dynamic LankaQR with HMAC-SHA256 webhook callbacks.

## Consequences

- **What gets easier:**
  - No gateway monthly minimums or transaction percentage deductions.
  - 100% of community contributions are preserved for software engineering and localization.
  - Zero PCI-DSS audit overhead or merchant liability on the Cloudflare Worker infrastructure.
- **What gets harder:**
  - Admin team must periodically review uploaded transfer slips in `/admin/donations`.
- **Revisit trigger:**
  - When monthly donation volume exceeds 50 contributions, or when Ceylon Byte formal NGO corporate entity acquiring credentials are operational.
