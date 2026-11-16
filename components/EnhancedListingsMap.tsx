"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.heat/dist/leaflet-heat.js";
import MarkerClusterGroup from "react-leaflet-cluster";
import { MapPin, Loader } from "lucide-react";

interface Property {
  _id: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  coordinates: [number, number]; // [lat, lng]
  type: string;
  purpose: string;
  image?: string;
}

interface EnhancedMapProps {
  properties: Property[];
  loading?: boolean;
  onPropertySelect?: (property: Property) => void;
  showHeatmap?: boolean;
  showClustering?: boolean;
  center?: [number, number];
  zoom?: number;
}

export default function EnhancedListingsMap({
  properties,
  loading = false,
  onPropertySelect,
  showHeatmap = true,
  showClustering = true,
  center = [6.5244, 3.3792], // Lagos default
  zoom = 12,
}: EnhancedMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const heatmapRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || !showHeatmap || properties.length === 0) return;

    // Remove existing heatmap
    if (heatmapRef.current) {
      mapRef.current.removeLayer(heatmapRef.current);
    }

    // Create heatmap data
    const heatmapData = properties
      .filter((p) => p.coordinates && p.coordinates.length === 2)
      .map((p) => [p.coordinates[0], p.coordinates[1], 0.8]);

    if (heatmapData.length > 0) {
      heatmapRef.current = (L as any).heatLayer(heatmapData, {
        radius: 25,
        blur: 15,
        max: 1.0,
        gradient: {
          0.0: "#3b82f6",
          0.25: "#10b981",
          0.5: "#f59e0b",
          0.75: "#ef4444",
          1.0: "#7c3aed",
        },
      }).addTo(mapRef.current);
    }
  }, [properties, showHeatmap]);

  const customIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  if (loading) {
    return (
      <div className="w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
        <div className="text-center">
          <Loader className="animate-spin text-blue-600 mx-auto mb-3" size={40} />
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
        <div className="text-center">
          <MapPin className="text-gray-400 mx-auto mb-3" size={48} />
          <p className="text-gray-600 font-medium">No properties to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] rounded-lg border border-gray-200 overflow-hidden shadow-md">
      <MapContainer
        ref={mapRef}
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {showClustering ? (
          <MarkerClusterGroup chunkedLoading>
            {properties.map((property) => (
              <Marker
                key={property._id}
                position={property.coordinates}
                icon={customIcon}
                eventHandlers={{
                  click: () => onPropertySelect?.(property),
                }}
              >
                <Popup maxWidth={300}>
                  <div className="space-y-2">
                    <div>
                      {property.image && (
                        <img
                          src={property.image}
                          alt={property.address}
                          className="w-full h-40 object-cover rounded mb-2"
                        />
                      )}
                      <h3 className="font-semibold text-gray-900">
                        {property.address}
                      </h3>
                      <p className="text-lg font-bold text-blue-600">
                        ₦{property.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>🛏️ {property.bedrooms} beds</div>
                      <div>🚿 {property.bathrooms} baths</div>
                      <div>🏠 {property.type}</div>
                      <div className="capitalize">{property.purpose}</div>
                    </div>
                    <button
                      onClick={() => onPropertySelect?.(property)}
                      className="w-full py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                    >
                      View Details
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        ) : (
          properties.map((property) => (
            <Marker
              key={property._id}
              position={property.coordinates}
              icon={customIcon}
              eventHandlers={{
                click: () => onPropertySelect?.(property),
              }}
            >
              <Popup maxWidth={300}>
                <div className="space-y-2">
                  <div>
                    {property.image && (
                      <img
                        src={property.image}
                        alt={property.address}
                        className="w-full h-40 object-cover rounded mb-2"
                      />
                    )}
                    <h3 className="font-semibold text-gray-900">
                      {property.address}
                    </h3>
                    <p className="text-lg font-bold text-blue-600">
                      ₦{property.price.toLocaleString()}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>🛏️ {property.bedrooms} beds</div>
                    <div>🚿 {property.bathrooms} baths</div>
                    <div>🏠 {property.type}</div>
                    <div className="capitalize">{property.purpose}</div>
                  </div>
                  <button
                    onClick={() => onPropertySelect?.(property)}
                    className="w-full py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                  >
                    View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          ))
        )}
      </MapContainer>
    </div>
  );
}
