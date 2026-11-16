"use client";

import { useEffect, useState } from "react";
import { Star, Send, Trash2, ThumbsUp, Loader, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface Review {
  _id: string;
  reviewer: {
    name: string;
    email: string;
    image?: string;
  };
  rating: number;
  categories: {
    communication: number;
    responsiveness: number;
    accuracy: number;
    professionalism: number;
  };
  title: string;
  text: string;
  verifiedPurchase: boolean;
  helpful: number;
  createdAt: string;
}

interface Stats {
  totalReviews: number;
  averageRating: number;
  avgCommunication: number;
  avgResponsiveness: number;
  avgAccuracy: number;
  avgProfessionalism: number;
}

interface ReviewsDisplayProps {
  agentId: string;
  showForm?: boolean;
  propertyId?: string;
}

export default function ReviewsDisplay({
  agentId,
  showForm = false,
  propertyId,
}: ReviewsDisplayProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [distribution, setDistribution] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(showForm);
  const [formData, setFormData] = useState({
    rating: 5,
    categories: {
      communication: 5,
      responsiveness: 5,
      accuracy: 5,
      professionalism: 5,
    },
    title: "",
    text: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [agentId]);

  const fetchReviews = async () => {
    try {
      const params = new URLSearchParams({ agentId });
      if (propertyId) params.append("propertyId", propertyId);

      const res = await fetch(`/api/reviews?${params}`);
      if (!res.ok) throw new Error();

      const data = await res.json();
      setReviews(data.reviews);
      setStats(data.stats);
      setDistribution(data.distribution);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.text) {
      toast.error("Title and review text are required");
      return;
    }

    if (!propertyId) {
      toast.error("Property ID is required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          propertyId,
          ...formData,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      toast.success("Review submitted!");
      setFormData({
        rating: 5,
        categories: {
          communication: 5,
          responsiveness: 5,
          accuracy: 5,
          professionalism: 5,
        },
        title: "",
        text: "",
      });
      setFormOpen(false);
      fetchReviews();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit review"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Delete this review?")) return;

    try {
      const res = await fetch(`/api/reviews?reviewId=${reviewId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      toast.success("Review deleted");
      fetchReviews();
    } catch (err) {
      toast.error("Failed to delete review");
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    try {
      const res = await fetch("/api/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, isHelpful: true }),
      });

      if (!res.ok) throw new Error();

      fetchReviews();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Summary */}
      {stats && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Overall Rating */}
            <div>
              <h3 className="text-gray-600 text-sm font-semibold mb-3">
                Overall Rating
              </h3>
              <div className="flex items-end gap-4">
                <div className="text-5xl font-bold text-blue-600">
                  {stats.averageRating.toFixed(1)}
                </div>
                <div>
                  <div className="flex gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        className={
                          i < Math.round(stats.averageRating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">
                    {stats.totalReviews} reviews
                  </p>
                </div>
              </div>
            </div>

            {/* Category Ratings */}
            <div className="space-y-2">
              <h3 className="text-gray-600 text-sm font-semibold mb-3">
                Category Ratings
              </h3>
              {[
                { label: "Communication", value: stats.avgCommunication },
                { label: "Responsiveness", value: stats.avgResponsiveness },
                { label: "Accuracy", value: stats.avgAccuracy },
                { label: "Professionalism", value: stats.avgProfessionalism },
              ].map((cat) => (
                <div key={cat.label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{cat.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(cat.value / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-10">
                      {cat.value.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rating Distribution */}
          {Object.keys(distribution).length > 0 && (
            <div className="mt-6 pt-6 border-t border-blue-200">
              <h4 className="text-sm font-semibold text-gray-600 mb-3">
                Rating Distribution
              </h4>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 w-6">
                      {star}★
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{
                          width: `${
                            ((distribution[star] || 0) / stats.totalReviews) * 100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">
                      {distribution[star] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Write Review Form */}
      {formOpen && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Write a Review</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Review Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Excellent agent, highly recommend"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Overall Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="p-1"
                  >
                    <Star
                      size={28}
                      className={
                        star <= formData.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300 hover:text-yellow-300"
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Category Ratings */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: "communication", label: "Communication" },
                { key: "responsiveness", label: "Responsiveness" },
                { key: "accuracy", label: "Accuracy" },
                { key: "professionalism", label: "Professionalism" },
              ].map((cat) => (
                <div key={cat.key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {cat.label}
                  </label>
                  <select
                    value={formData.categories[cat.key as keyof typeof formData.categories]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        categories: {
                          ...formData.categories,
                          [cat.key]: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>
                        {num} stars
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Review Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Review
              </label>
              <textarea
                value={formData.text}
                onChange={(e) =>
                  setFormData({ ...formData, text: e.target.value })
                }
                placeholder="Share your experience working with this agent..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                {submitting ? (
                  <>
                    <Loader className="animate-spin" size={18} />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Submit Review
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Open Form Button */}
      {!formOpen && propertyId && (
        <button
          onClick={() => setFormOpen(true)}
          className="w-full py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition"
        >
          + Write a Review
        </button>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
            <AlertCircle className="mx-auto text-gray-400 mb-3" size={40} />
            <p className="text-gray-600 font-medium">No reviews yet</p>
            <p className="text-gray-500 text-sm">Be the first to review this agent!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review._id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex gap-2 items-center mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={
                          i < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }
                      />
                    ))}
                  </div>
                  <h4 className="font-semibold text-gray-900">{review.title}</h4>
                  <p className="text-sm text-gray-600">
                    by {review.reviewer.name} •{" "}
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                  {review.verifiedPurchase && (
                    <span className="inline-block mt-1 bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                      ✓ Verified Purchase
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(review._id)}
                  className="text-gray-400 hover:text-red-600 transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <p className="text-gray-700 mb-4">{review.text}</p>

              <div className="flex items-center justify-between text-sm">
                <div className="flex gap-4">
                  {[
                    { label: "Communication", value: review.categories.communication },
                    { label: "Responsiveness", value: review.categories.responsiveness },
                    { label: "Accuracy", value: review.categories.accuracy },
                    { label: "Professionalism", value: review.categories.professionalism },
                  ].map((cat) => (
                    <div key={cat.label} className="text-gray-600">
                      {cat.label}:{" "}
                      <strong className="text-gray-900">{cat.value}/5</strong>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => handleMarkHelpful(review._id)}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition"
                >
                  <ThumbsUp size={16} />
                  {review.helpful > 0 && <span>{review.helpful}</span>}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
