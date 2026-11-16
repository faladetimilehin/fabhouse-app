"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { LayoutGrid, Map as MapIcon } from "lucide-react";
import PropertyCard from "@/components/PropertyCard";

// Leaflet touches `window` at import time, so it can only run in the
// browser — dynamic import with ssr:false keeps it out of the server bundle.
const ListingsMap = dynamic(() => import("@/components/ListingsMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] rounded-lg border border-navy/10 bg-navy/5 flex items-center justify-center text-navy/40 text-sm">
      Loading map...
    </div>
  ),
});

interface ListingsViewToggleProps {
  properties: any[];
}

export default function ListingsViewToggle({ properties }: ListingsViewToggleProps) {
  const [view, setView] = useState<"grid" | "map">("grid");

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setView("grid")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition ${
            view === "grid" ? "bg-navy text-white" : "bg-white border border-navy/15 text-navy/60 hover:text-navy"
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" /> Grid
        </button>
        <button
          onClick={() => setView("map")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition ${
            view === "map" ? "bg-navy text-white" : "bg-white border border-navy/15 text-navy/60 hover:text-navy"
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" /> Map
        </button>
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((p) => (
            <PropertyCard key={p._id} property={p} />
          ))}
        </div>
      ) : (
        <ListingsMap listings={properties} />
      )}
    </div>
  );
}
