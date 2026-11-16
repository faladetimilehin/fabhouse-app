"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import InquiryCard, { InquiryData } from "./InquiryCard";

export default function InquiriesPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto px-6 py-10 text-center text-navy/50">Loading...</div>}>
      <InquiriesPageInner />
    </Suspense>
  );
}

function InquiriesPageInner() {
  const searchParams = useSearchParams();
  const propertyFilter = searchParams.get("property");

  const [inquiries, setInquiries] = useState<InquiryData[] | null>(null);

  useEffect(() => {
    const url = propertyFilter ? `/api/inquiries?property=${propertyFilter}` : "/api/inquiries";
    fetch(url)
      .then((res) => res.json())
      .then((data) => setInquiries(data.inquiries ?? []));
  }, [propertyFilter]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-navy mb-1">Inquiries</h1>
      <p className="text-navy/60 mb-6">
        {propertyFilter ? "Messages about this listing." : "Messages from buyers across all your listings."}
      </p>

      {inquiries === null ? (
        <div className="text-center py-16">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-gold" />
        </div>
      ) : inquiries.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-navy/10 text-navy/60">
          No inquiries yet — they'll show up here as soon as a buyer messages you.
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inq) => (
            <InquiryCard key={inq._id} inquiry={inq} />
          ))}
        </div>
      )}
    </div>
  );
}
