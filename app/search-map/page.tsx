import { Metadata } from "next";
import { Suspense } from "react";
import MapSearchPage from "@/components/MapSearchPage";

export const metadata: Metadata = {
  title: "Map Search | FabHouse",
  description: "Search properties on an interactive map",
};

export default function SearchMapPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading map search…</div>}>
      <MapSearchPage />
    </Suspense>
  );
}
