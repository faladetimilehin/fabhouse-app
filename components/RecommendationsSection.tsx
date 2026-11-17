"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowRight, Sparkles } from "lucide-react";
import PropertyCard from "@/components/PropertyCard";

interface RecommendedListing {
  _id: string;
  title: string;
  price: number;
  pricePeriod?: string;
  currency: string;
  priceQualifier?: string;
  priceReducedAt?: string;
  type: string;
  purpose: string;
  location: { city: string; state: string; countryCode?: string };
  bedrooms?: number;
  bathrooms?: number;
  images: string[];
  videos?: string[];
  isFeatured?: boolean;
  owner?: { name: string; isVerified?: boolean } | null;
}

export default function RecommendationsSection() {
  const { status } = useSession();
  const [recommendations, setRecommendations] = useState<RecommendedListing[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    let active = true;

    fetch("/api/recommendations")
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load recommendations.");
        return response.json();
      })
      .then((data) => {
        if (active) setRecommendations(data.recommendations ?? []);
      })
      .catch(() => {
        if (active) setHasError(true);
      });

    return () => {
      active = false;
    };
  }, [status]);

  if (status === "loading") return null;

  return (
    <section className="bg-[#fffdf8] px-5 py-14 dark:bg-[#101a2b] sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#9a5b3d] dark:text-[#e7ae83]">
              <Sparkles size={15} aria-hidden="true" /> Just for you
            </p>
            <h2 className="mt-3 font-serif text-3xl tracking-[-0.03em] text-[#20342f] dark:text-[#e6edf7] sm:text-4xl">
              Places that match what you save.
            </h2>
            <p className="mt-2 text-sm text-[#58635b] dark:text-[#b6c3d6]">
              Recommendations use your saved listings to match market, area, property type, and price range.
            </p>
          </div>
          <Link href="/listings" className="inline-flex items-center gap-2 text-sm font-semibold text-[#9a5b3d] dark:text-[#e7ae83]">
            Browse all listings <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        {status === "unauthenticated" ? (
          <p className="rounded-xl border border-[#e6e0d5] p-5 text-sm text-[#58635b] dark:border-[#26354b] dark:text-[#b6c3d6]">
            <Link href="/login" className="font-semibold text-[#9a5b3d] underline dark:text-[#e7ae83]">Sign in</Link>
            {" "}and save listings to get recommendations tailored to your interests.
          </p>
        ) : hasError ? (
          <p role="status" className="rounded-xl border border-[#e6e0d5] p-5 text-sm text-[#58635b] dark:border-[#26354b] dark:text-[#b6c3d6]">
            Recommendations couldn’t load just now. Please try again later.
          </p>
        ) : recommendations === null ? (
          <p role="status" className="rounded-xl border border-[#e6e0d5] p-5 text-sm text-[#58635b] dark:border-[#26354b] dark:text-[#b6c3d6]">
            Finding listings similar to your saved places…
          </p>
        ) : recommendations.length === 0 ? (
          <p className="rounded-xl border border-[#e6e0d5] p-5 text-sm text-[#58635b] dark:border-[#26354b] dark:text-[#b6c3d6]">
            Save a few active listings and we’ll suggest similar places in the same market.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((listing) => (
              <PropertyCard
                key={listing._id}
                property={{ ...listing, owner: listing.owner ?? undefined }}
                isSaved={false}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
