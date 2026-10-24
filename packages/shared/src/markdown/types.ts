export type TocItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

export type SupportedLocale = "en" | "si" | "ta";

export type ProcessMarkdownOptions = {
  /**
   * Automatically inject the non-certified tax disclaimer callout.
   * Required for tax documentation per Constraint C5.
   */
  autoTaxDisclaimer?: boolean;
  /**
   * The locale of the article (en, si, ta). Used for localized disclaimer text.
   */
  locale?: SupportedLocale | string;
  /**
   * Shiki syntax highlighter theme name.
   */
  theme?: string;
};

export type ProcessMarkdownResult = {
  html: string;
  toc: TocItem[];
  readingTimeMinutes: number;
  plainText: string;
};
