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
    purpose: string;
    description: string;
    images: string[];
    price: number;
    currency: string;
    location: { city: string; state: string; address?: string };
    ownerName: string;
    ownerEmail: string;
  };
}

const MEDIA_REVIEW_CHECK = ["mediaCompared", "Reviewed all photos and videos for relevance, apparent authenticity, and inappropriate content"] as const;
const SHORTLET_REVIEW_CHECKS = [
  ["locationConfirmed", "Confirmed the property's location with the host"],
  ["authorityToLetReviewed", "Reviewed evidence the host is authorized to let it"],
  ["chargesAndCapacityConfirmed", "Confirmed capacity, check-in/out, fees, utilities and house rules"],
] as const;

export default function AdminListingRow({ property }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [evidenceNotes, setEvidenceNotes] = useState("");
  const isShortlet = property.purpose === "shortlet";
  const readyToApprove =
    Boolean(checks.mediaCompared) &&
    evidenceNotes.trim().length >= 10 &&
    (!isShortlet || SHORTLET_REVIEW_CHECKS.every(([key]) => checks[key]));

  async function updateStatus(status: "active" | "rejected") {
    setLoading(true);
    const res = await fetch(`/api/admin/properties/${property._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        ...(status === "active" ? {
          reviewEvidence: {
            locationConfirmed: Boolean(checks.locationConfirmed),
            authorityToLetReviewed: Boolean(checks.authorityToLetReviewed),
            mediaCompared: Boolean(checks.mediaCompared),
            chargesAndCapacityConfirmed: Boolean(checks.chargesAndCapacityConfirmed),
            notes: evidenceNotes,
          },
        } : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { toast.error(data.error ?? "Couldn't update listing."); return; }
    toast.success(status === "active" ? "Listing approved." : "Listing rejected.");
    router.refresh();
  }

  return (
    <div className="bg-white border border-navy/10 rounded-lg p-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link href={`/listings/${property._id}`} target="_blank" className="font-semibold text-navy hover:underline">{property.title}</Link>
          <p className="text-sm text-navy/60">{property.currency} {property.price.toLocaleString()} · {property.location.address ? `${property.location.address}, ` : ""}{property.location.city}, {property.location.state}</p>
          <p className="text-xs text-navy/40 mt-1">{property.purpose} · Posted by {property.ownerName} ({property.ownerEmail})</p>
        </div>
        <div className="flex gap-2">
          <button disabled={loading || !readyToApprove} onClick={() => updateStatus("active")} className="flex items-center gap-1 bg-green-600 text-white text-sm font-semibold px-3 py-2 rounded-md hover:bg-green-700 transition disabled:opacity-40">
            <Check className="w-4 h-4" /> Approve
          </button>
          <button disabled={loading} onClick={() => updateStatus("rejected")} className="flex items-center gap-1 bg-red-100 text-red-700 text-sm font-semibold px-3 py-2 rounded-md hover:bg-red-200 transition disabled:opacity-50">
            <X className="w-4 h-4" /> Reject
          </button>
        </div>
      </div>
      <p className="mt-3 max-w-3xl text-xs text-navy/60 line-clamp-3">{property.description}</p>
      <p className="mt-1 text-xs text-navy/45">{property.images.length} photo(s) · open the listing above to inspect its photos and full details.</p>
      <div className="mt-4 rounded-md border border-gold/30 bg-gold/5 p-3">
        <p className="text-sm font-semibold text-navy">Listing media review</p>
        <p className="mt-1 text-xs text-navy/60">Open and inspect every photo and video. This manual review does not prove property ownership, condition, or listing accuracy.</p>
        <label className="mt-2 flex items-start gap-2 text-xs text-navy/75">
          <input type="checkbox" checked={Boolean(checks.mediaCompared)} onChange={(event) => setChecks((previous) => ({ ...previous, mediaCompared: event.target.checked }))} className="mt-0.5" />
          {MEDIA_REVIEW_CHECK[1]}
        </label>
        {isShortlet && <>
          <p className="mt-4 text-sm font-semibold text-navy">Additional short-stay evidence checks</p>
          <div className="mt-2 grid gap-2">{SHORTLET_REVIEW_CHECKS.map(([key, label]) => <label key={key} className="flex items-start gap-2 text-xs text-navy/75"><input type="checkbox" checked={Boolean(checks[key])} onChange={(event) => setChecks((previous) => ({ ...previous, [key]: event.target.checked }))} className="mt-0.5" />{label}</label>)}</div>
        </>}
        <label className="mt-3 block text-xs text-navy/65">Review method, date, evidence reference, and unresolved issues (do not enter sensitive ID numbers)
          <textarea value={evidenceNotes} onChange={(event) => setEvidenceNotes(event.target.value)} maxLength={1000} className="mt-1 min-h-16 w-full rounded border border-navy/15 px-3 py-2 text-sm" placeholder="Example: live video walkthrough, host call, listing photos compared; follow-up needed on generator hours." />
        </label>
      </div>
    </div>
  );
}
