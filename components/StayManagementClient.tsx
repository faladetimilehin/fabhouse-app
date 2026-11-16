"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

type Listing = { _id: string; title: string; city?: string; location?: { city?: string } };
type Booking = {
  _id: string; property: { _id: string; title: string; location?: { city?: string }; owner?: { name?: string; email?: string; phone?: string } } | null;
  checkIn: string; checkOut: string; guestCount: number; guestMessage?: string; status: string;
  holdExpiresAt?: string; isHost: boolean; isGuest: boolean; guest?: { name?: string; email?: string; phone?: string };
};
type SupportTicket = { _id: string; booking: string | { _id: string }; category: string; message: string; status: string; staffResponse?: string; createdAt: string };

const label: Record<string, string> = {
  requested: "Host response needed", accepted_unpaid: "Accepted · unpaid hold", declined: "Declined",
  cancelled: "Cancelled", expired: "Hold expired",
};

export default function StayManagementClient({ listings }: { listings: Listing[] }) {
  const [selected, setSelected] = useState(listings[0]?._id ?? "");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [supportMessage, setSupportMessage] = useState<Record<string, string>>({});
  const [supportCategory, setSupportCategory] = useState<Record<string, string>>({});
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/stays/bookings");
    const data = await response.json().catch(() => ({}));
    setBookings(data.bookings ?? []);
    const supportResponse = await fetch("/api/stays/support");
    const supportData = await supportResponse.json().catch(() => ({}));
    setTickets(supportData.tickets ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function act(id: string, action: "accept" | "decline" | "cancel") {
    setBusy(id);
    const response = await fetch(`/api/stays/bookings/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(null);
    if (!response.ok) { toast.error(data.error ?? "Couldn't update the stay request."); return; }
    toast.success(action === "accept" ? "Dates held for 24 hours. No payment was taken." : `Request ${action === "cancel" ? "cancelled" : "declined"}.`);
    await refresh();
  }

  async function setCalendarBlock(action: "block" | "unblock") {
    if (!selected || !from || !to) return;
    const response = action === "block"
      ? await fetch(`/api/stays/calendar/${selected}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ from, to }) })
      : await fetch(`/api/stays/calendar/${selected}?from=${from}&to=${to}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { toast.error(data.error ?? "Couldn't update the calendar."); return; }
    toast.success(action === "block" ? "Dates blocked." : "Host blocks removed.");
  }

  async function sendSupportRequest(bookingId: string) {
    const response = await fetch("/api/stays/support", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, category: supportCategory[bookingId] ?? "booking", message: supportMessage[bookingId] ?? "" }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { toast.error(data.error ?? "Couldn't send the support request."); return; }
    setSupportMessage((previous) => ({ ...previous, [bookingId]: "" }));
    toast.success(`Support request ${data.ticketId} opened. The team will review it.`);
  }

  const visibleBookings = bookings.filter((booking) => booking.isHost || booking.isGuest);
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-bold text-navy">Short-stay requests</h1>
      <p className="mt-1 text-sm text-navy/60">Accepted dates are held for 24 hours, unpaid. A hold is not a confirmed booking.</p>

      {listings.length > 0 && <section className="mt-7 rounded-lg border border-navy/10 bg-white p-5">
        <h2 className="font-semibold text-navy">Availability calendar</h2>
        <p className="mt-1 text-sm text-navy/55">Block dates when your place cannot host guests. The checkout date is exclusive.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto_auto]">
          <select aria-label="Choose short-let listing" value={selected} onChange={(event) => setSelected(event.target.value)} className="rounded border border-navy/15 px-3 py-2 text-sm">
            {listings.map((listing) => <option key={listing._id} value={listing._id}>{listing.title}</option>)}
          </select>
          <input aria-label="Block from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="rounded border border-navy/15 px-3 py-2 text-sm" />
          <input aria-label="Block until" type="date" value={to} onChange={(event) => setTo(event.target.value)} className="rounded border border-navy/15 px-3 py-2 text-sm" />
          <button onClick={() => setCalendarBlock("block")} className="rounded bg-navy px-3 py-2 text-sm font-semibold text-white">Block dates</button>
          <button onClick={() => setCalendarBlock("unblock")} className="rounded border border-navy/20 px-3 py-2 text-sm font-semibold text-navy">Unblock</button>
        </div>
      </section>}

      <div className="mt-7 space-y-4">
        {loading ? <p className="text-sm text-navy/50">Loading requests...</p> : visibleBookings.length === 0 ? (
          <p className="rounded-lg border border-navy/10 bg-white p-8 text-center text-sm text-navy/55">No stay requests yet.</p>
        ) : visibleBookings.map((booking) => <article key={booking._id} className="rounded-lg border border-navy/10 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="font-semibold text-navy">{booking.property?.title ?? "Short-let listing"}</h2><p className="text-sm text-navy/60">{booking.checkIn.slice(0, 10)} → {booking.checkOut.slice(0, 10)} · {booking.guestCount} guest(s)</p></div>
            <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-navy">{label[booking.status] ?? booking.status}</span>
          </div>
          {booking.isHost && booking.guest && <p className="mt-2 text-sm text-navy/70">Guest: {booking.guest.name} · {booking.guest.email}{booking.guest.phone ? ` · ${booking.guest.phone}` : ""}</p>}
          {booking.guestMessage && <p className="mt-3 rounded bg-navy/5 p-3 text-sm text-navy/75">{booking.guestMessage}</p>}
          {booking.status === "accepted_unpaid" && booking.holdExpiresAt && <p className="mt-2 text-xs text-amber-700">Unpaid hold expires {new Date(booking.holdExpiresAt).toLocaleString()}.</p>}
          {booking.isGuest && booking.status === "accepted_unpaid" && <div className="mt-3 rounded bg-amber-50 p-3 text-sm text-amber-950"><p>The host accepted and is holding these dates. Fabhouse checkout is not available; contact the host directly to agree arrangements. This is not a confirmed booking.</p>{booking.property?.owner && <p className="mt-1">{booking.property.owner.name} · {booking.property.owner.email}{booking.property.owner.phone ? ` · ${booking.property.owner.phone}` : ""}</p>}<Link href={`/listings/${booking.property?._id}`} className="mt-2 inline-block font-semibold underline">View listing</Link></div>}
          <div className="mt-4 flex flex-wrap gap-2">
            {booking.isHost && booking.status === "requested" && <><button disabled={busy === booking._id} onClick={() => act(booking._id, "accept")} className="rounded bg-navy px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Accept · hold 24h</button><button disabled={busy === booking._id} onClick={() => act(booking._id, "decline")} className="rounded border border-navy/20 px-3 py-2 text-sm font-semibold text-navy disabled:opacity-50">Decline</button></>}
            {((booking.isHost || booking.isGuest) && ["requested", "accepted_unpaid"].includes(booking.status)) && <button disabled={busy === booking._id} onClick={() => act(booking._id, "cancel")} className="rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">Cancel request</button>}
          </div>
          <details className="mt-4 border-t border-navy/10 pt-3">
            <summary className="cursor-pointer text-sm font-semibold text-navy">Get Fabhouse support</summary>
            <div className="mt-3 grid gap-2 sm:grid-cols-[180px_1fr_auto]">
              <select aria-label="Support category" value={supportCategory[booking._id] ?? "booking"} onChange={(event) => setSupportCategory((previous) => ({ ...previous, [booking._id]: event.target.value }))} className="rounded border border-navy/15 px-3 py-2 text-sm">
                <option value="booking">Booking</option><option value="payment">Payment</option><option value="safety">Safety</option><option value="listing">Listing</option><option value="other">Other</option>
              </select>
              <textarea value={supportMessage[booking._id] ?? ""} onChange={(event) => setSupportMessage((previous) => ({ ...previous, [booking._id]: event.target.value }))} minLength={10} maxLength={2000} placeholder="Describe what happened (10–2,000 characters)" className="min-h-10 rounded border border-navy/15 px-3 py-2 text-sm" />
              <button onClick={() => sendSupportRequest(booking._id)} className="rounded border border-navy/20 px-3 py-2 text-sm font-semibold text-navy">Open support request</button>
            </div>
          </details>
        </article>)}
      </div>
      {tickets.length > 0 && <section className="mt-8 rounded-lg border border-navy/10 bg-white p-5">
        <h2 className="font-semibold text-navy">Your support requests</h2>
        <div className="mt-3 space-y-3">{tickets.map((ticket) => <article key={ticket._id} className="border-t border-navy/10 pt-3 text-sm">
          <p className="font-medium capitalize text-navy">{ticket.category} · {ticket.status.replace("_", " ")}</p><p className="mt-1 text-navy/65">{ticket.message}</p>
          {ticket.staffResponse && <p className="mt-2 rounded bg-green-50 p-3 text-green-900">Fabhouse: {ticket.staffResponse}</p>}
        </article>)}</div>
      </section>}
      <p className="mt-7 rounded-md bg-amber-50 p-4 text-xs text-amber-900">Fabhouse has not collected stay payments. These requests cannot charge a guest, issue a refund, or trigger a host payout. Hosts and guests should agree final terms directly until the paid booking service launches.</p>
    </div>
  );
}
