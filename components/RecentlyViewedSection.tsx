"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRecentlyViewedDisplay, clearRecentlyViewed, RecentlyViewed } from "@/lib/recentlyViewed";
import { Clock, Trash2 } from "lucide-react";

export default function RecentlyViewedSection() {
  const [viewed, setViewed] = useState<RecentlyViewed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get recently viewed from localStorage
    const recentlyViewed = getRecentlyViewedDisplay(6);
    setViewed(recentlyViewed);
    setLoading(false);
  }, []);

  if (loading || viewed.length === 0) {
    return null;
  }

  const handleClear = () => {
    if (confirm("Clear all recently viewed listings?")) {
      clearRecentlyViewed();
      setViewed([]);
    }
  };

  const formatDate = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <section className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gold" />
          <h2 className="text-2xl font-bold text-navy">Recently Viewed</h2>
        </div>
        <button
          onClick={handleClear}
          className="flex items-center gap-2 text-sm text-navy/60 hover:text-red-500 transition"
        >
          <Trash2 className="w-4 h-4" />
          Clear
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {viewed.map((item) => (
          <Link
            key={item.propertyId}
            href={`/listings/${item.propertyId}`}
            className="block bg-white border border-navy/10 rounded-lg overflow-hidden hover:shadow-lg transition"
          >
            <div className="bg-navy/5 p-4 min-h-32 flex flex-col justify-between">
              <p className="text-navy font-semibold line-clamp-2">{item.title}</p>
              <p className="text-xs text-navy/60 mt-2">
                Viewed {formatDate(item.viewedAt)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
