"use client";

import PropertyForm from "@/components/PropertyForm";

export default function NewListingPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-navy mb-1">Post a property</h1>
      <p className="text-navy/60 mb-6">Listings are reviewed before going live, to keep out fraud.</p>
      <PropertyForm mode="create" />
    </div>
  );
}
