import { visit } from "unist-util-visit";
import { toString } from "hast-util-to-string";
import type { Root, Element } from "hast";
import type { TocItem } from "./types";

export type RehypeTocOptions = {
  onTocExtracted?: (toc: TocItem[]) => void;
};

export function rehypeExtractToc(options: RehypeTocOptions = {}) {
  return (tree: Root) => {
    const toc: TocItem[] = [];

    visit(tree, "element", (node: Element) => {
      if (node.tagName === "h2" || node.tagName === "h3") {
        const id = (node.properties?.id as string) || "";
        const text = toString(node).trim();
        const level = node.tagName === "h2" ? 2 : 3;

        if (id && text) {
          toc.push({ id, text, level, depth: level });
        }
      }
    });

    if (options.onTocExtracted) {
      options.onTocExtracted(toc);
    }
  };
}
