"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bug, Lightbulb, CheckCircle2, Calendar, Layers, Monitor, ExternalLink, Loader2 } from "lucide-react";
import { PublicFeedbackTicket } from "../types";
import { fetchTicket } from "../api";
import { VoteButton } from "./VoteButton";

interface TicketDetailViewProps {
  ticketNumber: string;
  locale: string;
}

const TIMELINE_STEPS = ["open", "triaged", "planned", "in_progress", "shipped"] as const;

export function TicketDetailView({ ticketNumber, locale }: TicketDetailViewProps) {
  const [ticket, setTicket] = useState<PublicFeedbackTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticketNumber || ticketNumber === "ticket") return;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchTicket(ticketNumber);
        setTicket(data);
      } catch {
        setError(`Ticket ${ticketNumber} could not be found or is not public.`);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [ticketNumber]);

  if (loading) {
    return (
      <div className="text-muted mx-auto flex max-w-4xl flex-col items-center justify-center gap-3 px-4 py-20">
        <Loader2 className="text-azure-text h-6 w-6 animate-spin" />
        <span className="text-xs">Loading ticket {ticketNumber}...</span>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h2 className="text-foreground mb-2 text-xl font-bold">Ticket Not Found</h2>
        <p className="text-muted mb-6 text-sm">{error || "This ticket does not exist."}</p>
        <Link
          href={`/${locale}/feedback`}
          className="border-hairline bg-surface text-text hover:bg-surface-elevated rounded-xl border px-4 py-2 text-xs font-semibold shadow-xs"
        >
          Return to Feedback Board
        </Link>
      </div>
    );
  }

  const currentStepIndex = TIMELINE_STEPS.indexOf(ticket.status as (typeof TIMELINE_STEPS)[number]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Back link */}
      <Link
        href={`/${locale}/feedback`}
        className="text-muted hover:text-text mb-6 inline-block text-xs transition-colors"
      >
        ← Back to feedback board
      </Link>

      {/* Main card */}
      <div className="border-hairline bg-surface/70 space-y-8 overflow-hidden rounded-2xl border p-6 shadow-xs backdrop-blur-sm sm:p-8">
        {/* Top Header Row */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-azure-text font-mono text-sm font-bold">{ticket.formattedNumber}</span>
              <span className="border-hairline bg-surface-elevated text-2xs text-muted inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold tracking-wider uppercase">
                {ticket.type === "bug" ? (
                  <>
                    <Bug className="h-3 w-3 text-rose-500" />
                    <span>Bug</span>
                  </>
                ) : (
                  <>
                    <Lightbulb className="h-3 w-3 text-amber-500" />
                    <span>Feature</span>
                  </>
                )}
              </span>
              {ticket.severity && (
                <span className="text-2xs rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 font-semibold text-rose-600 dark:text-rose-400">
                  {ticket.severity.replace("_", " ")}
                </span>
              )}
            </div>
            <h1 className="text-foreground text-2xl font-bold tracking-tight">{ticket.title}</h1>
          </div>

          <div className="flex-shrink-0">
            <VoteButton
              ticketNumber={ticket.formattedNumber}
              initialVotes={ticket.voteCount}
              hasVoted={ticket.hasVoted}
            />
          </div>
        </div>

        {/* Status Timeline */}
        <div className="border-hairline bg-surface-elevated/40 rounded-2xl border p-4">
          <div className="text-2xs text-muted mb-3 font-semibold tracking-wider uppercase">
            Progress Timeline
          </div>
          <div className="relative grid grid-cols-5 gap-2">
            {TIMELINE_STEPS.map((step, idx) => {
              const isPassed = currentStepIndex >= idx;
              const isCurrent = currentStepIndex === idx;

              return (
                <div key={step} className="flex flex-col items-center text-center">
                  <div
                    className={`mb-1.5 flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold transition-colors ${
                      isCurrent
                        ? "border-azure bg-azure text-white shadow-xs"
                        : isPassed
                          ? "border-azure/60 bg-surface text-azure-text"
                          : "border-hairline bg-surface-elevated text-muted"
                    }`}
                  >
                    {isPassed ? "✓" : idx + 1}
                  </div>
                  <span
                    className={`text-2xs capitalize ${
                      isCurrent ? "text-azure-text font-semibold" : isPassed ? "text-text" : "text-muted"
                    }`}
                  >
                    {step.replace("_", " ")}
                  </span>
                </div>
              );
            })}
          </div>

          {ticket.status === "shipped" && ticket.releaseVersion && (
            <div className="border-hairline mt-4 flex items-center justify-center gap-1.5 border-t pt-3 text-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Resolved and shipped in CB POS v{ticket.releaseVersion}</span>
              <Link
                href={`/${locale}/releases`}
                className="ml-1 inline-flex items-center gap-0.5 underline hover:opacity-80"
              >
                <span>View Release Notes</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Environment metadata pills */}
        <div className="text-muted flex flex-wrap items-center gap-3 text-xs">
          {ticket.appVersion && (
            <div className="border-hairline bg-surface text-text inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5">
              <Layers className="text-muted h-3.5 w-3.5" />
              <span>App: v{ticket.appVersion}</span>
            </div>
          )}
          {ticket.windowsVersion && (
            <div className="border-hairline bg-surface text-text inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5">
              <Monitor className="text-muted h-3.5 w-3.5" />
              <span>{ticket.windowsVersion}</span>
            </div>
          )}
          <div className="border-hairline bg-surface text-text inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5">
            <Calendar className="text-muted h-3.5 w-3.5" />
            <span>Reported {new Date(ticket.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Description body */}
        <div className="space-y-3">
          <h2 className="text-2xs text-muted font-semibold tracking-wider uppercase">Description</h2>
          <div className="border-hairline bg-surface text-text rounded-xl border p-5 font-sans text-sm leading-relaxed whitespace-pre-wrap">
            {ticket.bodyMd}
          </div>
        </div>

        {/* Approved public screenshot (if any) */}
        {ticket.screenshotPublicKey && (
          <div className="space-y-3">
            <h2 className="text-2xs text-muted font-semibold tracking-wider uppercase">Screenshot</h2>
            <div className="border-hairline bg-surface max-w-lg overflow-hidden rounded-xl border p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://cdn.ceybyte.com/${ticket.screenshotPublicKey}`}
                alt="Ticket screenshot"
                className="h-auto w-full rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Official Team Response (if any) */}
        {ticket.adminResponseMd && (
          <div className="border-hairline border-l-azure bg-surface space-y-2 rounded-xl border border-l-2 p-5">
            <div className="flex items-center justify-between">
              <div className="text-azure-text flex items-center gap-1.5 text-xs font-bold">
                <CheckCircle2 className="h-4 w-4" />
                <span>Ceybyte Team</span>
              </div>
              {ticket.adminRespondedAt && (
                <span className="text-2xs text-muted">
                  {new Date(ticket.adminRespondedAt).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="text-text text-xs leading-relaxed whitespace-pre-wrap">
              {ticket.adminResponseMd}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
