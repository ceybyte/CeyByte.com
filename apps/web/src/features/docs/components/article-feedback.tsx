"use client";

import React, { useState } from "react";
import { ThumbsUp, ThumbsDown, Check, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface ArticleFeedbackProps {
  articleSlug: string;
  categorySlug: string;
  locale: string;
}

export function ArticleFeedback({ articleSlug, categorySlug, locale }: ArticleFeedbackProps) {
  const t = useTranslations("docs.article");
  const [submitted, setSubmitted] = useState(false);
  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function sendFeedback(helpful: boolean, userReason?: string) {
    setIsSubmitting(true);
    try {
      await fetch("/api/docs/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          articleSlug,
          categorySlug,
          locale,
          helpful,
          reason: userReason?.trim() || undefined,
        }),
      });
    } catch {
      // Non-blocking
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  }

  function handleYes() {
    sendFeedback(true);
  }

  function handleNo() {
    setShowReason(true);
  }

  function handleReasonSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendFeedback(false, reason);
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-hairline bg-surface p-4 text-xs font-mono text-azure">
        <Check className="h-4 w-4" />
        <span>{t("thanks")}</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-hairline bg-surface p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-medium text-text-primary">
          {t("helpful")}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleYes}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-surface-elevated px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:border-azure/50 hover:text-text-primary focus:outline-none focus:ring-1 focus:ring-azure"
          >
            <ThumbsUp className="h-3.5 w-3.5" />
            <span>{t("yes")}</span>
          </button>
          <button
            type="button"
            onClick={handleNo}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-surface-elevated px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:border-rose-500/50 hover:text-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
          >
            <ThumbsDown className="h-3.5 w-3.5" />
            <span>{t("no")}</span>
          </button>
        </div>
      </div>

      {showReason && !submitted && (
        <form onSubmit={handleReasonSubmit} className="mt-4 space-y-3 border-t border-hairline pt-3">
          <label htmlFor="feedback-reason" className="block text-xs text-text-muted">
            {t("reason")}
          </label>
          <textarea
            id="feedback-reason"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Tell us what could be clearer..."
            className="w-full rounded-md border border-hairline bg-canvas p-2.5 text-xs text-text-primary placeholder:text-text-muted focus:border-azure focus:outline-none focus:ring-1 focus:ring-azure"
          />
          <div className="flex justify-end gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-md border border-azure/40 bg-azure/10 px-3 py-1.5 text-xs font-medium text-azure transition-colors hover:bg-azure/20"
            >
              {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
              <span>{t("send")}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
