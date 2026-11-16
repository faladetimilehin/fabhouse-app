"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type Ticket = { _id: string; category: string; message: string; status: string; staffNote?: string; staffResponse?: string; createdAt: string; booking?: { status: string; property?: { title: string }; checkIn: string; checkOut: string }; reporter?: { name: string; email: string } };

export default function StaySupportClient() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  async function refresh() {
    const response = await fetch("/api/stays/support");
    const data = await response.json().catch(() => ({}));
    if (!response.ok) toast.error(data.error ?? "Couldn't load support requests.");
    else setTickets(data.tickets ?? []);
    setLoading(false);
  }
  useEffect(() => { void refresh(); }, []);

  async function update(ticket: Ticket, status: string) {
    const response = await fetch(`/api/admin/stay-support/${ticket._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, staffResponse: notes[ticket._id] ?? ticket.staffResponse ?? "" }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { toast.error(data.error ?? "Couldn't update support request."); return; }
    toast.success("Support request updated.");
    await refresh();
  }

  return <main className="mx-auto max-w-4xl px-6 py-10">
    <h1 className="text-2xl font-bold text-navy">Short-stay support</h1>
    <p className="mt-1 text-sm text-navy/60">Assign, respond and close guest or host issues. Set staffing and response targets before accepting paid bookings.</p>
    <div className="mt-6 space-y-4">{loading ? <p className="text-sm text-navy/50">Loading...</p> : tickets.length === 0 ? <p className="rounded border border-navy/10 bg-white p-8 text-center text-navy/50">No support requests.</p> : tickets.map((ticket) => <article key={ticket._id} className="rounded-lg border border-navy/10 bg-white p-5">
      <div className="flex flex-wrap justify-between gap-2"><h2 className="font-semibold text-navy">{ticket.category} · {ticket.booking?.property?.title ?? "Stay"}</h2><span className="text-xs text-navy/50">{ticket.status} · {new Date(ticket.createdAt).toLocaleString()}</span></div>
      <p className="mt-2 text-sm text-navy/60">{ticket.reporter?.name} ({ticket.reporter?.email}) · {ticket.booking?.checkIn?.slice(0, 10)} to {ticket.booking?.checkOut?.slice(0, 10)}</p>
      <p className="mt-3 rounded bg-navy/5 p-3 text-sm text-navy/80">{ticket.message}</p>
      {ticket.staffResponse && <p className="mt-3 rounded bg-green-50 p-3 text-sm text-green-900">Last reply: {ticket.staffResponse}</p>}
      <textarea aria-label="Reply to guest or host" value={notes[ticket._id] ?? ""} onChange={(event) => setNotes((previous) => ({ ...previous, [ticket._id]: event.target.value }))} maxLength={2000} placeholder="Reply to guest or host (emailed when you update)" className="mt-3 w-full rounded border border-navy/15 px-3 py-2 text-sm" />
      <div className="mt-3 flex gap-2">{(["open", "in_progress", "resolved"] as const).map((status) => <button key={status} onClick={() => update(ticket, status)} className="rounded border border-navy/20 px-3 py-2 text-xs font-semibold capitalize text-navy">Mark {status.replace("_", " ")}</button>)}</div>
    </article>)}</div>
  </main>;
}
