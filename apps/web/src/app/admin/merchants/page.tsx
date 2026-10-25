"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Search, Download, Star, Loader2, Store } from "lucide-react";
import { AdminMerchant, fetchMerchants } from "@/features/admin/api";
import { MerchantDrawer } from "@/features/admin/components/merchant-drawer";

export default function AdminMerchantsPage() {
  const [merchants, setMerchants] = useState<AdminMerchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [district, setDistrict] = useState("all");
  const [status, setStatus] = useState("all");
  const [selectedMerchant, setSelectedMerchant] = useState<AdminMerchant | null>(null);

  const loadMerchants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchMerchants({ search, district, status });
      setMerchants(res.items);
    } catch {
      // In dev or offline fallback
      setMerchants([]);
    } finally {
      setLoading(false);
    }
  }, [search, district, status]);

  useEffect(() => {
    loadMerchants();
  }, [loadMerchants]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    loadMerchants();
  }

  function handleMerchantUpdated(updated: AdminMerchant) {
    setMerchants((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    setSelectedMerchant(updated);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">Merchants Directory</h1>
          <p className="text-xs text-text-muted">
            Directory records, verification statuses, and map visibility
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/admin/merchants.csv"
            download="merchants.csv"
            className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-surface-elevated px-3 py-1.5 text-xs font-medium text-text-muted hover:border-azure/40 hover:text-text-primary"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-hairline bg-surface p-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative min-w-[240px] flex-1">
          <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by shop or city..."
            className="h-8 w-full rounded-md border border-hairline bg-canvas pr-3 pl-9 text-xs text-text-primary placeholder:text-text-muted focus:border-azure focus:outline-none"
          />
        </form>

        {/* District Filter */}
        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          className="h-8 rounded-md border border-hairline bg-canvas px-2.5 text-xs text-text-primary focus:border-azure focus:outline-none"
        >
          <option value="all">All Districts</option>
          <option value="colombo">Colombo</option>
          <option value="gampaha">Gampaha</option>
          <option value="kandy">Kandy</option>
          <option value="galle">Galle</option>
          <option value="kurunegala">Kurunegala</option>
          <option value="jaffna">Jaffna</option>
        </select>

        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-8 rounded-md border border-hairline bg-canvas px-2.5 text-xs text-text-primary focus:border-azure focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="listed">Listed</option>
          <option value="hidden">Hidden</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-hairline bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-hairline bg-surface-elevated text-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Shop Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">District & City</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Supporter</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-azure" />
                      <span>Loading merchants...</span>
                    </div>
                  </td>
                </tr>
              ) : merchants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                    No merchants match the current criteria.
                  </td>
                </tr>
              ) : (
                merchants.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => setSelectedMerchant(m)}
                    className="h-11 cursor-pointer transition-colors hover:bg-surface-elevated/60"
                  >
                    <td className="px-4 py-2 font-medium text-text-primary">
                      <div className="flex items-center gap-2">
                        <Store className="h-3.5 w-3.5 text-text-muted" />
                        <span>{m.shopName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-text-muted capitalize">{m.category}</td>
                    <td className="px-4 py-2 text-text-muted">
                      <span className="capitalize">{m.district}</span> · {m.city}
                    </td>
                    <td className="px-4 py-2 font-mono text-text-muted">
                      {m.phone ?? "—"}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          m.status === "listed"
                            ? "bg-azure/10 text-azure"
                            : m.status === "hidden"
                            ? "bg-surface-elevated text-text-muted"
                            : "bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {m.isSupporter ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400">
                          <Star className="h-3 w-3 fill-amber-400" />
                          <span>Supporter</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMerchant(m);
                        }}
                        className="rounded border border-hairline bg-surface-elevated px-2 py-1 text-[11px] font-medium text-text-muted hover:text-text-primary"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer */}
      <MerchantDrawer
        merchant={selectedMerchant}
        onClose={() => setSelectedMerchant(null)}
        onUpdate={handleMerchantUpdated}
      />
    </div>
  );
}
