"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import { formatPrice } from "@/lib/formatting";
import "leaflet/dist/leaflet.css";

// Leaflet's default marker icons reference image files that don't resolve
// correctly under Next.js's bundler — rebuild the icon URLs manually.
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapListing {
  _id: string;
  title: string;
  price: number;
  currency: string;
  priceQualifier?: string;
  location: { lat?: number; lng?: number; city: string; state: string };
  images: string[];
}

function FitBounds({ listings }: { listings: MapListing[] }) {
  const map = useMap();

  useEffect(() => {
    const points = listings
      .filter((l) => l.location.lat && l.location.lng)
      .map((l) => [l.location.lat!, l.location.lng!] as [number, number]);

    if (points.length > 0) {
      map.fitBounds(points, { padding: [40, 40], maxZoom: 14 });
    }
  }, [listings, map]);

  return null;
}

export default function ListingsMap({ listings }: { listings: MapListing[] }) {
  const withCoords = listings.filter((l) => l.location.lat && l.location.lng);

  // Default center: roughly Lagos, in case no listings have coordinates yet.
  const defaultCenter: [number, number] = [6.5244, 3.3792];

  return (
    <div className="rounded-lg overflow-hidden border border-navy/10 h-[500px]">
      <MapContainer center={defaultCenter} zoom={11} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds listings={withCoords} />
        {withCoords.map((listing) => (
          <Marker key={listing._id} position={[listing.location.lat!, listing.location.lng!]} icon={markerIcon}>
            <Popup>
              <Link href={`/listings/${listing._id}`} className="block w-40">
                {listing.images?.[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={listing.images[0]} alt="" className="w-full h-20 object-cover rounded mb-1" />
                )}
                <p className="font-semibold text-navy text-sm leading-tight">{listing.title}</p>
                <p className="text-gold-dark font-bold text-sm">
                  {formatPrice(listing.price, listing.currency, listing.priceQualifier)}
                </p>
              </Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {withCoords.length === 0 && listings.length > 0 && (
        <p className="text-center text-sm text-navy/50 py-4">
          None of the listings on this page have map coordinates yet.
        </p>
      )}
    </div>
  );
}
