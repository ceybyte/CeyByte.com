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
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl mb-6">
      {/* Type Tabs */}
      <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
        <button
          type="button"
          onClick={() => onTypeChange("all")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
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
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
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
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
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
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search feedback..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
          />
        </div>

        {/* Status Dropdown */}
        <select
          value={currentStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-3 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 focus:outline-none focus:border-zinc-700"
        >
          <option value="all">Any status</option>
          <option value="open">Open</option>
          <option value="triaged">Triaged</option>
          <option value="planned">Planned</option>
          <option value="in_progress">In progress</option>
          <option value="shipped">Shipped</option>
          <option value="closed">Closed</option>
          <option value="duplicate">Duplicate</option>
          <option value="wont_fix">Won't fix</option>
        </select>

        {/* Sort Select / Toggle */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          <button
            type="button"
            onClick={() => onSortChange("votes")}
            className={`px-2.5 py-1 text-xs font-medium rounded ${
              currentSort === "votes"
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Most votes
          </button>
          <button
            type="button"
            onClick={() => onSortChange("newest")}
            className={`px-2.5 py-1 text-xs font-medium rounded ${
              currentSort === "newest"
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Newest
          </button>
        </div>
      </div>
    </div>
  );
}
