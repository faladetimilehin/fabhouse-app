"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle, XCircle, BadgeCheck, ShieldOff, ShieldCheck, FileCheck, FileX } from "lucide-react";
import AdminNav from "../AdminNav";

interface LogEntry {
  _id: string;
  adminName: string;
  action: string;
  targetType: string;
  targetLabel: string;
  reason?: string;
  createdAt: string;
}

const ACTION_META: Record<string, { label: string; icon: any; color: string }> = {
  listing_approved: { label: "Approved listing", icon: CheckCircle, color: "text-green-600" },
  listing_rejected: { label: "Rejected listing", icon: XCircle, color: "text-red-600" },
  user_verified: { label: "Verified user", icon: BadgeCheck, color: "text-gold-dark" },
  user_unverified: { label: "Removed verification", icon: BadgeCheck, color: "text-navy/40" },
  user_suspended: { label: "Suspended user", icon: ShieldOff, color: "text-red-600" },
  user_unsuspended: { label: "Unsuspended user", icon: ShieldCheck, color: "text-green-600" },
  verification_approved: { label: "Approved verification doc", icon: FileCheck, color: "text-green-600" },
  verification_rejected: { label: "Rejected verification doc", icon: FileX, color: "text-red-600" },
};

const ACTION_OPTIONS = Object.keys(ACTION_META);

export default function AdminAuditLogClient() {
  const [entries, setEntries] = useState<LogEntry[] | null>(null);
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setEntries(null);
    const params = new URLSearchParams();
    if (action) params.set("action", action);
    params.set("page", String(page));

    fetch(`/api/admin/audit-log?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setEntries(data.entries ?? []);
        setTotalPages(data.pagination?.totalPages ?? 1);
        setTotal(data.pagination?.total ?? 0);
      });
  }, [action, page]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-navy mb-1">Admin</h1>
      <AdminNav />

      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1); }}
          className="border border-navy/15 rounded-md px-3 py-2 text-sm outline-none focus:border-gold"
        >
          <option value="">All actions</option>
          {ACTION_OPTIONS.map((a) => (
            <option key={a} value={a}>{ACTION_META[a].label}</option>
          ))}
        </select>
      </div>

      <p className="text-navy/60 text-sm mb-4">{total} logged action{total === 1 ? "" : "s"}</p>

      {entries === null ? (
        <div className="text-center py-16"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gold" /></div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-navy/10 text-navy/60">
          No admin actions logged yet.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-navy/10 divide-y divide-navy/10">
          {entries.map((entry) => {
            const meta = ACTION_META[entry.action] ?? { label: entry.action, icon: CheckCircle, color: "text-navy" };
            const Icon = meta.icon;
            return (
              <div key={entry._id} className="p-4 flex items-start gap-3">
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${meta.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-navy">
                    <span className="font-semibold">{entry.adminName}</span>{" "}
                    <span className="text-navy/60">{meta.label.toLowerCase()}</span>{" "}
                    <span className="font-medium">{entry.targetLabel}</span>
                  </p>
                  {entry.reason && (
                    <p className="text-xs text-navy/50 mt-1">Reason: {entry.reason}</p>
                  )}
                </div>
                <p className="text-xs text-navy/40 shrink-0">{new Date(entry.createdAt).toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-2 rounded-md text-sm font-semibold border border-navy/15 disabled:opacity-40 hover:bg-navy hover:text-white transition"
          >
            Previous
          </button>
          <span className="text-sm text-navy/60 px-2">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-2 rounded-md text-sm font-semibold border border-navy/15 disabled:opacity-40 hover:bg-navy hover:text-white transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
