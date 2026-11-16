"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Loader2, Bell, Trash2 } from "lucide-react";

interface Alert {
  _id: string;
  label: string;
  criteria: Record<string, any>;
  createdAt: string;
}

export default function SavedSearchesPage() {
  const [alerts, setAlerts] = useState<Alert[] | null>(null);

  function load() {
    fetch("/api/search-alerts")
      .then((res) => res.json())
      .then((data) => setAlerts(data.alerts ?? []));
  }

  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    const res = await fetch(`/api/search-alerts/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Couldn't remove this alert.");
      return;
    }
    toast.success("Alert removed.");
    load();
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-navy mb-1 flex items-center gap-2">
        <Bell className="w-6 h-6 text-gold" /> Saved searches
      </h1>
      <p className="text-navy/60 mb-8">
        We'll email you as soon as a new listing matches. Create one from the{" "}
        <Link href="/listings" className="text-gold-dark hover:underline">Browse</Link> page using "Alert me."
      </p>

      {alerts === null ? (
        <div className="text-center py-16"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gold" /></div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-navy/10 text-navy/60">
          No saved searches yet.
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert._id} className="bg-white border border-navy/10 rounded-lg p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-navy capitalize">{alert.label}</p>
                <p className="text-xs text-navy/40">Saved {new Date(alert.createdAt).toLocaleDateString()}</p>
              </div>
              <button
                onClick={() => remove(alert._id)}
                className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
