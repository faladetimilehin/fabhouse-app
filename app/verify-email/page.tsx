"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function verifyEmail() {
      const token = searchParams.get("token");
      const email = searchParams.get("email");

      if (!token || !email) {
        setStatus("error");
        setMessage("Verification link is invalid or missing.");
        return;
      }

      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, email }),
        });

        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage(data.message);
          toast.success("Email verified!");
          setTimeout(() => router.push("/login"), 3000);
        } else {
          setStatus("error");
          setMessage(data.error);
          toast.error(data.error);
        }
      } catch (err) {
        console.error("Verification error:", err);
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
        toast.error("Verification failed");
      }
    }

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-gold mb-4" />
            <h1 className="text-2xl font-bold text-navy mb-2">Verifying your email...</h1>
            <p className="text-navy/60">Please wait while we confirm your email address.</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-navy mb-2">Email verified!</h1>
            <p className="text-navy/60 mb-6">{message}</p>
            <p className="text-sm text-navy/60">
              Redirecting to login in 3 seconds...
            </p>
            <Link
              href="/login"
              className="mt-4 inline-block bg-navy text-white font-semibold py-2.5 px-6 rounded-md hover:bg-navy-light transition"
            >
              Go to login
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-navy mb-2">Verification failed</h1>
            <p className="text-navy/60 mb-6">{message}</p>
            <div className="space-y-2">
              <Link
                href="/register"
                className="block w-full bg-navy text-white font-semibold py-2.5 rounded-md hover:bg-navy-light transition"
              >
                Create new account
              </Link>
              <Link
                href="/login"
                className="block w-full bg-navy/10 text-navy font-semibold py-2.5 rounded-md hover:bg-navy/20 transition"
              >
                Back to login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
