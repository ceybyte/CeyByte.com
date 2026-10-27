"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bug, Lightbulb, Loader2 } from "lucide-react";
import { Figure } from "@/components/brand/figure";
import { PublicFeedbackTicket } from "../types";
import { fetchFeedbackList } from "../api";
import { FeedbackFilters } from "./FeedbackFilters";
import { FeedbackCard } from "./FeedbackCard";

interface FeedbackBoardProps {
  locale: string;
}

export function FeedbackBoard({ locale }: FeedbackBoardProps) {
  const [tickets, setTickets] = useState<PublicFeedbackTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("votes");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchFeedbackList({
        type,
        status,
        sort,
        search: search.trim() || undefined,
        page,
        pageSize: 20,
      });
      setTickets(res.items);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [type, status, sort, search, page]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleClearFilters = () => {
    setType("all");
    setStatus("all");
    setSort("votes");
    setSearch("");
    setPage(1);
  };

  return (
    <div className="bg-canvas min-h-[calc(100vh-var(--header-h))]">
      {/* Full-width Hero Header matching Features */}
      <section className="border-hairline bg-surface/30 relative overflow-hidden border-b py-14 sm:py-20">
        <div className="pointer-events-none absolute -top-12 -right-12 w-80 opacity-15 sm:w-96">
          <Figure name="patch" intensity={0.4} />
        </div>

        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-3xl">
              <span className="text-azure-text font-mono text-xs font-semibold tracking-wider uppercase">
                COMMUNITY ROADMAP &amp; ISSUES
              </span>
              <h1 className="text-display text-text mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                Feedback
              </h1>
              <p className="text-muted mt-4 text-base leading-relaxed sm:text-lg">
                Tell us what&apos;s broken or what you&apos;d like next. We read every ticket and post updates
                on it here.
              </p>
            </div>

            {/* Action buttons (Secondary / Outline - Single Green Button Rule) */}
            <div className="flex shrink-0 items-center gap-3">
              <Link
                href={`/${locale}/feedback/new?type=feature`}
                className="border-hairline bg-surface text-text hover:bg-surface-elevated hover:border-azure/40 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold shadow-xs transition-all"
              >
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <span>Suggest a feature</span>
              </Link>
              <Link
                href={`/${locale}/feedback/new?type=bug`}
                className="border-hairline bg-surface text-text hover:bg-surface-elevated hover:border-azure/40 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold shadow-xs transition-all"
              >
                <Bug className="h-4 w-4 text-rose-500" />
                <span>Report a problem</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Filters component */}
        <FeedbackFilters
          currentType={type}
          onTypeChange={(t) => {
            setType(t);
            setPage(1);
          }}
          currentStatus={status}
          onStatusChange={(s) => {
            setStatus(s);
            setPage(1);
          }}
          currentSort={sort}
          onSortChange={(s) => {
            setSort(s);
            setPage(1);
          }}
          search={search}
          onSearchChange={(q) => setSearch(q)}
        />

        {/* Board Ticket List Card */}
        <div className="border-hairline bg-surface/70 overflow-hidden rounded-2xl border shadow-xs backdrop-blur-sm">
          {loading ? (
            <div className="text-muted flex flex-col items-center justify-center gap-3 py-20">
              <Loader2 className="text-azure-text h-6 w-6 animate-spin" />
              <span className="text-xs">Loading feedback tickets...</span>
            </div>
          ) : tickets.length === 0 ? (
            <div className="px-4 py-20 text-center">
              <p className="text-muted mb-3 text-sm">No tickets match these filters.</p>
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-azure-text px-4 py-1.5 text-xs font-medium hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="divide-hairline divide-y">
              {tickets.map((ticket) => (
                <FeedbackCard key={ticket.id} ticket={ticket} locale={locale} />
              ))}
            </div>
          )}

          {/* Pagination footer */}
          {!loading && totalPages > 1 && (
            <div className="border-hairline bg-surface-elevated/40 text-muted flex items-center justify-between border-t px-6 py-4 text-xs">
              <span>
                Showing <span className="font-mono">{tickets.length}</span> of{" "}
                <span className="font-mono">{total}</span> tickets
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="border-hairline bg-surface text-text hover:bg-surface-elevated rounded-lg border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-text font-mono">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="border-hairline bg-surface text-text hover:bg-surface-elevated rounded-lg border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
