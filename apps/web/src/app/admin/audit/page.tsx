"use client";

import React, { useEffect, useState } from "react";
import { ChevronRight, ChevronDown, User, Clock, Loader2 } from "lucide-react";
import { AdminAuditEntry, fetchAuditLog } from "@/features/admin/api";

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AdminAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      try {
        const res = await fetchAuditLog();
        setLogs(res.items);
      } catch {
        // Dev fallback
        setLogs([
          {
            id: "aud_1",
            actorUserId: "usr_admin123",
            action: "merchant.reveal",
            entityType: "merchant",
            entityId: "m_test123",
            diff: { note: "Contact revealed by admin" },
            createdAt: Date.now() - 3600000,
          },
          {
            id: "aud_2",
            actorUserId: "usr_admin123",
            action: "doc.publish",
            entityType: "doc",
            entityId: "install",
            diff: { status: "published" },
            createdAt: Date.now() - 7200000,
          },
        ]);
      } finally {
        setLoading(false);
      }
    }

    loadLogs();
  }, []);

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function getActionBadge(action: string) {
    if (action.includes("reveal")) {
      return "bg-amber-500/10 text-amber-400 border border-amber-500/30";
    }
    if (action.includes("publish")) {
      return "bg-azure/10 text-azure border border-azure/30";
    }
    if (action.includes("export")) {
      return "bg-purple-500/10 text-purple-400 border border-purple-500/30";
    }
    return "bg-surface-elevated text-text-muted border border-hairline";
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-text-primary text-xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-text-muted text-xs">
          Immutable ledger of sensitive actions, privacy reveals, and CMS content updates
        </p>
      </div>

      {/* Table */}
      <div className="border-hairline bg-surface overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-hairline bg-surface-elevated text-text-muted border-b">
              <tr>
                <th className="w-8 px-3 py-3"></th>
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Entity Type</th>
                <th className="px-4 py-3 font-medium">Entity ID</th>
              </tr>
            </thead>
            <tbody className="divide-hairline divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-text-muted px-4 py-8 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="text-azure h-4 w-4 animate-spin" />
                      <span>Loading audit records...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-text-muted px-4 py-8 text-center">
                    No audit records logged yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isExpanded = expandedId === log.id;
                  const dateStr =
                    typeof log.createdAt === "number"
                      ? new Date(log.createdAt).toISOString().replace("T", " ").slice(0, 19)
                      : String(log.createdAt);

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => toggleExpand(log.id)}
                        className="hover:bg-surface-elevated/50 h-11 cursor-pointer transition-colors"
                      >
                        <td className="text-text-muted px-3 py-2">
                          {isExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                        </td>
                        <td className="text-text-muted px-4 py-2 font-mono">
                          <div className="flex items-center gap-1.5">
                            <Clock className="text-text-muted h-3 w-3" />
                            <span>{dateStr}</span>
                          </div>
                        </td>
                        <td className="text-text-primary px-4 py-2 font-mono">
                          <div className="flex items-center gap-1.5">
                            <User className="text-text-muted h-3 w-3" />
                            <span>{log.actorUserId ? log.actorUserId.slice(0, 12) : "system"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold ${getActionBadge(
                              log.action,
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="text-text-muted px-4 py-2 capitalize">{log.entityType ?? "—"}</td>
                        <td className="text-text-muted px-4 py-2 font-mono">{log.entityId ?? "—"}</td>
                      </tr>

                      {/* Expandable Diff Viewer */}
                      {isExpanded && (
                        <tr className="bg-canvas">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="border-hairline bg-surface rounded border p-3 font-mono text-[11px]">
                              <div className="text-text-muted mb-2 uppercase">Audit Payload Diff:</div>
                              <pre className="text-azure overflow-x-auto">
                                {JSON.stringify(
                                  log.diff ?? { note: "No additional metadata recorded" },
                                  null,
                                  2,
                                )}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
