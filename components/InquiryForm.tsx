"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Send } from "lucide-react";

export default function InquiryForm({ propertyId, isShortlet = false }: { propertyId: string; isShortlet?: boolean }) {
  const [form, setForm] = useState({ buyerName: "", buyerContact: "", message: "", checkIn: "", checkOut: "", guestCount: "1" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, ...form }),
    });

    setLoading(false);

    if (!res.ok) {
      toast.error("Couldn't send your message. Please try again.");
      return;
    }

    setSent(true);
    toast.success("Message sent to the agent!");
  }

  if (sent) {
    return (
      <div className="mt-4 text-center text-sm text-green-700 bg-green-50 border border-green-200 rounded-md py-3 px-4">
        Message sent — the agent will reach out to your contact details directly.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-2 border-t border-navy/10 pt-4">
      <p className="text-sm font-semibold text-navy">{isShortlet ? "Ask about a stay" : "Message this agent"}</p>
      {isShortlet && (
        <>
          <p className="text-xs text-navy/50">This sends a date enquiry to the host. Your stay is not booked or paid through Fabhouse.</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs font-medium text-navy/70">Check-in
              <input type="date" required min={new Date().toISOString().slice(0, 10)} value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} className="mt-1 w-full border border-navy/15 rounded-md px-2 py-2 text-sm outline-none focus:border-gold" />
            </label>
            <label className="text-xs font-medium text-navy/70">Check-out
              <input type="date" required min={form.checkIn ? new Date(Date.parse(`${form.checkIn}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)} value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} className="mt-1 w-full border border-navy/15 rounded-md px-2 py-2 text-sm outline-none focus:border-gold" />
            </label>
          </div>
          <label className="block text-xs font-medium text-navy/70">Guests
            <input type="number" required min={1} max={20} value={form.guestCount} onChange={(e) => setForm({ ...form, guestCount: e.target.value })} className="mt-1 w-full border border-navy/15 rounded-md px-3 py-2 text-sm outline-none focus:border-gold" />
          </label>
        </>
      )}
      <input
        required
        placeholder="Your name"
        value={form.buyerName}
        onChange={(e) => setForm({ ...form, buyerName: e.target.value })}
        className="w-full border border-navy/15 rounded-md px-3 py-2 text-sm outline-none focus:border-gold"
      />
      <input
        required
        placeholder="Your email or phone"
        value={form.buyerContact}
        onChange={(e) => setForm({ ...form, buyerContact: e.target.value })}
        className="w-full border border-navy/15 rounded-md px-3 py-2 text-sm outline-none focus:border-gold"
      />
      <textarea
        required
        rows={3}
        placeholder={isShortlet ? "Tell the host a little about your stay..." : "I'm interested in this property..."}
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        className="w-full border border-navy/15 rounded-md px-3 py-2 text-sm outline-none focus:border-gold"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-gold text-navy font-semibold py-2.5 rounded-md hover:bg-gold-light transition disabled:opacity-50"
      >
        <Send className="w-4 h-4" /> {loading ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}
