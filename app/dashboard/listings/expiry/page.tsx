"use client";

import { useEffect, useState } from "react";
import { Calendar, AlertCircle, CheckCircle, Loader, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

interface ExpiryListing {
  _id: string;
  property: {
    _id: string;
    title: string;
    location?: { address?: string; city?: string; state?: string };
    price: number;
    currency?: string;
  };
  expiresAt: string;
  isActive: boolean;
  renewalCount: number;
  autoRenew: boolean;
}

export default function ListingExpiryPage() {
  const [listings, setListings] = useState<ExpiryListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "expiring" | "expired">("all");

  useEffect(() => {
    fetchListings();
  }, [statusFilter]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/account/listings/expiry${params}`);

      if (!res.ok) throw new Error();

      const data = await res.json();
      setListings(data.listings);
    } catch {
      toast.error("Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async (propertyId: string) => {
    try {
      const res = await fetch("/api/account/listings/expiry", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          renewalDays: 30,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success("Listing renewed for 30 days");
      fetchListings();
    } catch {
      toast.error("Failed to renew listing");
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const diff = new Date(expiryDate).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (days: number) => {
    if (days < 0) return "bg-red-50 border-red-200";
    if (days <= 7) return "bg-yellow-50 border-yellow-200";
    return "bg-green-50 border-green-200";
  };

  const getStatusIcon = (days: number) => {
    if (days < 0) return <AlertCircle className="text-red-600" size={20} />;
    if (days <= 7) return <AlertCircle className="text-yellow-600" size={20} />;
    return <CheckCircle className="text-green-600" size={20} />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Listing Expiry</h1>
        <p className="text-gray-600">Manage listing expiry dates and renewals</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-8">
        {["all", "expiring", "expired"].map((filter) => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter as any)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === filter
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
        <button
          onClick={() => fetchListings()}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Listings */}
      {listings.length === 0 ? (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-12 text-center">
          <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600 font-medium">No listings found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => {
            const days = getDaysUntilExpiry(listing.expiresAt);
            const isExpired = days < 0;

            return (
              <div
                key={listing._id}
                className={`rounded-lg border p-6 ${getStatusColor(days)}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(days)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {listing.property.title || listing.property.location?.address || listing.property.location?.city || "Your listing"}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {listing.property.currency || "NGN"} {listing.property.price.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <span className="text-gray-600">
                          {isExpired ? (
                            <span className="text-red-600 font-medium">
                              Expired {Math.abs(days)} days ago
                            </span>
                          ) : (
                            <span className="text-gray-600">
                              Expires in{" "}
                              <strong className="text-gray-900">{days} days</strong>
                            </span>
                          )}
                        </span>
                        <span className="text-gray-500">
                          {new Date(listing.expiresAt).toLocaleDateString()}
                        </span>
                        <span className="text-gray-500">
                          Renewed {listing.renewalCount} times
                        </span>
                      </div>
                      {listing.autoRenew && (
                        <div className="mt-2 inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                          ✓ Auto-renewal enabled
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleRenew(listing.property._id)
                    }
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium whitespace-nowrap"
                  >
                    Renew
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">💡 Tips</h3>
        <ul className="space-y-2 text-blue-800 text-sm">
          <li>• Renew listings at least 1 week before expiry to keep them visible</li>
          <li>• Expired listings stop appearing in search results</li>
          <li>• Enable auto-renewal to automatically extend listings when they expire</li>
          <li>• You'll receive email reminders 7 days before expiry</li>
        </ul>
      </div>
    </div>
  );
}
