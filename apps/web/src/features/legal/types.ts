export type LegalSlug = "terms" | "eula" | "privacy" | "tax-disclaimer" | "data-safety" | "cookies";

export interface LegalSection {
  id: string;
  heading: string;
  paragraphs: string[];
}

export interface LegalDoc {
  slug: LegalSlug;
  titleKey: string;
  summaryKey: string;
  updatedDate: string;
  version: string;
  sections: LegalSection[];
}
