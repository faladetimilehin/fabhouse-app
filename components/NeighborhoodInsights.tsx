"use client";

import { useEffect, useState } from "react";
import {
  MapPin,
  Loader,
  AlertCircle,
  School,
  Hospital,
  Bus,
  ShoppingBag,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";

interface School {
  name: string;
  type: "primary" | "secondary" | "tertiary";
  rating: number;
  distance: number;
}

interface Healthcare {
  name: string;
  type: "hospital" | "clinic" | "pharmacy";
  rating: number;
  distance: number;
}

interface Transport {
  type: "bus" | "train" | "metro" | "taxi";
  name?: string;
  distance: number;
}

interface Amenity {
  name: string;
  type: string;
  distance: number;
}

interface NeighborhoodData {
  address: string;
  state: string;
  lga: string;
  safetyScore: number;
  walkabilityScore: number;
  developmentScore: number;
  schools: School[];
  healthcare: Healthcare[];
  transport: Transport[];
  amenities: Amenity[];
  populationDensity?: string;
  averageIncome?: string;
  propertyTypes?: string[];
  lastUpdated: string;
}

interface NeighborhoodInsightsProps {
  propertyId?: string;
  lat?: number;
  lng?: number;
  state?: string;
  lga?: string;
}

export default function NeighborhoodInsights({
  propertyId,
  lat,
  lng,
  state,
  lga,
}: NeighborhoodInsightsProps) {
  const [data, setData] = useState<NeighborhoodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNeighborhoodData();
  }, [propertyId, lat, lng, state, lga]);

  const fetchNeighborhoodData = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (propertyId) {
        params.append("propertyId", propertyId);
      } else if (lat && lng) {
        params.append("lat", lat.toString());
        params.append("lng", lng.toString());
      } else if (state && lga) {
        params.append("state", state);
        params.append("lga", lga);
      } else {
        setError("Missing location parameters");
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/neighborhood?${params}`);

      if (res.status === 404) {
        setError("No neighborhood data available for this location yet");
        setLoading(false);
        return;
      }

      if (!res.ok) throw new Error();

      const data = await res.json();
      setData(data.neighborhood);
    } catch (err) {
      setError("Failed to load neighborhood data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const ScoreCard = ({ icon: Icon, label, score }: { icon: any; label: string; score: number }) => {
    const getColor = (score: number) => {
      if (score >= 4.5) return "text-green-600";
      if (score >= 3.5) return "text-blue-600";
      if (score >= 2.5) return "text-yellow-600";
      return "text-red-600";
    };

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
        <Icon className={`mx-auto mb-2 ${getColor(score)}`} size={32} />
        <p className="text-sm text-gray-600 mb-1">{label}</p>
        <p className={`text-3xl font-bold ${getColor(score)}`}>
          {score.toFixed(1)}
        </p>
        <p className="text-xs text-gray-500">/ 5.0</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 flex items-start gap-4">
        <AlertCircle className="text-yellow-600 flex-shrink-0 mt-1" size={24} />
        <div>
          <h3 className="font-semibold text-yellow-900">{error}</h3>
          <p className="text-yellow-800 text-sm mt-1">
            Check back soon or contact support for data in your area.
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200 p-6">
        <div className="flex items-start gap-4">
          <MapPin className="text-emerald-600 flex-shrink-0 mt-1" size={28} />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {data.lga}, {data.state}
            </h2>
            <p className="text-gray-600 mb-3">{data.address}</p>
            <div className="flex flex-wrap gap-3">
              {data.populationDensity && (
                <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-700 border border-gray-200">
                  📊 {data.populationDensity} density
                </span>
              )}
              {data.averageIncome && (
                <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-700 border border-gray-200">
                  💰 {data.averageIncome}
                </span>
              )}
              <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-600 border border-gray-200">
                🕐 Last updated: {new Date(data.lastUpdated).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ScoreCard icon={Shield} label="Safety Score" score={data.safetyScore} />
        <ScoreCard icon={Users} label="Walkability" score={data.walkabilityScore} />
        <ScoreCard icon={TrendingUp} label="Development" score={data.developmentScore} />
      </div>

      {/* Property Types */}
      {data.propertyTypes && data.propertyTypes.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Common Property Types</h3>
          <div className="flex flex-wrap gap-2">
            {data.propertyTypes.map((type) => (
              <span
                key={type}
                className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium"
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Schools */}
      {data.schools && data.schools.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <School className="text-blue-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">Schools Nearby</h3>
          </div>
          <div className="space-y-3">
            {data.schools.map((school, idx) => (
              <div key={idx} className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900">{school.name}</p>
                  <p className="text-sm text-gray-600 capitalize">{school.type}</p>
                </div>
                <div className="text-right">
                  <div className="flex gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < school.rating ? "text-yellow-400" : "text-gray-300"}>
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">{formatDistance(school.distance)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Healthcare */}
      {data.healthcare && data.healthcare.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Hospital className="text-red-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">Healthcare Facilities</h3>
          </div>
          <div className="space-y-3">
            {data.healthcare.map((health, idx) => (
              <div key={idx} className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900">{health.name}</p>
                  <p className="text-sm text-gray-600 capitalize">{health.type}</p>
                </div>
                <div className="text-right">
                  <div className="flex gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < health.rating ? "text-yellow-400" : "text-gray-300"}>
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">{formatDistance(health.distance)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transport */}
      {data.transport && data.transport.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bus className="text-purple-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">Public Transport</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.transport.map((transport, idx) => (
              <div key={idx} className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
                <div>
                  {transport.name && (
                    <p className="font-medium text-gray-900">{transport.name}</p>
                  )}
                  <p className="text-sm text-gray-600 capitalize">{transport.type}</p>
                </div>
                <p className="text-sm font-medium text-gray-700">
                  {formatDistance(transport.distance)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Amenities */}
      {data.amenities && data.amenities.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingBag className="text-green-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">Nearby Amenities</h3>
          </div>
          <div className="space-y-2">
            {data.amenities.slice(0, 10).map((amenity, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <p className="text-gray-900">
                  <span className="font-medium">{amenity.name}</span>{" "}
                  <span className="text-gray-600">({amenity.type})</span>
                </p>
                <p className="text-sm text-gray-600">{formatDistance(amenity.distance)}</p>
              </div>
            ))}
            {data.amenities.length > 10 && (
              <p className="text-sm text-gray-600 pt-2">
                + {data.amenities.length - 10} more amenities
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
