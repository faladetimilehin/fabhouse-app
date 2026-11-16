"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

const dateString = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const dayAfter = (value: string) => {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return dateString(date);
};

export default function StayRequestForm({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const today = dateString(new Date());
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guestCount, setGuestCount] = useState("1");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [availability, setAvailability] = useState<"idle" | "checking" | "available" | "unavailable" | "error">("idle");

  useEffect(() => {
    if (!checkIn || !checkOut || checkOut <= checkIn) { setAvailability("idle"); return; }
    const controller = new AbortController();
    setAvailability("checking");
    fetch(`/api/properties/${propertyId}/availability?from=${checkIn}&to=${checkOut}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Availability couldn't be checked.");
        setAvailability(data.unavailable?.length ? "unavailable" : "available");
      })
      .catch((error) => { if (error.name !== "AbortError") setAvailability("error"); });
    return () => controller.abort();
  }, [checkIn, checkOut, propertyId]);

  async function requestStay() {
    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setSending(true);
    try {
      const response = await fetch("/api/stays/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, checkIn, checkOut, guestCount: Number(guestCount), message }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(data.error ?? "Couldn't send the stay request.");
        return;
      }
      toast.success("Request sent. The host has not confirmed a booking or taken payment.");
      setMessage("");
      router.push("/dashboard/stays");
    } catch {
      toast.error("Couldn't reach Fabhouse. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="mt-4 rounded-lg border border-navy/10 bg-navy/[0.025] p-4" aria-labelledby="stay-request-title">
      <h3 id="stay-request-title" className="font-semibold text-navy">Request these dates</h3>
      <p className="mt-1 text-xs text-navy/55">This is a request, not a booking. The host must accept, and Fabhouse checkout is not available yet.</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="text-xs text-navy/65">Check in
          <input type="date" min={today} value={checkIn} onChange={(event) => { setCheckIn(event.target.value); if (checkOut && checkOut <= event.target.value) setCheckOut(""); }} className="mt-1 w-full rounded border border-navy/15 px-2 py-2 text-sm" />
        </label>
        <label className="text-xs text-navy/65">Check out
          <input type="date" min={checkIn ? dayAfter(checkIn) : today} value={checkOut} onChange={(event) => setCheckOut(event.target.value)} className="mt-1 w-full rounded border border-navy/15 px-2 py-2 text-sm" />
        </label>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="text-xs text-navy/65">Guests
          <input type="number" min={1} max={20} value={guestCount} onChange={(event) => setGuestCount(event.target.value)} className="mt-1 w-full rounded border border-navy/15 px-2 py-2 text-sm" />
        </label>
        <label className="text-xs text-navy/65">Message to host
          <input maxLength={1000} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Optional" className="mt-1 w-full rounded border border-navy/15 px-2 py-2 text-sm" />
        </label>
      </div>
      {availability === "checking" && <p role="status" className="mt-2 text-xs text-navy/55">Checking selected nights...</p>}
      {availability === "available" && <p role="status" className="mt-2 text-xs text-green-700">No blocked dates found. The host still needs to accept your request.</p>}
      {availability === "unavailable" && <p role="status" className="mt-2 text-xs text-red-700">At least one night is unavailable. Please choose other dates.</p>}
      {availability === "error" && <p role="status" className="mt-2 text-xs text-amber-700">Could not check availability. The host will need to confirm the dates.</p>}
      <button onClick={requestStay} disabled={sending || !checkIn || !checkOut || !guestCount || availability === "checking" || availability === "unavailable"} className="mt-3 w-full rounded bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-50">
        {sending ? "Sending request..." : session?.user ? "Request stay" : "Sign in to request"}
      </button>
    </section>
  );
}
