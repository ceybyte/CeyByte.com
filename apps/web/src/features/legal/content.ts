import type { LegalDoc, LegalSlug } from "./types";

export const LEGAL_SLUGS: LegalSlug[] = [
  "terms",
  "eula",
  "privacy",
  "tax-disclaimer",
  "data-safety",
  "cookies",
];

export function getAllLegalSlugs(): LegalSlug[] {
  return [...LEGAL_SLUGS];
}

export const LEGAL_DOCS: Record<LegalSlug, LegalDoc> = {
  terms: {
    slug: "terms",
    titleKey: "legal.terms.title",
    summaryKey: "legal.terms.summary",
    updatedDate: "21 Oct 2026",
    version: "2026-10-01",
    sections: [
      {
        id: "acceptance",
        heading: "1. Acceptance of Terms",
        paragraphs: [
          "By accessing the CeyByte website (ceybyte.com) or using the download service to acquire CB\u00A0POS, you agree to be bound by these Terms of Service and all applicable laws and regulations of the Democratic Socialist Republic of Sri Lanka.",
          "If you do not agree with any of these terms, you are prohibited from using or accessing this site and downloading the software.",
        ],
      },
      {
        id: "services",
        heading: "2. Description of Service",
        paragraphs: [
          "Ceylon Byte provides ceybyte.com as a distribution platform, documentation hub, and community merchant directory for CB\u00A0POS desktop software.",
          "We offer software releases for manual download. To download CB\u00A0POS, merchants provide verifiable shop registration information through our download gate.",
        ],
      },
      {
        id: "merchant-directory",
        heading: "3. Merchant Directory & Map Listing",
        paragraphs: [
          "Merchants may opt into having their retail shop listed publicly on the CB\u00A0POS merchant map. By opting in, you authorize Ceylon Byte to display your shop name, retail business category, city, district, and geographic coordinates.",
          "Telephone numbers and WhatsApp contact details are strictly kept private and are never rendered publicly on the merchant map or exposed through public API endpoints.",
        ],
      },
      {
        id: "intellectual-property",
        heading: "4. Intellectual Property",
        paragraphs: [
          "All website content, visual identity, logos, code, documentation articles, and design systems are the proprietary intellectual property of Ceylon Byte. CB\u00A0POS software is governed by its dedicated End User License Agreement (EULA).",
        ],
      },
      {
        id: "governing-law",
        heading: "5. Governing Law and Jurisdiction",
        paragraphs: [
          "These Terms are governed by and construed in accordance with the substantive laws of Sri Lanka. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts of Sri Lanka.",
        ],
      },
    ],
  },
  eula: {
    slug: "eula",
    titleKey: "legal.eula.title",
    summaryKey: "legal.asIs.summary",
    updatedDate: "21 Oct 2026",
    version: "2026-10-01",
    sections: [
      {
        id: "license-grant",
        heading: "1. License Grant and Permitted Use",
        paragraphs: [
          "CB\u00A0POS is proprietary freeware created and owned by Ceylon Byte. Subject to these terms, Ceylon Byte grants you a free, non-exclusive, non-transferable, revocable license to install and execute CB\u00A0POS solely for your shop's internal business operations. [K1]",
          "You may install CB\u00A0POS on multiple personal computers within your establishment.",
        ],
      },
      {
        id: "restrictions",
        heading: "2. Restrictions on Use",
        paragraphs: [
          "You shall not copy, duplicate, reverse engineer, decompile, disassemble, modify, adapt, or create derivative works of CB\u00A0POS in whole or in part.",
          "You shall not resell, sub-license, rent, lease, repackage, or distribute CB\u00A0POS installers or binaries through third-party websites or physical media without prior written consent from Ceylon Byte. [K1]",
        ],
      },
      {
        id: "as-is-warranty",
        heading: "3. Disclaimer of Warranties (\"As Is\")",
        paragraphs: [
          "CB\u00A0POS IS PROVIDED \"AS IS\" AND \"AS AVAILABLE\" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. [K1]",
          "CEYLON BYTE DOES NOT WARRANT THAT CB\u00A0POS WILL OPERATE UNINTERRUPTED, ERROR-FREE, OR COMPATIBLE WITH EVERY HARDWARE DEVICE, ESC/POS PRINTER, OR OPERATING SYSTEM UPDATE.",
        ],
      },
      {
        id: "liability-limitation",
        heading: "4. Limitation of Liability",
        paragraphs: [
          "To the maximum extent permitted by applicable Sri Lankan law, in no event shall Ceylon Byte be liable for any direct, indirect, incidental, consequential, special, or punitive damages arising out of the use of or inability to use CB\u00A0POS.",
          "This includes, without limitation, damages for lost profits, business interruption, loss of sales data, database corruption, or incorrect tax computations. [K1]",
        ],
      },
      {
        id: "termination",
        heading: "5. Termination",
        paragraphs: [
          "This license is effective until terminated. Your rights under this EULA will terminate automatically without notice if you fail to comply with any of its terms.",
        ],
      },
    ],
  },
  privacy: {
    slug: "privacy",
    titleKey: "legal.privacy.title",
    summaryKey: "legal.privacy.summary",
    updatedDate: "21 Oct 2026",
    version: "2026-10-01",
    sections: [
      {
        id: "pdpa-commitment",
        heading: "1. Privacy Commitment & PDPA Compliance",
        paragraphs: [
          "Ceylon Byte is committed to protecting your personal data in full compliance with the Personal Data Protection Act, No. 9 of 2022 (PDPA) of Sri Lanka.",
          "We collect only the minimum data strictly necessary to distribute software, maintain merchant listings, verify human downloads, and resolve user support inquiries.",
        ],
      },
      {
        id: "app-network-disclosures",
        heading: "2. Desktop Application Network Disclosures",
        paragraphs: [
          "When you install and launch the CB\u00A0POS desktop application, your local retail sales records, item inventory, prices, and customer balances are stored exclusively on your own computer. [G1]",
          "The CB\u00A0POS desktop application performs an automated HTTPS update check against GitHub's public API upon launch to verify whether a newer release is available. This request transmits no shop identification, merchant details, inventory lists, or financial data. [A7]",
          "CB\u00A0POS contains zero cloud analytics, zero background telemetry, and zero automatic cloud synchronisation. Your store's transactional data is never uploaded to Ceylon Byte servers. [A8]",
        ],
      },
      {
        id: "data-collected",
        heading: "3. Website Data Collected",
        paragraphs: [
          "When using ceybyte.com, we collect the details you submit through our forms:",
          "• Download Gate: Full name, shop name, business category, district, city, phone number, optional WhatsApp number, and map pin coordinates.",
          "• Merchant Listing Privacy: Phone and WhatsApp numbers are encrypted/stored privately for shop verification and are never published on the public map or public API. [S02]",
          "• Support Tickets: Issue title, description, and attached log snippets.",
        ],
      },
      {
        id: "data-rights",
        heading: "4. Your Data Rights under PDPA",
        paragraphs: [
          "Under Sri Lanka's Personal Data Protection Act, you have the right to request access to your personal data, request correction of inaccurate records, or request withdrawal of your shop listing from our directory at any time by contacting privacy@ceybyte.com.",
        ],
      },
    ],
  },
  "tax-disclaimer": {
    slug: "tax-disclaimer",
    titleKey: "legal.tax.title",
    summaryKey: "legal.tax.summary",
    updatedDate: "21 Oct 2026",
    version: "2026-10-01",
    sections: [
      {
        id: "no-ird-certification",
        heading: "1. No Official Endorsement or Certification",
        paragraphs: [
          "CB\u00A0POS is an independent point-of-sale software utility developed by Ceylon Byte. It is NOT certified, endorsed, approved, or audited by the Inland Revenue Department (IRD) of Sri Lanka. [C5]",
          "Neither Ceylon Byte nor CB\u00A0POS makes any warranty regarding compliance with mandatory IRD electronic fiscalisation schemes, RAMIS integration, or statutory auditing standards.",
        ],
      },
      {
        id: "calculation-methodology",
        heading: "2. Tax Calculation Methodology",
        paragraphs: [
          "When VAT registration is enabled in CB\u00A0POS settings, taxes are computed backward from the entered Maximum Retail Price (MRP):",
          "• Base Price Before VAT: Price = MRP ÷ (1 + VAT Rate). For example, at an 18% VAT rate, Price = MRP ÷ 1.18. [C1]",
          "• SSCL Calculation: Social Security Contribution Levy (SSCL) is calculated at 2.5% on 50% of the price before VAT (Effective rate = 1.25%). [C2]",
          "• Rounding: All tax computations and line item values are rounded to two decimal places (cents) using the round-half-even (Banker's rounding) method.",
        ],
      },
      {
        id: "merchant-responsibility",
        heading: "3. Merchant Responsibility & Professional Advice",
        paragraphs: [
          "Tax laws, registration thresholds, and statutory rates in Sri Lanka are subject to legislative changes by the Ministry of Finance and the Inland Revenue Department.",
          "You as the retail business owner are solely responsible for setting the correct rates in CB\u00A0POS settings, determining whether your enterprise meets the VAT/SSCL registration threshold, and submitting statutory returns.",
          "Always consult a qualified Chartered Accountant or registered tax agent regarding your business's tax liability and legal obligations.",
        ],
      },
    ],
  },
  "data-safety": {
    slug: "data-safety",
    titleKey: "legal.data.title",
    summaryKey: "legal.data.summary",
    updatedDate: "21 Oct 2026",
    version: "2026-10-01",
    sections: [
      {
        id: "local-sqlite-storage",
        heading: "1. Local SQLite Database Storage",
        paragraphs: [
          "CB\u00A0POS operates in standalone desktop mode by default. All transaction records, inventory catalogs, supplier ledgers, and cashier accounts are written to a single SQLite database file (`cbpos.db`) stored on your local hard drive. [G1]",
          "This database file is not encrypted at rest by the operating system. To protect your financial and customer data from unauthorized local access, you must secure your Windows operating system account with a strong password and restrict physical access to the billing terminal.",
        ],
      },
      {
        id: "aes-encrypted-backups",
        heading: "2. Encrypted Backups with Password Protection",
        paragraphs: [
          "CB\u00A0POS includes an automated backup mechanism that produces compressed archive files (`.zip`).",
          "To safeguard your data, backups use AES-256 encryption via pyzipper and require a master backup password set during initial configuration. [G2]",
          "IMPORTANT: If you do not configure a master backup password, automatic backup routines will NOT execute. Ceylon Byte does not maintain escrow keys and cannot recover your password or restore encrypted backup files.",
        ],
      },
      {
        id: "network-mode-caveat",
        heading: "3. PostgreSQL Network Mode Exclusions",
        paragraphs: [
          "When operating CB\u00A0POS in multi-terminal network mode connected to a shared PostgreSQL server, your transactional data resides directly on that PostgreSQL database server. [G4]",
          "The built-in CB\u00A0POS desktop backup routine does NOT back up external PostgreSQL databases. Shop managers must establish independent database dumps (such as `pg_dump`) on the server hosting PostgreSQL. [G4]",
        ],
      },
    ],
  },
  cookies: {
    slug: "cookies",
    titleKey: "legal.cookies.title",
    summaryKey: "legal.cookies.summary",
    updatedDate: "21 Oct 2026",
    version: "2026-10-01",
    sections: [
      {
        id: "zero-tracking",
        heading: "1. Zero Tracking Cookies",
        paragraphs: [
          "CeyByte respects your privacy. We do not use third-party advertising cookies, cross-site trackers, or surveillance cookies on ceybyte.com.",
        ],
      },
      {
        id: "essential-security",
        heading: "2. Essential Security & Bot Protection",
        paragraphs: [
          "We utilize Cloudflare Turnstile to protect download gates, feedback forms, and merchant submission endpoints from spam and automated bot abuse.",
          "Cloudflare Turnstile may set essential, privacy-preserving security tokens to validate human visitors without profiling personal browsing behavior.",
        ],
      },
      {
        id: "local-storage",
        heading: "3. Local Storage Preferences",
        paragraphs: [
          "We use browser `localStorage` solely to preserve your preferred theme (dark or light) and download gate wizard draft state. These values remain on your device and are never transmitted to marketing entities.",
        ],
      },
    ],
  },
};

export function getLegalDoc(slug: string): LegalDoc | null {
  if (Object.prototype.hasOwnProperty.call(LEGAL_DOCS, slug)) {
    return LEGAL_DOCS[slug as LegalSlug];
  }
  return null;
}
