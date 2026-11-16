"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import SearchFilters from "@/components/SearchFilters";
import { Loader, Map, List } from "lucide-react";
import toast from "react-hot-toast";

const EnhancedListingsMap = dynamic(
  () => import("@/components/EnhancedListingsMap"),
  { ssr: false, loading: () => <div className="h-[500px] animate-pulse rounded-lg bg-gray-100" /> }
);

interface Property {
  _id: string;
  title?: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  type: string;
  purpose: string;
  images?: string[];
  coordinates?: [number, number];
  image?: string;
}

export default function MapSearchPage() {
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showClustering, setShowClustering] = useState(true);

  useEffect(() => {
    searchProperties();
  }, [searchParams]);

  const searchProperties = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams);
      const res = await fetch(`/api/properties/search?${params}`);

      if (!res.ok) throw new Error();

      const data = await res.json();
      
      // Ensure coordinates exist
      const propsWithCoords = data.properties.map((p: any) => ({
        ...p,
        address:
          p.location?.address ||
          [p.location?.city, p.location?.state].filter(Boolean).join(", "),
        coordinates:
          Number.isFinite(p.location?.lat) && Number.isFinite(p.location?.lng)
            ? [p.location.lat, p.location.lng]
            : undefined,
        image: p.images?.[0],
      }));

      setProperties(propsWithCoords);
    } catch {
      toast.error("Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  const handlePropertySelect = (property: Pick<Property, "_id">) => {
    window.location.href = `/listings/${property._id}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Search Properties</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("map")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  viewMode === "map"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Map size={20} />
                Map
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <List size={20} />
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Filters */}
        <div className="mb-8">
          <SearchFilters />
        </div>

        {/* Map View */}
        {viewMode === "map" && (
          <div className="space-y-4">
            {/* Map Options */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showHeatmap}
                  onChange={(e) => setShowHeatmap(e.target.checked)}
                  className="rounded"
                />
                <span className="text-gray-700">Show Heatmap</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showClustering}
                  onChange={(e) => setShowClustering(e.target.checked)}
                  className="rounded"
                />
                <span className="text-gray-700">Enable Clustering</span>
              </label>
              <span className="ml-auto text-gray-600">
                {properties.length} properties found
              </span>
            </div>

            {/* Map */}
            <EnhancedListingsMap
              properties={properties}
              loading={loading}
              onPropertySelect={handlePropertySelect}
              showHeatmap={showHeatmap}
              showClustering={showClustering}
            />
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="space-y-4">
            <div className="text-gray-600 mb-4">
              {loading ? "Loading..." : `${properties.length} properties found`}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="animate-spin text-blue-600" size={40} />
              </div>
            ) : properties.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <p className="text-gray-600 font-medium">No properties found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property) => (
                  <div
                    key={property._id}
                    className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition cursor-pointer"
                    onClick={() => handlePropertySelect(property)}
                  >
                    {property.image && (
                      <div className="h-40 bg-gray-200 overflow-hidden">
                        <img
                          src={property.image}
                          alt={property.address}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1">
                      {property.title || property.address}
                      </h3>
                      <p className="text-2xl font-bold text-blue-600 mb-3">
                        ₦{property.price.toLocaleString()}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
                        <div>🛏️ {property.bedrooms} beds</div>
                        <div>🚿 {property.bathrooms} baths</div>
                        <div>🏠 {property.type}</div>
                        <div className="capitalize">{property.purpose}</div>
                      </div>
                      <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
