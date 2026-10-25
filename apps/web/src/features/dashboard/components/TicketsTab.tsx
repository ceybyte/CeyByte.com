"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, Plus, ExternalLink, Loader2 } from "lucide-react";
import type { DashboardTicket } from "../types";
import { fetchMyTickets } from "../api";

interface TicketsTabProps {
  locale: string;
  copy: {
    ticketsTitle: string;
  };
}

export function TicketsTab({ locale, copy }: TicketsTabProps) {
  const [tickets, setTickets] = useState<DashboardTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyTickets()
      .then((t) => setTickets(t))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "shipped":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "planned":
      case "in_progress":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "closed":
      case "wont_fix":
      case "duplicate":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-foreground text-xl font-bold tracking-tight">{copy.ticketsTitle}</h2>
          <p className="text-muted-foreground mt-1 text-xs">
            Bug reports, questions, and feature suggestions submitted by you.
          </p>
        </div>

        <Link
          href={`/${locale}/feedback/new`}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border inline-flex shrink-0 items-center gap-2 rounded border px-4 py-2 text-xs font-medium transition"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Report a problem</span>
        </Link>
      </div>

      {loading ? (
        <div className="text-muted-foreground flex items-center justify-center gap-2 p-12 text-center">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
          <span className="text-xs">Loading tickets...</span>
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-card border-border rounded-lg border p-12 text-center">
          <MessageSquare className="text-muted-foreground/60 mx-auto mb-3 h-8 w-8" />
          <p className="text-foreground mb-1 text-sm font-medium">No tickets yet</p>
          <p className="text-muted-foreground mx-auto mb-5 max-w-sm text-xs">
            If you encounter an issue with billing, receipt printing, or Windows setup, let us know here.
          </p>
          <Link
            href={`/${locale}/feedback/new`}
            className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:underline"
          >
            <span>Open your first ticket</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      ) : (
        <div className="bg-card border-border divide-border divide-y overflow-hidden rounded-lg border">
          {tickets.map((t) => {
            const formattedNum = `CB-${String(t.publicNumber).padStart(4, "0")}`;
            return (
              <div
                key={t.id}
                className="hover:bg-secondary/30 flex flex-col justify-between gap-3 p-4 transition sm:flex-row sm:items-center"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-cyan-400">{formattedNum}</span>
                    <span className="text-muted-foreground bg-muted border-border rounded border px-1.5 py-0.5 font-mono text-[10px] tracking-wider uppercase">
                      {t.type}
                    </span>
                    <span
                      className={`rounded border px-1.5 py-0.5 font-mono text-[10px] tracking-wider uppercase ${getStatusBadge(t.status)}`}
                    >
                      {t.status.replace("_", " ")}
                    </span>
                  </div>
                  <h3 className="text-foreground text-sm font-medium">{t.title}</h3>
                  {t.adminResponseMd && (
                    <p className="mt-1.5 line-clamp-2 border-l-2 border-cyan-400 bg-cyan-950/20 py-1 pl-2.5 text-xs text-cyan-300/80">
                      {t.adminResponseMd}
                    </p>
                  )}
                </div>

                <div className="text-muted-foreground flex shrink-0 items-center justify-between gap-1 text-xs sm:flex-col sm:items-end">
                  <span className="font-mono text-[11px]">
                    {new Date(t.createdAt).toLocaleDateString(locale === "en" ? "en-US" : locale)}
                  </span>
                  <Link
                    href={`/${locale}/feedback/${formattedNum}`}
                    className="inline-flex items-center gap-1 text-cyan-400 hover:underline"
                  >
                    <span>View ticket</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
