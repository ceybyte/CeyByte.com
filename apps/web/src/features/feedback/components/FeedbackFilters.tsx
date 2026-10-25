"use client";

import { Search } from "lucide-react";

interface FeedbackFiltersProps {
  currentType: string;
  onTypeChange: (type: string) => void;
  currentStatus: string;
  onStatusChange: (status: string) => void;
  currentSort: string;
  onSortChange: (sort: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
}

export function FeedbackFilters({
  currentType,
  onTypeChange,
  currentStatus,
  onStatusChange,
  currentSort,
  onSortChange,
  search,
  onSearchChange,
}: FeedbackFiltersProps) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 md:flex-row md:items-center">
      {/* Type Tabs */}
      <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
        <button
          type="button"
          onClick={() => onTypeChange("all")}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            currentType === "all"
              ? "bg-zinc-800 text-zinc-100 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => onTypeChange("bug")}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            currentType === "bug"
              ? "bg-zinc-800 text-zinc-100 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Bugs
        </button>
        <button
          type="button"
          onClick={() => onTypeChange("feature")}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            currentType === "feature"
              ? "bg-zinc-800 text-zinc-100 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Features
        </button>
      </div>

      {/* Search & Select Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 sm:w-60">
          <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search feedback..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-1.5 pr-3 pl-9 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-700 focus:outline-none"
          />
        </div>

        {/* Status Dropdown */}
        <select
          value={currentStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-300 focus:border-zinc-700 focus:outline-none"
        >
          <option value="all">Any status</option>
          <option value="open">Open</option>
          <option value="triaged">Triaged</option>
          <option value="planned">Planned</option>
          <option value="in_progress">In progress</option>
          <option value="shipped">Shipped</option>
          <option value="closed">Closed</option>
          <option value="duplicate">Duplicate</option>
          <option value="wont_fix">Won&apos;t fix</option>
        </select>

        {/* Sort Select / Toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
          <button
            type="button"
            onClick={() => onSortChange("votes")}
            className={`rounded px-2.5 py-1 text-xs font-medium ${
              currentSort === "votes" ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Most votes
          </button>
          <button
            type="button"
            onClick={() => onSortChange("newest")}
            className={`rounded px-2.5 py-1 text-xs font-medium ${
              currentSort === "newest" ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Newest
          </button>
        </div>
      </div>
    </div>
  );
}
