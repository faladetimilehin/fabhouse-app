"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { Loader2, Check, X } from "lucide-react";
import AdminNav from "../AdminNav";

interface PendingVerification {
  _id: string;
  name: string;
  email: string;
  role: string;
  verificationDocUrl: string;
  createdAt: string;
}

export default function AdminVerificationsClient() {
  const [pending, setPending] = useState<PendingVerification[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    setPending(null);
    fetch("/api/admin/verifications")
      .then((res) => res.json())
      .then((data) => setPending(data.pending ?? []));
  }

  useEffect(() => { load(); }, []);

  async function decide(id: string, decision: "approved" | "rejected") {
    let reason: string | undefined;
    if (decision === "rejected") {
      reason = window.prompt("Optional: reason for rejection (sent to the user)") ?? undefined;
    }

    setBusyId(id);
    const res = await fetch(`/api/admin/verifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, reason }),
    });
    setBusyId(null);

    if (!res.ok) {
      toast.error("Couldn't update verification status.");
      return;
    }

    toast.success(decision === "approved" ? "User verified." : "Verification rejected.");
    load();
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-navy mb-1">Admin</h1>
      <AdminNav />

      <h2 className="text-lg font-semibold text-navy mb-1">Verification submissions</h2>
      <p className="text-navy/60 mb-6">{pending?.length ?? 0} pending</p>

      {pending === null ? (
        <div className="text-center py-16"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gold" /></div>
      ) : pending.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-navy/10 text-navy/60">
          No verification submissions waiting.
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((p) => (
            <div key={p._id} className="bg-white border border-navy/10 rounded-lg p-4 flex gap-4 items-start flex-wrap">
              <div className="relative w-32 h-24 bg-navy/5 rounded-md overflow-hidden shrink-0">
                <Image src={p.verificationDocUrl} alt="Verification document" fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-[180px]">
                <p className="font-semibold text-navy">{p.name}</p>
                <p className="text-xs text-navy/50">{p.email} · <span className="capitalize">{p.role}</span></p>
                <p className="text-xs text-navy/40 mt-1">Submitted {new Date(p.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={busyId === p._id}
                  onClick={() => decide(p._id, "approved")}
                  className="flex items-center gap-1 bg-green-600 text-white text-sm font-semibold px-3 py-2 rounded-md hover:bg-green-700 transition disabled:opacity-50"
                >
                  <Check className="w-4 h-4" /> Approve
                </button>
                <button
                  disabled={busyId === p._id}
                  onClick={() => decide(p._id, "rejected")}
                  className="flex items-center gap-1 bg-red-100 text-red-700 text-sm font-semibold px-3 py-2 rounded-md hover:bg-red-200 transition disabled:opacity-50"
                >
                  <X className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
