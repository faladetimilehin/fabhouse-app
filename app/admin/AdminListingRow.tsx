"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { Check, X } from "lucide-react";

interface Props {
  property: {
    _id: string;
    title: string;
    type: string;
    price: number;
    currency: string;
    location: { city: string; state: string };
    ownerName: string;
    ownerEmail: string;
  };
}

export default function AdminListingRow({ property }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateStatus(status: "active" | "rejected") {
    setLoading(true);
    const res = await fetch(`/api/admin/properties/${property._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);

    if (!res.ok) {
      toast.error("Couldn't update listing.");
      return;
    }
    toast.success(status === "active" ? "Listing approved." : "Listing rejected.");
    router.refresh();
  }

  return (
    <div className="bg-white border border-navy/10 rounded-lg p-4 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <Link href={`/listings/${property._id}`} className="font-semibold text-navy hover:underline">
          {property.title}
        </Link>
        <p className="text-sm text-navy/60">
          {property.currency} {property.price.toLocaleString()} · {property.location.city}, {property.location.state}
        </p>
        <p className="text-xs text-navy/40 mt-1">Posted by {property.ownerName} ({property.ownerEmail})</p>
      </div>
      <div className="flex gap-2">
        <button
          disabled={loading}
          onClick={() => updateStatus("active")}
          className="flex items-center gap-1 bg-green-600 text-white text-sm font-semibold px-3 py-2 rounded-md hover:bg-green-700 transition disabled:opacity-50"
        >
          <Check className="w-4 h-4" /> Approve
        </button>
        <button
          disabled={loading}
          onClick={() => updateStatus("rejected")}
          className="flex items-center gap-1 bg-red-100 text-red-700 text-sm font-semibold px-3 py-2 rounded-md hover:bg-red-200 transition disabled:opacity-50"
        >
          <X className="w-4 h-4" /> Reject
        </button>
      </div>
    </div>
  );
}
