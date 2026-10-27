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
    <div className="border-hairline bg-surface/70 mb-6 flex flex-col justify-between gap-4 rounded-2xl border p-4 shadow-xs backdrop-blur-sm md:flex-row md:items-center">
      {/* Type Tabs */}
      <div className="border-hairline bg-surface-elevated/50 flex items-center gap-1 rounded-xl border p-1">
        <button
          type="button"
          onClick={() => onTypeChange("all")}
          className={`rounded-lg px-3 py-1.5 text-xs transition-all ${
            currentType === "all"
              ? "border-hairline bg-surface text-text border font-semibold shadow-xs"
              : "text-muted hover:text-text"
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => onTypeChange("bug")}
          className={`rounded-lg px-3 py-1.5 text-xs transition-all ${
            currentType === "bug"
              ? "border-hairline bg-surface text-text border font-semibold shadow-xs"
              : "text-muted hover:text-text"
          }`}
        >
          Bugs
        </button>
        <button
          type="button"
          onClick={() => onTypeChange("feature")}
          className={`rounded-lg px-3 py-1.5 text-xs transition-all ${
            currentType === "feature"
              ? "border-hairline bg-surface text-text border font-semibold shadow-xs"
              : "text-muted hover:text-text"
          }`}
        >
          Features
        </button>
      </div>

      {/* Search & Select Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 sm:w-60">
          <Search className="text-muted absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search feedback..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="border-hairline bg-surface text-text placeholder:text-muted focus:border-azure/50 focus:ring-azure/40 w-full rounded-xl border py-2 pr-3 pl-9 text-xs transition-colors focus:ring-1 focus:outline-none"
          />
        </div>

        {/* Status Dropdown */}
        <select
          value={currentStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          className="border-hairline bg-surface text-text focus:border-azure/50 focus:ring-azure/40 rounded-xl border px-3 py-2 text-xs transition-colors focus:ring-1 focus:outline-none"
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
        <div className="border-hairline bg-surface-elevated/50 flex items-center gap-1 rounded-xl border p-1">
          <button
            type="button"
            onClick={() => onSortChange("votes")}
            className={`rounded-lg px-2.5 py-1 text-xs transition-all ${
              currentSort === "votes"
                ? "border-hairline bg-surface text-text border font-semibold shadow-xs"
                : "text-muted hover:text-text"
            }`}
          >
            Most votes
          </button>
          <button
            type="button"
            onClick={() => onSortChange("newest")}
            className={`rounded-lg px-2.5 py-1 text-xs transition-all ${
              currentSort === "newest"
                ? "border-hairline bg-surface text-text border font-semibold shadow-xs"
                : "text-muted hover:text-text"
            }`}
          >
            Newest
          </button>
        </div>
      </div>
    </div>
  );
}
