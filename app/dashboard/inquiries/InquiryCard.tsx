"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Send, Mail, Phone } from "lucide-react";

export interface InquiryData {
  _id: string;
  property: string;
  propertyTitle: string;
  buyerName: string;
  buyerContact: string;
  message: string;
  reply?: string;
  repliedAt?: string;
  createdAt: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function InquiryCard({ inquiry }: { inquiry: InquiryData }) {
  const [replyText, setReplyText] = useState(inquiry.reply ?? "");
  const [saved, setSaved] = useState<{ reply: string; repliedAt: string } | null>(
    inquiry.reply && inquiry.repliedAt ? { reply: inquiry.reply, repliedAt: inquiry.repliedAt } : null
  );
  const [sending, setSending] = useState(false);
  const isEmail = EMAIL_RE.test(inquiry.buyerContact);

  async function sendReply() {
    if (!replyText.trim()) return;
    setSending(true);

    const res = await fetch(`/api/inquiries/${inquiry._id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply: replyText }),
    });

    const data = await res.json();
    setSending(false);

    if (!res.ok) {
      toast.error(data.error ?? "Couldn't send reply.");
      return;
    }

    setSaved({ reply: replyText, repliedAt: new Date().toISOString() });
    toast.success(data.emailed ? "Reply sent to buyer's email." : "Reply saved (buyer left a phone number, not emailed).");
  }

  return (
    <div className="bg-white border border-navy/10 rounded-lg p-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs text-navy/50">On listing</p>
          <p className="font-semibold text-navy">{inquiry.propertyTitle}</p>
        </div>
        <p className="text-xs text-navy/40">{new Date(inquiry.createdAt).toLocaleString()}</p>
      </div>

      <div className="mt-3 flex items-center gap-2 text-sm text-navy/70">
        <span className="font-medium text-navy">{inquiry.buyerName}</span>
        <span className="flex items-center gap-1 text-navy/50">
          {isEmail ? <Mail className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
          {inquiry.buyerContact}
        </span>
      </div>

      <p className="mt-2 text-navy/80 text-sm bg-navy/5 rounded-md p-3">{inquiry.message}</p>

      {saved && (
        <div className="mt-3 text-sm bg-gold/10 border border-gold/40 rounded-md p-3">
          <p className="text-xs text-gold-dark font-semibold mb-1">
            Your reply {new Date(saved.repliedAt).toLocaleString()}
          </p>
          <p className="text-navy">{saved.reply}</p>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <input
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder={saved ? "Send a follow-up..." : "Type a reply..."}
          className="flex-1 border border-navy/15 rounded-md px-3 py-2 text-sm outline-none focus:border-gold"
        />
        <button
          onClick={sendReply}
          disabled={sending || !replyText.trim()}
          className="flex items-center gap-1 bg-navy text-white text-sm font-semibold px-4 py-2 rounded-md hover:bg-navy-light transition disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" /> {sending ? "Sending..." : "Reply"}
        </button>
      </div>
      {!isEmail && (
        <p className="text-xs text-navy/40 mt-1">
          This buyer left a phone number, not an email — your reply is saved here but won't be emailed. Consider calling them directly.
        </p>
      )}
    </div>
  );
}
