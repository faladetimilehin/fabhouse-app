"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell } from "lucide-react";
import toast from "react-hot-toast";

export default function SaveSearchButton() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    const q = searchParams.get("q") || undefined;
    const type = searchParams.get("type") || undefined;
    const purpose = searchParams.get("purpose") || undefined;
    const state = searchParams.get("state") || undefined;
    const city = searchParams.get("city") || undefined;
    const country = searchParams.get("country") || undefined;
    const minPriceRaw = searchParams.get("minPrice");
    const maxPriceRaw = searchParams.get("maxPrice");
    const minPrice = minPriceRaw ? Number(minPriceRaw) : undefined;
    const maxPrice = maxPriceRaw ? Number(maxPriceRaw) : undefined;
    const priceCurrency = searchParams.get("priceCurrency") || undefined;

    if (!q && !type && !purpose && !state && !minPrice && !maxPrice) {
      toast.error("Set at least one filter or search term before saving.");
      return;
    }

    const priceLabel = (minPrice || maxPrice)
      ? `${minPrice ? minPrice.toLocaleString() : "0"}\u2013${maxPrice ? maxPrice.toLocaleString() : "any"} ${priceCurrency ?? "NGN"}`
      : undefined;
    const labelParts = [type, purpose && `for ${purpose}`, state, priceLabel, q && `"${q}"`].filter(Boolean);
    const label = labelParts.join(" ") || "My search";

    setSaving(true);
    const res = await fetch("/api/search-alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, criteria: { q, type, purpose, state, city, country, minPrice, maxPrice, priceCurrency } }),
    });
    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Couldn't save this search.");
      return;
    }

    toast.success("We'll email you when a new listing matches this search.");
  }

  return (
    <button
      onClick={handleSave}
      disabled={saving}
      className="flex items-center gap-1.5 bg-white border border-navy/15 text-navy/70 hover:text-navy px-3 py-2 rounded-md text-sm font-semibold transition disabled:opacity-50"
    >
      <Bell className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Alert me"}
    </button>
  );
}
