"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Send } from "lucide-react";

export default function InquiryForm({ propertyId }: { propertyId: string }) {
  const [form, setForm] = useState({ buyerName: "", buyerContact: "", message: "" });
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
      <p className="text-sm font-semibold text-navy">Message this agent</p>
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
        placeholder="I'm interested in this property..."
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
