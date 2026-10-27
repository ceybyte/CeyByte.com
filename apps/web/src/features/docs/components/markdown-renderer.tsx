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
      className="prose-ceybyte max-w-none text-sm leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
