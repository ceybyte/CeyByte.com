/**
 * Utility to extract clean plain text from markdown for search indexing
 * and reading time calculation.
 */
export function extractPlainText(markdown: string): string {
  if (!markdown) return "";

  let text = markdown;

  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, "");

  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, " ");

  // Remove inline code
  text = text.replace(/`([^`]+)`/g, "$1");

  // Remove directive markers e.g. :::note or :::step{title="xyz"} or :::
  text = text.replace(/^:::[a-zA-Z0-9_-]*(?:\{[^}]*\})?/gm, "");
  text = text.replace(/^:::\s*$/gm, "");

  // Remove images ![alt](url) -> alt
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");

  // Remove links [text](url) -> text
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");

  // Remove headings # Header -> Header
  text = text.replace(/^#{1,6}\s+/gm, "");

  // Remove blockquotes > Quote -> Quote
  text = text.replace(/^>\s+/gm, "");

  // Remove bold/italic markers
  text = text.replace(/(\*\*|__)(.*?)\1/g, "$2");
  text = text.replace(/(\*|_)(.*?)\1/g, "$2");
  text = text.replace(/~~(.*?)~~/g, "$1");

  // Remove raw HTML tags
  text = text.replace(/<[^>]+>/g, " ");

  // Remove table row borders (| a | b | -> a b)
  text = text.replace(/^\||\|$/gm, "");
  text = text.replace(/\|/g, " ");

  // Collapse multiple whitespaces and newlines
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

/**
 * Calculates estimated reading time in minutes based on 200 words per minute.
 * Always returns at least 1 minute for non-empty text.
 */
export function calculateReadingTime(text: string, wordsPerMinute = 200): number {
  if (!text || !text.trim()) return 1;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return 1;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}
