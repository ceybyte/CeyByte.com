"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Bug, Lightbulb, Loader2 } from "lucide-react";
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

  const loadTickets = async () => {
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
  };

  useEffect(() => {
    loadTickets();
  }, [type, status, sort, page]);

  const handleClearFilters = () => {
    setType("all");
    setStatus("all");
    setSort("votes");
    setSearch("");
    setPage(1);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-100">Feedback</h1>
          <p className="mt-1 text-sm text-zinc-400 max-w-xl">
            Tell us what's broken or what you'd like next. We read every ticket and post updates on
            it here.
          </p>
        </div>

        {/* Action buttons (Secondary / Outline - Single Green Button Rule) */}
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/feedback/new?type=feature`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 hover:border-zinc-600 transition-colors shadow-sm"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>Suggest a feature</span>
          </Link>
          <Link
            href={`/${locale}/feedback/new?type=bug`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 hover:border-zinc-600 transition-colors shadow-sm"
          >
            <Bug className="w-3.5 h-3.5 text-rose-400" />
            <span>Report a problem</span>
          </Link>
        </div>
      </div>

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
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-zinc-500 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-azure-400" />
            <span className="text-xs">Loading feedback tickets...</span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-20 text-center px-4">
            <p className="text-sm text-zinc-400 mb-3">No tickets match these filters.</p>
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-1.5 text-xs font-medium text-azure-400 hover:text-azure-300 underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {tickets.map((ticket) => (
              <FeedbackCard key={ticket.id} ticket={ticket} locale={locale} />
            ))}
          </div>
        )}

        {/* Pagination footer */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950/40 text-xs text-zinc-400">
            <span>
              Showing <span className="font-mono">{tickets.length}</span> of{" "}
              <span className="font-mono">{total}</span> tickets
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="font-mono text-zinc-300">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
