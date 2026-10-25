"use client";

import React, { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

interface MarkdownRendererProps {
  html: string;
}

export function MarkdownRenderer({ html }: MarkdownRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("docs");

  useEffect(() => {
    if (!containerRef.current) return;

    // Enhance pre code blocks with Copy buttons
    const preBlocks = containerRef.current.querySelectorAll("pre");
    preBlocks.forEach((pre) => {
      if (pre.querySelector(".copy-btn")) return;

      const button = document.createElement("button");
      button.className =
        "copy-btn absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded border border-hairline bg-surface px-2 py-1 font-mono text-[11px] text-text-muted hover:border-azure/50 hover:text-text-primary transition-colors";
      button.innerHTML = `<span>${t("copy")}</span>`;
      button.setAttribute("aria-label", "Copy code");

      button.addEventListener("click", () => {
        const codeText = pre.querySelector("code")?.innerText || pre.innerText;
        navigator.clipboard.writeText(codeText);
        button.innerHTML = `<span class="text-azure">${t("copied")}</span>`;
        setTimeout(() => {
          button.innerHTML = `<span>${t("copy")}</span>`;
        }, 2000);
      });

      pre.style.position = "relative";
      pre.appendChild(button);
    });
  }, [html, t]);

  return (
    <article
      ref={containerRef}
      className="prose prose-invert max-w-none text-sm text-text-primary/90 leading-relaxed
        prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-text-primary
        prose-h1:text-2xl sm:prose-h1:text-3xl prose-h1:mb-6
        prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-hairline prose-h2:pb-2
        prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2
        prose-p:my-4 prose-p:leading-relaxed
        prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6 prose-li:my-1
        prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6 prose-li:my-1
        prose-code:rounded prose-code:border prose-code:border-hairline prose-code:bg-surface prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-code:text-xs prose-code:text-azure
        prose-pre:rounded-lg prose-pre:border prose-pre:border-hairline prose-pre:bg-surface prose-pre:p-4 prose-pre:text-xs prose-pre:font-mono
        prose-table:w-full prose-table:border-collapse prose-table:my-6
        prose-th:border prose-th:border-hairline prose-th:bg-surface-elevated prose-th:p-2.5 prose-th:text-left prose-th:font-medium prose-th:text-xs prose-th:font-mono
        prose-td:border prose-td:border-hairline prose-td:p-2.5 prose-td:text-xs
        prose-a:text-azure prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-azure/80
        [&_.callout]:my-6 [&_.callout]:rounded-lg [&_.callout]:border-l-4 [&_.callout]:p-4 [&_.callout]:text-xs [&_.callout]:leading-relaxed
        [&_.callout-tip]:border-emerald-500 [&_.callout-tip]:bg-emerald-500/10 [&_.callout-tip]:text-emerald-100
        [&_.callout-note]:border-azure [&_.callout-note]:bg-azure/10 [&_.callout-note]:text-azure-100
        [&_.callout-warn]:border-amber-500 [&_.callout-warn]:bg-amber-500/10 [&_.callout-warn]:text-amber-100
        [&_.callout-danger]:border-rose-500 [&_.callout-danger]:bg-rose-500/10 [&_.callout-danger]:text-rose-100
        [&_.heading-anchor]:ml-1.5 [&_.heading-anchor]:text-hairline-grid [&_.heading-anchor]:no-underline hover:[&_.heading-anchor]:text-azure
      "
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
