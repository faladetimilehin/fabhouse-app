"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Something went wrong.");
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-bold text-navy mb-2">Check your email</h1>
        <p className="text-navy/60">
          If an account exists for <strong>{email}</strong>, we've sent a link to reset your password. It expires in 1 hour.
        </p>
        <Link href="/login" className="text-gold-dark font-semibold hover:underline mt-6 inline-block">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <h1 className="text-2xl font-bold text-navy mb-1">Reset your password</h1>
      <p className="text-navy/60 mb-6">Enter your email and we'll send you a reset link.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-navy">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border border-navy/15 rounded-md px-3 py-2 outline-none focus:border-gold"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-navy text-white font-semibold py-2.5 rounded-md hover:bg-navy-light transition disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <p className="text-sm text-navy/60 mt-6 text-center">
        <Link href="/login" className="text-gold-dark font-semibold hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
