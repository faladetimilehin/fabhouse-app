"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Heart } from "lucide-react";
import PropertyCard from "@/components/PropertyCard";

export default function SavedListingsPage() {
  const [listings, setListings] = useState<any[] | null>(null);

  useEffect(() => {
    fetch("/api/account/saved-listings")
      .then((res) => res.json())
      .then((data) => setListings(data.listings ?? []));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-navy mb-1 flex items-center gap-2">
        <Heart className="w-6 h-6 text-red-500 fill-red-500" /> Saved listings
      </h1>
      <p className="text-navy/60 mb-8">
        Properties you've bookmarked for later. Looking for something specific?{" "}
        <Link href="/saved-searches" className="text-gold-dark hover:underline">Manage saved search alerts</Link>.
      </p>

      {listings === null ? (
        <div className="text-center py-20"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gold" /></div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-navy/10 text-navy/60">
          You haven't saved any listings yet. Tap the heart icon on a listing to save it here.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((l: any) => (
            <PropertyCard key={l._id} property={{ ...l, _id: l._id }} isSaved />
          ))}
        </div>
      )}
    </div>
  );
}
