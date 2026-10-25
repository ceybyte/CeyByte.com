"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminFeedbackTicket, fetchAdminFeedback, updateAdminFeedback } from "../api";

export function FeedbackTriage() {
  const [tickets, setTickets] = useState<AdminFeedbackTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<AdminFeedbackTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Form edit state for selected ticket
  const [status, setStatus] = useState<string>("open");
  const [severity, setSeverity] = useState<string>("");
  const [adminResponse, setAdminResponse] = useState<string>("");
  const [resolvedReleaseId, setResolvedReleaseId] = useState<string>("");
  const [duplicateOfId, setDuplicateOfId] = useState<string>("");
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchAdminFeedback({
        status: statusFilter,
        type: typeFilter,
        search: search.trim() || undefined,
      });
      setTickets(res.items);
      if (res.items.length > 0) {
        // If current selection is still in list, keep it; otherwise select first
        setSelectedTicket((prev) => {
          if (!prev) return res.items[0] ?? null;
          const matched = res.items.find((t) => t.id === prev.id);
          return matched ?? res.items[0] ?? null;
        });
      } else {
        setSelectedTicket(null);
      }
    } catch {
      setMessage({ text: "Failed to load feedback tickets", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, search]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    if (selectedTicket) {
      setStatus(selectedTicket.status);
      setSeverity(selectedTicket.severity ?? "");
      setAdminResponse(selectedTicket.adminResponseMd ?? "");
      setResolvedReleaseId(selectedTicket.resolvedInReleaseId ?? "");
      setDuplicateOfId(selectedTicket.duplicateOfId ?? "");
      setIsPublic(selectedTicket.isPublic);
      setMessage(null);
    }
  }, [selectedTicket]);

  const handleSave = async (approveScreenshot = false) => {
    if (!selectedTicket) return;
    try {
      setSaving(true);
      setMessage(null);
      const updated = await updateAdminFeedback(selectedTicket.id, {
        status: status,
        severity: severity || null,
        adminResponseMd: adminResponse || null,
        resolvedInReleaseId: resolvedReleaseId || null,
        duplicateOfId: duplicateOfId || null,
        isPublic,
        approveScreenshot,
      });

      setMessage({ text: "Ticket updated successfully", type: "success" });
      setSelectedTicket((prev) => (prev ? { ...prev, ...updated } : updated));
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
    } catch {
      setMessage({ text: "Failed to update ticket", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/60 px-6 py-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Feedback Triage (F-08)</h1>
          <p className="text-xs text-zinc-400">
            Review user reports, crash logs, approve screenshots, and link releases.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadTickets()}
            className="w-48 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs focus:border-zinc-500 focus:outline-none"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="bug">Bugs</option>
            <option value="feature">Features</option>
            <option value="question">Questions</option>
            <option value="listing_report">Map Reports</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="triaged">Triaged</option>
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="shipped">Shipped</option>
            <option value="closed">Closed</option>
            <option value="duplicate">Duplicate</option>
            <option value="wont_fix">Won&apos;t Fix</option>
          </select>
          <button
            onClick={() => loadTickets()}
            className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium hover:bg-zinc-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Main split pane */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Queue List */}
        <div className="flex w-96 flex-col overflow-y-auto border-r border-zinc-800 bg-zinc-900/30">
          {loading ? (
            <div className="p-8 text-center text-xs text-zinc-500">Loading queue...</div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">No tickets found in queue.</div>
          ) : (
            tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTicket(t)}
                className={`flex flex-col border-b border-zinc-800/60 p-4 text-left transition-colors ${
                  selectedTicket?.id === t.id
                    ? "border-l-azure-500 border-l-2 bg-zinc-800/80"
                    : "hover:bg-zinc-850"
                }`}
              >
                <div className="mb-1 flex w-full items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-zinc-300">{t.formattedNumber}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${
                      t.status === "shipped"
                        ? "border border-emerald-800/50 bg-emerald-950 text-emerald-400"
                        : t.status === "planned"
                          ? "border border-amber-800/50 bg-amber-950 text-amber-400"
                          : "border border-zinc-700 bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
                <div className="mb-2 line-clamp-2 text-sm font-medium text-zinc-200">{t.title}</div>
                <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                  <span className="capitalize">{t.type.replace("_", " ")}</span>
                  <span>•</span>
                  <span>{t.voteCount} votes</span>
                  {t.crashLogKey && (
                    <>
                      <span>•</span>
                      <span className="text-red-400">Crash Log</span>
                    </>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Right: Ticket Detail & Edit Controls */}
        {selectedTicket ? (
          <div className="flex flex-1 flex-col space-y-6 overflow-y-auto p-6">
            {message && (
              <div
                className={`rounded-md p-3 text-xs font-medium ${
                  message.type === "success"
                    ? "border border-emerald-800 bg-emerald-950/80 text-emerald-300"
                    : "border border-red-800 bg-red-950/80 text-red-300"
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Top metadata row */}
            <div className="flex items-start justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-azure-400 font-mono text-sm font-bold">
                    {selectedTicket.formattedNumber}
                  </span>
                  <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300 uppercase">
                    {selectedTicket.type}
                  </span>
                  {selectedTicket.severity && (
                    <span className="rounded border border-rose-800/50 bg-rose-950/80 px-2 py-0.5 text-xs font-medium text-rose-400">
                      {selectedTicket.severity}
                    </span>
                  )}
                  {!selectedTicket.isPublic && (
                    <span className="rounded border border-purple-800/50 bg-purple-950/80 px-2 py-0.5 text-xs font-medium text-purple-400">
                      Private Ticket
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-zinc-100">{selectedTicket.title}</h2>
              </div>
              <div className="text-right text-xs text-zinc-500">
                <div>Created: {new Date(selectedTicket.createdAt).toLocaleDateString()}</div>
                <div>Votes: {selectedTicket.voteCount}</div>
              </div>
            </div>

            {/* Description Body */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4">
              <h3 className="mb-2 text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                Description
              </h3>
              <p className="font-sans text-sm whitespace-pre-wrap text-zinc-300">{selectedTicket.bodyMd}</p>
            </div>

            {/* Versions & Private Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                <h3 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">Environment</h3>
                <div className="text-xs text-zinc-300">
                  <span className="text-zinc-500">App Version:</span>{" "}
                  {selectedTicket.appVersion || "Not specified"}
                </div>
                <div className="text-xs text-zinc-300">
                  <span className="text-zinc-500">Windows OS:</span>{" "}
                  {selectedTicket.windowsVersion || "Not specified"}
                </div>
              </div>

              <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                <h3 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                  Private Reporter Info (Admin Only)
                </h3>
                <div className="text-xs text-zinc-300">
                  <span className="text-zinc-500">Contact:</span>{" "}
                  {selectedTicket.contactPrivate || "Anonymous (No contact provided)"}
                </div>
                {selectedTicket.crashLogUrl ? (
                  <div className="text-xs">
                    <span className="text-zinc-500">Crash Log:</span>{" "}
                    <a
                      href={selectedTicket.crashLogUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-azure-400 hover:text-azure-300 underline"
                    >
                      Download cbpos_logs.txt
                    </a>
                  </div>
                ) : (
                  <div className="text-xs text-zinc-500">No crash log attached</div>
                )}
              </div>
            </div>

            {/* Screenshots section */}
            {(selectedTicket.screenshotPrivateUrl || selectedTicket.screenshotPublicKey) && (
              <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                    Screenshot Attachment
                  </h3>
                  {selectedTicket.screenshotPublicKey ? (
                    <span className="text-xs font-medium text-emerald-400">✓ Approved for Public</span>
                  ) : (
                    <button
                      onClick={() => handleSave(true)}
                      disabled={saving}
                      className="rounded bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-500"
                    >
                      Approve & Publish Screenshot
                    </button>
                  )}
                </div>
                {selectedTicket.screenshotPrivateUrl && (
                  <div className="mt-2">
                    <a
                      href={selectedTicket.screenshotPrivateUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-azure-400 text-xs underline"
                    >
                      View Full Attached Screenshot
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Triage controls */}
            <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <h3 className="text-xs font-semibold tracking-wider text-zinc-300 uppercase">
                Triage & Status Transitions
              </h3>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-zinc-400">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200"
                  >
                    <option value="open">Open</option>
                    <option value="triaged">Triaged</option>
                    <option value="planned">Planned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="shipped">Shipped</option>
                    <option value="closed">Closed</option>
                    <option value="duplicate">Duplicate</option>
                    <option value="wont_fix">Won&apos;t Fix</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-zinc-400">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200"
                  >
                    <option value="">None</option>
                    <option value="crash">Crash</option>
                    <option value="blocks_billing">Blocks Billing</option>
                    <option value="wrong_output">Wrong Output</option>
                    <option value="cosmetic">Cosmetic</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-zinc-400">Resolved in Release ID</label>
                  <input
                    type="text"
                    placeholder="Release UUID (e.g. v1.5.0)"
                    value={resolvedReleaseId}
                    onChange={(e) => setResolvedReleaseId(e.target.value)}
                    className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-zinc-400">Official Team Response (Markdown)</label>
                <textarea
                  rows={3}
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Official Ceybyte team comment displayed on the public ticket detail..."
                  className="w-full rounded border border-zinc-700 bg-zinc-800 p-2.5 text-xs text-zinc-200 focus:border-zinc-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="text-azure-500 rounded border-zinc-700 bg-zinc-800"
                  />
                  <span>Visible on Public Board</span>
                </label>

                <button
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="rounded-md bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow transition-colors hover:bg-emerald-500 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
            Select a ticket from the left queue to view details and triage.
          </div>
        )}
      </div>
    </div>
  );
}
