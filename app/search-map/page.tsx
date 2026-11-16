import { Metadata } from "next";
import MapSearchPage from "@/components/MapSearchPage";

export const metadata: Metadata = {
  title: "Map Search | FabHouse",
  description: "Search properties on an interactive map",
};

export default function SearchMapPage() {
  return <MapSearchPage />;
}
