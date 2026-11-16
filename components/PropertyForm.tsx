"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import ImageUploader from "@/components/ImageUploader";
import VideoUploader from "@/components/VideoUploader";

export interface PropertyFormValues {
  title: string;
  description: string;
  type: string;
  purpose: string;
  price: string;
  currency: string;
  priceQualifier: string;
  state: string;
  city: string;
  address: string;
  postcode: string;
  bedrooms: string;
  bathrooms: string;
  sizeSqFt: string;
  landSize: string;
  tenure: string;
  amenities: string;
}

export const emptyPropertyForm: PropertyFormValues = {
  title: "",
  description: "",
  type: "house",
  purpose: "sale",
  price: "",
  currency: "NGN",
  priceQualifier: "fixed",
  state: "",
  city: "",
  address: "",
  postcode: "",
  bedrooms: "",
  bathrooms: "",
  sizeSqFt: "",
  landSize: "",
  tenure: "",
  amenities: "",
};

interface PropertyFormProps {
  mode: "create" | "edit";
  propertyId?: string;
  initialValues?: PropertyFormValues;
  initialImages?: string[];
  initialVideos?: string[];
}

export default function PropertyForm({ mode, propertyId, initialValues, initialImages, initialVideos }: PropertyFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<PropertyFormValues>(initialValues ?? emptyPropertyForm);
  const [images, setImages] = useState<string[]>(initialImages ?? []);
  const [videos, setVideos] = useState<string[]>(initialVideos ?? []);
  const [loading, setLoading] = useState(false);
  const [upgradeNotice, setUpgradeNotice] = useState<string | null>(null);
  const [addressWarning, setAddressWarning] = useState<string | null>(null);
  const [imageWarnings, setImageWarnings] = useState<string[]>([]);

  function set<K extends keyof PropertyFormValues>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function checkAddressDuplicate() {
    if (!form.address || !form.city || !form.state) return;
    try {
      const res = await fetch("/api/properties/check-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: form.address,
          city: form.city,
          state: form.state,
          excludeListingId: propertyId,
        }),
      });
      const data = await res.json();
      if (data.addressCount > 0) {
        setAddressWarning(
          `⚠️ ${data.addressCount} other listing${data.addressCount > 1 ? "s" : ""} already exist at this address. If this is the same property, it may be flagged as a duplicate.`
        );
      } else {
        setAddressWarning(null);
      }
    } catch {
      // non-blocking
    }
  }

  async function checkImageDuplicates(newImages: string[]) {
    if (newImages.length === 0) return;
    try {
      const res = await fetch("/api/properties/check-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: newImages, excludeListingId: propertyId }),
      });
      const data = await res.json();
      if (data.imageDuplicates?.length > 0) {
        setImageWarnings(
          data.imageDuplicates.map(
            (d: { url: string; existingCount: number }) =>
              `A photo you uploaded already appears in ${d.existingCount} other listing${d.existingCount > 1 ? "s" : ""}. This may indicate a duplicate listing.`
          )
        );
      } else {
        setImageWarnings([]);
      }
    } catch {
      // non-blocking
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setUpgradeNotice(null);

    const payload = {
      title: form.title,
      description: form.description,
      type: form.type,
      purpose: form.purpose,
      price: Number(form.price),
      currency: form.currency,
      priceQualifier: form.priceQualifier,
      location: {
        state: form.state,
        city: form.city,
        address: form.address || undefined,
        postcode: form.postcode || undefined,
      },
      bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
      sizeSqFt: form.sizeSqFt ? Number(form.sizeSqFt) : undefined,
      landSize: form.landSize || undefined,
      tenure: form.tenure || undefined,
      amenities: form.amenities ? form.amenities.split(",").map((a) => a.trim()).filter(Boolean) : [],
      images,
      videos,
    };

    const url = mode === "create" ? "/api/properties" : `/api/properties/${propertyId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (res.status === 402) {
      // Billing gate from lib/billing.ts — only fires once BILLING_ENABLED is true.
      const data = await res.json();
      setUpgradeNotice(data.error);
      return;
    }

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? `Couldn't ${mode === "create" ? "create" : "update"} listing.`);
      return;
    }

    toast.success(mode === "create" ? "Listing submitted for review!" : "Listing updated.");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div>
      {upgradeNotice && (
        <div className="bg-gold/10 border border-gold rounded-lg p-4 mb-6">
          <p className="text-navy font-medium">{upgradeNotice}</p>
          <Link href="/pricing" className="text-gold-dark font-semibold hover:underline text-sm mt-1 inline-block">
            View plans →
          </Link>
        </div>
      )}

      {addressWarning && (
        <div className="flex gap-2 bg-amber-50 border border-amber-300 rounded-lg p-3 mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">{addressWarning}</p>
        </div>
      )}

      {imageWarnings.length > 0 && (
        <div className="flex gap-2 bg-amber-50 border border-amber-300 rounded-lg p-3 mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 space-y-1">
            {imageWarnings.map((w, i) => <p key={i}>{w}</p>)}
          </div>
        </div>
      )}

      {mode === "edit" && (
        <p className="text-xs text-navy/50 bg-navy/5 rounded-md px-3 py-2 mb-4">
          Editing sends this listing back to "pending" review if it changes materially. Small edits are fine.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-navy">Title</label>
          <input
            required
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. 4-bedroom duplex in Lekki Phase 1"
            className="mt-1 w-full border border-navy/15 rounded-md px-3 py-2 outline-none focus:border-gold"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-navy">Description</label>
          <textarea
            required
            minLength={20}
            rows={4}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className="mt-1 w-full border border-navy/15 rounded-md px-3 py-2 outline-none focus:border-gold"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-navy">Type</label>
            <select
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
              className="mt-1 w-full border border-navy/15 rounded-md px-3 py-2 outline-none focus:border-gold"
            >
              <option value="house">House</option>
              <option value="flat">Flat/Apartment</option>
              <option value="land">Land</option>
              <option value="shortlet">Short-let</option>
              <option value="commercial">Commercial</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-navy">Purpose</label>
            <select
              value={form.purpose}
              onChange={(e) => set("purpose", e.target.value)}
              className="mt-1 w-full border border-navy/15 rounded-md px-3 py-2 outline-none focus:border-gold"
            >
              <option value="sale">For sale</option>
              <option value="rent">For rent</option>
              <option value="shortlet">Short-let</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-navy">Price</label>
            <input
              required
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              className="mt-1 w-full border border-navy/15 rounded-md px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-navy">Currency</label>
            <select
              value={form.currency}
              onChange={(e) => set("currency", e.target.value)}
              className="mt-1 w-full border border-navy/15 rounded-md px-3 py-2 outline-none focus:border-gold"
            >
              <option value="NGN">NGN</option>
              <option value="GBP">GBP</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-navy">Price qualifier</label>
          <select
            value={form.priceQualifier}
            onChange={(e) => set("priceQualifier", e.target.value)}
            className="mt-1 w-full border border-navy/15 rounded-md px-3 py-2 outline-none focus:border-gold"
          >
            <option value="fixed">Fixed price</option>
            <option value="negotiable">Negotiable</option>
            <option value="offers_over">Offers Over</option>
            <option value="offers_in_region_of">Offers in Region of</option>
            <option value="guide_price">Guide Price</option>
            <option value="poa">Price on Application</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-navy">State</label>
            <input
              required
              value={form.state}
              onChange={(e) => set("state", e.target.value)}
              className="mt-1 w-full border border-navy/15 rounded-md px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-navy">City</label>
            <input
              required
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              className="mt-1 w-full border border-navy/15 rounded-md px-3 py-2 outline-none focus:border-gold"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-navy">Street address (optional)</label>
            <input
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              onBlur={checkAddressDuplicate}
              className="mt-1 w-full border border-navy/15 rounded-md px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-navy">Postcode (optional)</label>
            <input
              value={form.postcode}
              onChange={(e) => set("postcode", e.target.value)}
              placeholder="e.g. CV4 7AQ"
              className="mt-1 w-full border border-navy/15 rounded-md px-3 py-2 outline-none focus:border-gold"
            />
          </div>
        </div>

        {(form.type === "house" || form.type === "flat") && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-navy">Bedrooms</label>
              <input
                type="number"
                min={0}
                value={form.bedrooms}
                onChange={(e) => set("bedrooms", e.target.value)}
                className="mt-1 w-full border border-navy/15 rounded-md px-3 py-2 outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-navy">Bathrooms</label>
              <input
                type="number"
                min={0}
                value={form.bathrooms}
                onChange={(e) => set("bathrooms", e.target.value)}
                className="mt-1 w-full border border-navy/15 rounded-md px-3 py-2 outline-none focus:border-gold"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {form.type === "land" ? (
            <div className="col-span-2">
              <label className="text-sm font-medium text-navy">Land size</label>
              <input
                value={form.landSize}
                onChange={(e) => set("landSize", e.target.value)}
                placeholder="e.g. 2 plots, 5,000 sqm, half hectare"
                className="mt-1 w-full border border-navy/15 rounded-md px-3 py-2 outline-none focus:border-gold"
              />
              <p className="text-xs text-navy/40 mt-1">Describe it however buyers in your market expect \u2014 plots, sqm, acres, or hectares.</p>
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium text-navy">Size (sq ft, optional)</label>
              <input
                type="number"
                min={0}
                value={form.sizeSqFt}
                onChange={(e) => set("sizeSqFt", e.target.value)}
                className="mt-1 w-full border border-navy/15 rounded-md px-3 py-2 outline-none focus:border-gold"
              />
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-navy">Tenure (optional)</label>
            <select
              value={form.tenure}
              onChange={(e) => set("tenure", e.target.value)}
              className="mt-1 w-full border border-navy/15 rounded-md px-3 py-2 outline-none focus:border-gold"
            >
              <option value="">Not specified</option>
              <option value="c_of_o">C of O (Certificate of Occupancy)</option>
              <option value="governors_consent">Governor's Consent</option>
              <option value="freehold">Freehold</option>
              <option value="leasehold">Leasehold</option>
              <option value="not_applicable">Not applicable</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-navy">Amenities (comma-separated)</label>
          <input
            value={form.amenities}
            onChange={(e) => set("amenities", e.target.value)}
            placeholder="Water, 24/7 power, Security"
            className="mt-1 w-full border border-navy/15 rounded-md px-3 py-2 outline-none focus:border-gold"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-navy">Photos</label>
          <div className="mt-1">
            <ImageUploader
              images={images}
              onChange={(newImages) => {
                setImages(newImages);
                checkImageDuplicates(newImages);
              }}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-navy">Walkthrough videos (optional)</label>
          <p className="text-xs text-navy/40 mb-1">
            Video is one of the biggest trust signals for buyers abroad who can't visit in person.
          </p>
          <VideoUploader videos={videos} onChange={setVideos} />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-navy text-white font-semibold py-2.5 rounded-md hover:bg-navy-light transition disabled:opacity-50"
        >
          {loading
            ? mode === "create" ? "Submitting..." : "Saving..."
            : mode === "create" ? "Submit listing for review" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
