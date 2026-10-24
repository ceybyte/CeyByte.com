import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import rehypeShiki from "@shikijs/rehype";
import { remarkDirectivesPlugin } from "./directives";
import { rehypeExtractToc } from "./toc";
import { markdownSanitizeSchema } from "./sanitize";
import { extractPlainText, calculateReadingTime } from "./plain-text";
import type { ProcessMarkdownOptions, ProcessMarkdownResult, TocItem } from "./types";

/**
 * Transforms Markdown string into sanitized HTML with:
 * - GFM (tables, tasklists, strikethrough, autolinks)
 * - Custom callout / step directives with tax disclaimer injection
 * - Heading slugs and autolink anchors
 * - Shiki code syntax highlighting (dual light/dark themes)
 * - Safe XSS sanitization
 * - Table of contents extraction
 * - Plain text extraction & reading time calculation
 */
export async function processMarkdown(
  markdown: string,
  options: ProcessMarkdownOptions = {}
): Promise<ProcessMarkdownResult> {
  const { autoTaxDisclaimer = false, locale = "en" } = options;

  let toc: TocItem[] = [];

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(remarkDirectivesPlugin, {
      autoTaxDisclaimer,
      locale,
    })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeExtractToc, {
      onTocExtracted: (items) => {
        toc = items;
      },
    })
    .use(rehypeAutolinkHeadings, {
      behavior: "append",
      properties: {
        className: ["heading-anchor"],
        ariaHidden: "true",
      },
      content: {
        type: "text",
        value: " #",
      },
    })
    .use(rehypeSanitize, markdownSanitizeSchema)
    .use(rehypeShiki, {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      defaultColor: false,
      fallbackLanguage: "txt",
      addLanguageClass: true,
    })
    .use(rehypeStringify);

  const file = await processor.process(markdown);
  const html = String(file);
  const plainText = extractPlainText(markdown);
  const readingTimeMinutes = calculateReadingTime(plainText);

  return {
    html,
    toc,
    readingTimeMinutes,
    plainText,
  };
}
