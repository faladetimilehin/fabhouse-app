"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { MARKETS } from "@/config/markets";
import AuthShell from "@/components/AuthShell";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "buyer", phone: "", countryCode: "NG" });
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const checkPasswordStrength = (pwd: string) => {
    const errors: string[] = [];
    if (pwd.length < 8) errors.push("At least 8 characters");
    if (!/[A-Z]/.test(pwd)) errors.push("One uppercase letter");
    if (!/[a-z]/.test(pwd)) errors.push("One lowercase letter");
    if (!/[0-9]/.test(pwd)) errors.push("One number");
    setPasswordErrors(errors);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (passwordErrors.length > 0) {
      toast.error("Password does not meet requirements.");
      return;
    }

    if (!consent) {
      toast.error("Please agree to the Privacy Policy and Terms of Service to continue.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, role: "buyer", consent: true }), // Always send buyer
    });

    if (!res.ok) {
      const data = await res.json();
      const errorMsg = typeof data.error === 'object' 
        ? data.error?.formErrors?.[0] ?? "Registration failed"
        : data.error ?? "Registration failed";
      toast.error(errorMsg);
      setLoading(false);
      return;
    }

    toast.success("Account created! Please check your email to verify your address.");
    router.push("/login");
  }

  async function handleGoogle() {
    setLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  return (
    <AuthShell variant="register">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-dark">Make yourself at home</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-navy">Create your account</h1>
        <p className="text-navy/60 mt-2 mb-7">Free to join — listing is free during launch.</p>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 border border-navy/20 rounded-md py-2.5 font-semibold text-navy hover:bg-navy/5 transition mb-4 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84z"/>
          </svg>
          Sign up with Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-navy/10" />
          <span className="text-xs text-navy/40">or register with email</span>
          <div className="flex-1 h-px bg-navy/10" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="register-name" className="text-sm font-medium text-navy">Full name</label>
            <input
              id="register-name"
              required
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full border border-navy/15 rounded-md px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <div>
            <label htmlFor="register-email" className="text-sm font-medium text-navy">Email</label>
            <input
              id="register-email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full border border-navy/15 rounded-md px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <div>
            <label htmlFor="register-phone" className="text-sm font-medium text-navy">Phone (optional)</label>
            <input
              id="register-phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1 w-full border border-navy/15 rounded-md px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <div>
            <label htmlFor="register-country" className="text-sm font-medium text-navy">Your country</label>
            <select
              id="register-country"
              value={form.countryCode}
              onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
              className="mt-1 w-full border border-navy/15 rounded-md px-3 py-2 outline-none focus:border-gold"
            >
              {MARKETS.map((market) => <option key={market.code} value={market.code}>{market.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="register-password" className="text-sm font-medium text-navy">Password</label>
            <input
              id="register-password"
              type="password"
              required
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => {
                setForm({ ...form, password: e.target.value });
                checkPasswordStrength(e.target.value);
              }}
              className="mt-1 w-full border border-navy/15 rounded-md px-3 py-2 outline-none focus:border-gold"
            />
            {form.password && (
              <div className="mt-2 p-3 bg-navy/5 rounded-md text-sm">
                <p className="font-semibold text-navy mb-2">Password must have:</p>
                <ul className="space-y-1">
                  <li className={`flex items-center gap-2 ${!passwordErrors.includes("At least 8 characters") ? "text-green-600" : "text-navy/60"}`}>
                    <span>{!passwordErrors.includes("At least 8 characters") ? "✓" : "○"}</span> 8+ characters
                  </li>
                  <li className={`flex items-center gap-2 ${!passwordErrors.includes("One uppercase letter") ? "text-green-600" : "text-navy/60"}`}>
                    <span>{!passwordErrors.includes("One uppercase letter") ? "✓" : "○"}</span> Uppercase letter
                  </li>
                  <li className={`flex items-center gap-2 ${!passwordErrors.includes("One lowercase letter") ? "text-green-600" : "text-navy/60"}`}>
                    <span>{!passwordErrors.includes("One lowercase letter") ? "✓" : "○"}</span> Lowercase letter
                  </li>
                  <li className={`flex items-center gap-2 ${!passwordErrors.includes("One number") ? "text-green-600" : "text-navy/60"}`}>
                    <span>{!passwordErrors.includes("One number") ? "✓" : "○"}</span> Number
                  </li>
                </ul>
              </div>
            )}
          </div>

          <label className="flex items-start gap-2 text-sm text-navy/70">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1"
            />
            <span>
              I agree to Fabhouse's{" "}
              <Link href="/privacy" target="_blank" className="text-gold-dark font-semibold hover:underline">
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link href="/terms" target="_blank" className="text-gold-dark font-semibold hover:underline">
                Terms of Service
              </Link>
              , including how my data is processed under applicable data protection laws.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy text-white font-semibold py-2.5 rounded-md hover:bg-navy-light transition disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-sm text-navy/60 mt-6 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-gold-dark font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
