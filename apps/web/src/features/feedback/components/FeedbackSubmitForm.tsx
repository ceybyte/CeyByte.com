"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bug, Lightbulb, HelpCircle, Upload, Check, Loader2, ArrowRight } from "lucide-react";
import { TurnstileWidget } from "@/components/gate/turnstile-widget";
import { LATEST_APP_VERSION, APP_VERSION_OPTIONS } from "@/lib/constants";
import { SimilarTicket } from "../types";
import { fetchSimilarTickets, presignAndUploadFile, submitTicket } from "../api";

interface FeedbackSubmitFormProps {
  locale: string;
  initialType?: "bug" | "feature" | "question";
}

export function FeedbackSubmitForm({ locale, initialType = "bug" }: FeedbackSubmitFormProps) {
  const [type, setType] = useState<"bug" | "feature" | "question">(initialType);
  const [title, setTitle] = useState("");
  const [bodyMd, setBodyMd] = useState("");
  const [appVersion, setAppVersion] = useState<string>(LATEST_APP_VERSION);
  const [windowsVersion, setWindowsVersion] = useState("Windows 11");
  const [severity, setSeverity] = useState<string>("wrong_output");
  const [contactPrivate, setContactPrivate] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");

  // Similar tickets
  const [similarTickets, setSimilarTickets] = useState<SimilarTicket[]>([]);
  const [searchingSimilar, setSearchingSimilar] = useState(false);

  // File uploads
  const [draftId] = useState(() => crypto.randomUUID());
  const [crashLogFile, setCrashLogFile] = useState<File | null>(null);
  const [crashLogKey, setCrashLogKey] = useState<string | null>(null);
  const [uploadingCrashLog, setUploadingCrashLog] = useState(false);

  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotKey, setScreenshotKey] = useState<string | null>(null);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTicket, setCreatedTicket] = useState<{
    formattedNumber: string;
    isPublic: boolean;
  } | null>(null);

  // Debounced search for similar tickets
  useEffect(() => {
    if (title.trim().length < 3) {
      setSimilarTickets([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchingSimilar(true);
        const results = await fetchSimilarTickets(title);
        setSimilarTickets(results);
      } catch {
        setSimilarTickets([]);
      } finally {
        setSearchingSimilar(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [title]);

  const handleCrashLogSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("That file is bigger than 5 MB. Please choose a smaller one.");
      return;
    }

    try {
      setUploadingCrashLog(true);
      setError(null);
      setCrashLogFile(file);
      const res = await presignAndUploadFile("crash_log", file, draftId);
      setCrashLogKey(res.key);
    } catch {
      setError("Failed to upload error log. Please try again.");
      setCrashLogFile(null);
    } finally {
      setUploadingCrashLog(false);
    }
  };

  const handleScreenshotSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("That file is bigger than 5 MB. Please choose a smaller one.");
      return;
    }

    try {
      setUploadingScreenshot(true);
      setError(null);
      setScreenshotFile(file);
      const res = await presignAndUploadFile("ticket_screenshot", file, draftId);
      setScreenshotKey(res.key);
    } catch {
      setError("Failed to upload screenshot. Please try again.");
      setScreenshotFile(null);
    } finally {
      setUploadingScreenshot(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 8) {
      setError("Short title must be at least 8 characters.");
      return;
    }

    if (bodyMd.trim().length < 20) {
      setError("Please describe the issue in at least 20 characters.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await submitTicket({
        type,
        title: title.trim(),
        bodyMd: bodyMd.trim(),
        appVersion: appVersion || null,
        windowsVersion: windowsVersion || null,
        severity: type === "bug" ? severity : null,
        contactPrivate: contactPrivate.trim() || null,
        draftId,
        crashLogKey,
        screenshotKey,
        turnstileToken: turnstileToken || undefined,
      });

      setCreatedTicket({
        formattedNumber: res.formattedNumber,
        isPublic: res.isPublic,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send ticket. Please check your inputs.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (createdTicket) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="border-azure/40 bg-azure/10 text-azure-text mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border">
          <Check className="h-6 w-6" />
        </div>
        <h2 className="text-foreground mb-2 text-2xl font-bold">Ticket submitted</h2>
        <p className="text-muted mb-6 text-sm">
          Ticket <span className="text-azure-text font-mono font-bold">{createdTicket.formattedNumber}</span>{" "}
          is in. We&apos;ll post updates on it here.
        </p>

        {type === "question" ? (
          <div className="border-hairline bg-surface mb-6 space-y-3 rounded-2xl border p-6 text-left shadow-xs">
            <h3 className="text-2xs text-text font-semibold tracking-wider uppercase">
              Thank you. These pages might already answer your question:
            </h3>
            <ul className="text-azure-text space-y-2 text-xs">
              <li>
                <Link href={`/${locale}/docs`} className="flex items-center gap-1.5 hover:underline">
                  <ArrowRight className="h-3.5 w-3.5" />
                  <span>Documentation Center & Guides</span>
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/docs/receipts`} className="flex items-center gap-1.5 hover:underline">
                  <ArrowRight className="h-3.5 w-3.5" />
                  <span>Setting up 58mm & 80mm Receipt Printers</span>
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/docs/tax`} className="flex items-center gap-1.5 hover:underline">
                  <ArrowRight className="h-3.5 w-3.5" />
                  <span>Configuring VAT & SSCL in CB POS</span>
                </Link>
              </li>
            </ul>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <Link
              href={`/${locale}/feedback/${createdTicket.formattedNumber}`}
              className="border-hairline bg-surface text-text hover:bg-surface-elevated hover:border-azure/40 inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-xs font-semibold shadow-xs transition-all"
            >
              <span>View your ticket ({createdTicket.formattedNumber})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={`/${locale}/feedback`}
              className="text-muted hover:text-text px-4 py-2.5 text-xs font-medium transition-colors"
            >
              Back to board
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <Link
          href={`/${locale}/feedback`}
          className="text-muted hover:text-text mb-3 inline-block text-xs transition-colors"
        >
          ← Back to feedback board
        </Link>
        <h1 className="text-foreground text-3xl font-extrabold tracking-tight">Tell us what happened</h1>
        <p className="text-muted mt-1 text-sm">
          We read every report and keep our development roadmap public.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type Option Cards */}
        <div>
          <label className="text-2xs text-muted mb-2 block font-semibold tracking-wider uppercase">
            What&apos;s this about?
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setType("bug")}
              className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all ${
                type === "bug"
                  ? "border-azure bg-surface ring-azure/30 shadow-xs ring-1"
                  : "border-hairline bg-surface/50 text-muted hover:bg-surface-elevated hover:border-hairline"
              }`}
            >
              <Bug className={`mb-2 h-5 w-5 ${type === "bug" ? "text-rose-500" : "text-muted"}`} />
              <span className="text-text text-xs font-semibold">Something isn&apos;t working</span>
              <span className="text-2xs text-muted mt-0.5">Bug or error</span>
            </button>

            <button
              type="button"
              onClick={() => setType("feature")}
              className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all ${
                type === "feature"
                  ? "border-azure bg-surface ring-azure/30 shadow-xs ring-1"
                  : "border-hairline bg-surface/50 text-muted hover:bg-surface-elevated hover:border-hairline"
              }`}
            >
              <Lightbulb className={`mb-2 h-5 w-5 ${type === "feature" ? "text-amber-500" : "text-muted"}`} />
              <span className="text-text text-xs font-semibold">I&apos;d like something new</span>
              <span className="text-2xs text-muted mt-0.5">Feature request</span>
            </button>

            <button
              type="button"
              onClick={() => setType("question")}
              className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all ${
                type === "question"
                  ? "border-azure bg-surface ring-azure/30 shadow-xs ring-1"
                  : "border-hairline bg-surface/50 text-muted hover:bg-surface-elevated hover:border-hairline"
              }`}
            >
              <HelpCircle
                className={`mb-2 h-5 w-5 ${type === "question" ? "text-azure-text" : "text-muted"}`}
              />
              <span className="text-text text-xs font-semibold">I have a question</span>
              <span className="text-2xs text-muted mt-0.5">Help & advice</span>
            </button>
          </div>
        </div>

        {/* Short Title */}
        <div>
          <label className="text-2xs text-muted mb-1 block font-semibold tracking-wider uppercase">
            Short title
          </label>
          <input
            type="text"
            required
            maxLength={120}
            placeholder="For example, receipts cut off halfway on a 58mm printer"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border-hairline bg-surface text-text placeholder:text-muted focus:border-azure/50 focus:ring-azure/40 w-full rounded-xl border px-3.5 py-2.5 text-sm transition-colors focus:ring-1 focus:outline-none"
          />
        </div>

        {/* Similar Tickets Panel ("Is it one of these?") */}
        {similarTickets.length > 0 && (
          <div className="border-hairline bg-surface/70 space-y-2.5 rounded-2xl border p-4 shadow-xs backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-2xs text-muted font-semibold tracking-wider uppercase">
                Is it one of these?
              </span>
              {searchingSimilar && <Loader2 className="text-azure-text h-3.5 w-3.5 animate-spin" />}
            </div>
            <div className="divide-hairline divide-y">
              {similarTickets.map((st) => (
                <div key={st.id} className="flex items-center justify-between gap-3 py-2.5 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-muted font-mono font-semibold">{st.formattedNumber}</span>
                    <span className="text-text truncate">{st.title}</span>
                  </div>
                  <Link
                    href={`/${locale}/feedback/${st.formattedNumber}`}
                    target="_blank"
                    className="text-azure-text flex-shrink-0 text-xs font-medium hover:underline"
                  >
                    Vote for this one instead ({st.voteCount} votes)
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description Body */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-2xs text-muted font-semibold tracking-wider uppercase">Tell us more</label>
            <span className="text-2xs text-muted">
              {type === "bug"
                ? "What were you doing, what did you expect, and what happened instead?"
                : "Markdown supported"}
            </span>
          </div>
          <textarea
            required
            rows={5}
            minLength={20}
            maxLength={5000}
            value={bodyMd}
            onChange={(e) => setBodyMd(e.target.value)}
            placeholder="Describe details, steps to reproduce, or why this feature would help your store..."
            className="border-hairline bg-surface text-text placeholder:text-muted focus:border-azure/50 focus:ring-azure/40 w-full rounded-xl border p-3 text-sm transition-colors focus:ring-1 focus:outline-none"
          />
        </div>

        {/* Environment (Version & Windows) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-2xs text-muted mb-1 block font-semibold tracking-wider uppercase">
              CB POS version
            </label>
            <select
              value={appVersion}
              onChange={(e) => setAppVersion(e.target.value)}
              className="border-hairline bg-surface text-text focus:border-azure/50 focus:ring-azure/40 w-full rounded-xl border px-3 py-2 text-xs transition-colors focus:ring-1 focus:outline-none"
            >
              {APP_VERSION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-2xs text-muted mb-1 block font-semibold tracking-wider uppercase">
              Windows version
            </label>
            <select
              value={windowsVersion}
              onChange={(e) => setWindowsVersion(e.target.value)}
              className="border-hairline bg-surface text-text focus:border-azure/50 focus:ring-azure/40 w-full rounded-xl border px-3 py-2 text-xs transition-colors focus:ring-1 focus:outline-none"
            >
              <option value="Windows 11">Windows 11</option>
              <option value="Windows 10">Windows 10</option>
              <option value="Windows 8 / 7">Windows 8 / 7</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Severity (only for bugs) */}
        {type === "bug" && (
          <div>
            <label className="text-2xs text-muted mb-2 block font-semibold tracking-wider uppercase">
              How much is this affecting you?
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                { id: "crash", label: "CB POS closes or crashes" },
                { id: "blocks_billing", label: "I can't bill customers" },
                { id: "wrong_output", label: "Totals or receipts are wrong" },
                { id: "cosmetic", label: "Something looks wrong" },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-xs transition-all ${
                    severity === opt.id
                      ? "border-azure/40 bg-azure/10 text-azure-text font-semibold shadow-xs"
                      : "border-hairline bg-surface text-muted hover:text-text hover:bg-surface-elevated"
                  }`}
                >
                  <input
                    type="radio"
                    name="severity"
                    value={opt.id}
                    checked={severity === opt.id}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="text-azure-text focus:ring-0"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Error log upload [J1] [H9] */}
        {type === "bug" && (
          <div className="border-hairline bg-surface/70 space-y-2 rounded-2xl border p-4 shadow-xs backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <label className="text-2xs text-muted font-semibold tracking-wider uppercase">
                Error log (optional)
              </label>
              {uploadingCrashLog && (
                <span className="text-2xs text-azure-text flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Uploading log...
                </span>
              )}
              {crashLogKey && (
                <span className="text-2xs flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Check className="h-3 w-3" /> cbpos_logs.txt uploaded
                </span>
              )}
            </div>
            <p className="text-2xs text-muted leading-relaxed">
              In CB POS, go to Settings › Admin Tools › Error Logs and click Export Logs. It saves{" "}
              <code className="text-text font-mono">cbpos_logs.txt</code>, up to 5 MB. Please remove any
              passwords or network addresses before you upload it. Only our team sees logs. [J1] [H9]
            </p>
            <label className="border-hairline bg-surface text-muted hover:border-azure/40 hover:bg-surface-elevated hover:text-text flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-3 text-xs transition-all">
              <Upload className="text-muted h-4 w-4" />
              <span>{crashLogFile ? crashLogFile.name : "Select cbpos_logs.txt, .log or .zip"}</span>
              <input type="file" accept=".txt,.log,.zip" onChange={handleCrashLogSelect} className="hidden" />
            </label>
          </div>
        )}

        {/* Screenshot upload */}
        <div className="border-hairline bg-surface/70 space-y-2 rounded-2xl border p-4 shadow-xs backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <label className="text-2xs text-muted font-semibold tracking-wider uppercase">
              Screenshot (optional)
            </label>
            {uploadingScreenshot && (
              <span className="text-2xs text-azure-text flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Uploading image...
              </span>
            )}
            {screenshotKey && (
              <span className="text-2xs flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Check className="h-3 w-3" /> Screenshot attached
              </span>
            )}
          </div>
          <p className="text-2xs text-muted leading-relaxed">
            PNG or JPG, up to 5 MB. We keep it private unless we mark it safe to show.
          </p>
          <label className="border-hairline bg-surface text-muted hover:border-azure/40 hover:bg-surface-elevated hover:text-text flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-3 text-xs transition-all">
            <Upload className="text-muted h-4 w-4" />
            <span>{screenshotFile ? screenshotFile.name : "Select PNG or JPG image"}</span>
            <input
              type="file"
              accept=".png,.jpg,.jpeg"
              onChange={handleScreenshotSelect}
              className="hidden"
            />
          </label>
        </div>

        {/* Contact Input */}
        <div>
          <label className="text-2xs text-muted mb-1 block font-semibold tracking-wider uppercase">
            Email or phone (optional)
          </label>
          <input
            type="text"
            maxLength={120}
            placeholder="077 123 4567 or email@example.com"
            value={contactPrivate}
            onChange={(e) => setContactPrivate(e.target.value)}
            className="border-hairline bg-surface text-text placeholder:text-muted focus:border-azure/50 focus:ring-azure/40 w-full rounded-xl border px-3.5 py-2.5 text-xs transition-colors focus:ring-1 focus:outline-none"
          />
          <p className="text-2xs text-muted mt-1">
            Only the Ceylon Byte team sees this, and only to follow up on your ticket.
          </p>
        </div>

        {/* Turnstile verification widget */}
        <div className="py-2">
          <TurnstileWidget action="feedback" onToken={setTurnstileToken} />
        </div>

        {/* Submit Button (Secondary / Outline - Single Green Button Rule) */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            href={`/${locale}/feedback`}
            className="text-muted hover:text-text px-4 py-2 text-xs font-medium transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || uploadingCrashLog || uploadingScreenshot}
            className="border-hairline bg-surface text-text hover:bg-surface-elevated hover:border-azure/40 rounded-xl border px-6 py-2.5 text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
          >
            {submitting ? "Sending ticket..." : "Send ticket"}
          </button>
        </div>
      </form>
    </div>
  );
}
