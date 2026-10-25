"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export interface TocEntry {
  id: string;
  text: string;
  level: number;
}

interface ArticleTocProps {
  items: TocEntry[];
}

export function ArticleToc({ items }: ArticleTocProps) {
  const t = useTranslations("docs.article");
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "0% 0% -65% 0%" },
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className="space-y-3">
      <div className="font-mono text-xs font-medium uppercase tracking-wider text-text-muted">
        {t("onThisPage")}
      </div>
      <ul className="space-y-1.5 text-xs">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <li
              key={item.id}
              className={item.level === 3 ? "pl-3 text-text-muted/80" : ""}
            >
              <a
                href={`#${item.id}`}
                className={`block transition-colors hover:text-text-primary ${
                  isActive
                    ? "font-medium text-azure"
                    : "text-text-muted"
                }`}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
