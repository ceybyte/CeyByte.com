"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bug, Lightbulb, HelpCircle, Upload, Check, Loader2, ArrowRight } from "lucide-react";
import { SimilarTicket } from "../types";
import { fetchSimilarTickets, presignAndUploadFile, submitTicket } from "../api";

interface FeedbackSubmitFormProps {
  locale: string;
  initialType?: "bug" | "feature" | "question";
}

export function FeedbackSubmitForm({
  locale,
  initialType = "bug",
}: FeedbackSubmitFormProps) {
  const [type, setType] = useState<"bug" | "feature" | "question">(initialType);
  const [title, setTitle] = useState("");
  const [bodyMd, setBodyMd] = useState("");
  const [appVersion, setAppVersion] = useState("1.4.2");
  const [windowsVersion, setWindowsVersion] = useState("Windows 11");
  const [severity, setSeverity] = useState<string>("wrong_output");
  const [contactPrivate, setContactPrivate] = useState("");

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
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 bg-azure-950 border border-azure-700/60 rounded-full flex items-center justify-center mx-auto mb-4 text-azure-400">
          <Check className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-100 mb-2">Ticket submitted</h2>
        <p className="text-sm text-zinc-400 mb-6">
          Ticket <span className="font-mono text-azure-400 font-bold">{createdTicket.formattedNumber}</span> is in.
          We&apos;ll post updates on it here.
        </p>

        {type === "question" ? (
          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl text-left mb-6 space-y-3">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Thank you. These pages might already answer your question:
            </h3>
            <ul className="text-xs text-azure-400 space-y-2">
              <li>
                <Link href={`/${locale}/docs`} className="hover:underline flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Documentation Center & Guides</span>
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/docs/receipts`} className="hover:underline flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Setting up 58mm & 80mm Receipt Printers</span>
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/docs/tax`} className="hover:underline flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Configuring VAT & SSCL in CB POS</span>
                </Link>
              </li>
            </ul>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <Link
              href={`/${locale}/feedback/${createdTicket.formattedNumber}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 transition-colors"
            >
              <span>View your ticket ({createdTicket.formattedNumber})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href={`/${locale}/feedback`}
              className="px-4 py-2.5 text-xs font-medium text-zinc-400 hover:text-zinc-200"
            >
              Back to board
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href={`/${locale}/feedback`}
          className="text-xs text-zinc-500 hover:text-zinc-300 mb-3 inline-block"
        >
          ← Back to feedback board
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-100">
          Tell us what happened
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          We read every report and keep our development roadmap public.
        </p>
      </div>

      {error && (
        <div className="p-3 mb-6 rounded-lg text-xs font-medium bg-red-950/80 text-red-300 border border-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type Option Cards */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
            What&apos;s this about?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setType("bug")}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                type === "bug"
                  ? "bg-zinc-900 border-azure-500 shadow-md ring-1 ring-azure-500/30"
                  : "bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-400"
              }`}
            >
              <Bug className={`w-5 h-5 mb-2 ${type === "bug" ? "text-rose-400" : "text-zinc-500"}`} />
              <span className="text-xs font-semibold text-zinc-200">Something isn&apos;t working</span>
              <span className="text-[10px] text-zinc-500 mt-0.5">Bug or error</span>
            </button>

            <button
              type="button"
              onClick={() => setType("feature")}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                type === "feature"
                  ? "bg-zinc-900 border-azure-500 shadow-md ring-1 ring-azure-500/30"
                  : "bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-400"
              }`}
            >
              <Lightbulb
                className={`w-5 h-5 mb-2 ${type === "feature" ? "text-amber-400" : "text-zinc-500"}`}
              />
              <span className="text-xs font-semibold text-zinc-200">I&apos;d like something new</span>
              <span className="text-[10px] text-zinc-500 mt-0.5">Feature request</span>
            </button>

            <button
              type="button"
              onClick={() => setType("question")}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                type === "question"
                  ? "bg-zinc-900 border-azure-500 shadow-md ring-1 ring-azure-500/30"
                  : "bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-400"
              }`}
            >
              <HelpCircle
                className={`w-5 h-5 mb-2 ${type === "question" ? "text-azure-400" : "text-zinc-500"}`}
              />
              <span className="text-xs font-semibold text-zinc-200">I have a question</span>
              <span className="text-[10px] text-zinc-500 mt-0.5">Help & advice</span>
            </button>
          </div>
        </div>

        {/* Short Title */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
            Short title
          </label>
          <input
            type="text"
            required
            maxLength={120}
            placeholder="For example, receipts cut off halfway on a 58mm printer"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
          />
        </div>

        {/* Similar Tickets Panel ("Is it one of these?") */}
        {similarTickets.length > 0 && (
          <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Is it one of these?
              </span>
              {searchingSimilar && <Loader2 className="w-3.5 h-3.5 animate-spin text-azure-400" />}
            </div>
            <div className="divide-y divide-zinc-800/80">
              {similarTickets.map((st) => (
                <div key={st.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono text-zinc-400 font-semibold">
                      {st.formattedNumber}
                    </span>
                    <span className="text-zinc-200 truncate">{st.title}</span>
                  </div>
                  <Link
                    href={`/${locale}/feedback/${st.formattedNumber}`}
                    target="_blank"
                    className="flex-shrink-0 text-xs text-azure-400 hover:text-azure-300 font-medium underline"
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
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Tell us more
            </label>
            <span className="text-[11px] text-zinc-500">
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
            className="w-full p-3 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
          />
        </div>

        {/* Environment (Version & Windows) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              CB POS version
            </label>
            <select
              value={appVersion}
              onChange={(e) => setAppVersion(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none"
            >
              <option value="1.4.2">v1.4.2 (Latest)</option>
              <option value="1.4.0">v1.4.0</option>
              <option value="1.3.0">v1.3.0</option>
              <option value="unknown">I&apos;m not sure</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Windows version
            </label>
            <select
              value={windowsVersion}
              onChange={(e) => setWindowsVersion(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none"
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
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              How much is this affecting you?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { id: "crash", label: "CB POS closes or crashes" },
                { id: "blocks_billing", label: "I can't bill customers" },
                { id: "wrong_output", label: "Totals or receipts are wrong" },
                { id: "cosmetic", label: "Something looks wrong" },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer text-xs transition-colors ${
                    severity === opt.id
                      ? "bg-zinc-900 border-zinc-700 text-zinc-100"
                      : "bg-zinc-950 border-zinc-800/80 text-zinc-400 hover:text-zinc-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="severity"
                    value={opt.id}
                    checked={severity === opt.id}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="text-azure-500 focus:ring-0"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Error log upload [J1] [H9] */}
        {type === "bug" && (
          <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Error log (optional)
              </label>
              {uploadingCrashLog && (
                <span className="text-[11px] text-azure-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Uploading log...
                </span>
              )}
              {crashLogKey && (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> cbpos_logs.txt uploaded
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              In CB POS, go to Settings › Admin Tools › Error Logs and click Export Logs. It saves{" "}
              <code className="text-zinc-300 font-mono">cbpos_logs.txt</code>, up to 5 MB. Please remove any passwords
              or network addresses before you upload it. Only our team sees logs. [J1] [H9]
            </p>
            <label className="flex items-center justify-center gap-2 p-3 border border-dashed border-zinc-700 hover:border-zinc-600 rounded-lg cursor-pointer bg-zinc-950/60 text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
              <Upload className="w-4 h-4 text-zinc-500" />
              <span>{crashLogFile ? crashLogFile.name : "Select cbpos_logs.txt, .log or .zip"}</span>
              <input
                type="file"
                accept=".txt,.log,.zip"
                onChange={handleCrashLogSelect}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Screenshot upload */}
        <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Screenshot (optional)
            </label>
            {uploadingScreenshot && (
              <span className="text-[11px] text-azure-400 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Uploading image...
              </span>
            )}
            {screenshotKey && (
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> Screenshot attached
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            PNG or JPG, up to 5 MB. We keep it private unless we mark it safe to show.
          </p>
          <label className="flex items-center justify-center gap-2 p-3 border border-dashed border-zinc-700 hover:border-zinc-600 rounded-lg cursor-pointer bg-zinc-950/60 text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
            <Upload className="w-4 h-4 text-zinc-500" />
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
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
            Email or phone (optional)
          </label>
          <input
            type="text"
            maxLength={120}
            placeholder="077 123 4567 or email@example.com"
            value={contactPrivate}
            onChange={(e) => setContactPrivate(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
          />
          <p className="text-[11px] text-zinc-500 mt-1">
            Only the Ceylon Byte team sees this, and only to follow up on your ticket.
          </p>
        </div>

        {/* Submit Button (Secondary / Outline - Single Green Button Rule) */}
        <div className="pt-4 flex items-center justify-end gap-3">
          <Link
            href={`/${locale}/feedback`}
            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || uploadingCrashLog || uploadingScreenshot}
            className="px-6 py-2.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {submitting ? "Sending ticket..." : "Send ticket"}
          </button>
        </div>
      </form>
    </div>
  );
}
