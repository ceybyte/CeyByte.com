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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {copy.ticketsTitle}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Bug reports, questions, and feature suggestions submitted by you.
          </p>
        </div>

        <Link
          href={`/${locale}/feedback/new`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border rounded text-xs font-medium transition shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Report a problem</span>
        </Link>
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          <span className="text-xs">Loading tickets...</span>
        </div>
      ) : tickets.length === 0 ? (
        <div className="p-12 bg-card border border-border rounded-lg text-center">
          <MessageSquare className="w-8 h-8 text-muted-foreground/60 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">No tickets yet</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-5">
            If you encounter an issue with billing, receipt printing, or Windows setup, let us know here.
          </p>
          <Link
            href={`/${locale}/feedback/new`}
            className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:underline"
          >
            <span>Open your first ticket</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg divide-y divide-border overflow-hidden">
          {tickets.map((t) => {
            const formattedNum = `CB-${String(t.publicNumber).padStart(4, "0")}`;
            return (
              <div key={t.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-secondary/30 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-cyan-400">
                      {formattedNum}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
                      {t.type}
                    </span>
                    <span className={`text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded border ${getStatusBadge(t.status)}`}>
                      {t.status.replace("_", " ")}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-foreground">
                    {t.title}
                  </h3>
                  {t.adminResponseMd && (
                    <p className="text-xs text-cyan-300/80 bg-cyan-950/20 border-l-2 border-cyan-400 pl-2.5 py-1 mt-1.5 line-clamp-2">
                      {t.adminResponseMd}
                    </p>
                  )}
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 gap-1 text-xs text-muted-foreground">
                  <span className="text-[11px] font-mono">
                    {new Date(t.createdAt).toLocaleDateString(locale === "en" ? "en-US" : locale)}
                  </span>
                  <Link
                    href={`/${locale}/feedback/${formattedNum}`}
                    className="inline-flex items-center gap-1 text-cyan-400 hover:underline"
                  >
                    <span>View ticket</span>
                    <ExternalLink className="w-3 h-3" />
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
