import escapeStringRegexp from "escape-string-regexp";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { Suspense } from "react";
import { dbConnect } from "@/lib/mongodb";
import Property from "@/models/Property";
import ListingsViewToggle from "@/components/ListingsViewToggle";
import SaveSearchButton from "@/components/SaveSearchButton";
import { convertToNGN } from "@/lib/currency";

const TYPES = [
  { label: "All types", value: "" },
  { label: "Houses", value: "house" },
  { label: "Flats/Apartments", value: "flat" },
  { label: "Land", value: "land" },
  { label: "Short-let", value: "shortlet" },
  { label: "Commercial", value: "commercial" },
];

const PAGE_SIZE = 12;

interface SearchParams {
  q?: string;
  type?: string;
  purpose?: string;
  state?: string;
  page?: string;
  minPrice?: string;
  maxPrice?: string;
  priceCurrency?: string;
}

export default async function ListingsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  await dbConnect();

  const filter: Record<string, any> = { status: "active" };
  if (params.type) filter.type = params.type;
  if (params.purpose) filter.purpose = params.purpose;
  if (params.state) filter["location.state"] = params.state;

  const priceCurrency = params.priceCurrency || "NGN";
  if (params.minPrice || params.maxPrice) {
    // Every listing stores a priceNGN equivalent (see lib/currency.ts)
    // regardless of its own currency, so a buyer filtering "under £200k"
    // still matches listings priced in NGN or USD.
    filter.priceNGN = {};
    if (params.minPrice) filter.priceNGN.$gte = convertToNGN(Number(params.minPrice), priceCurrency);
    if (params.maxPrice) filter.priceNGN.$lte = convertToNGN(Number(params.maxPrice), priceCurrency);
  }

  if (params.q) {
    const regex = new RegExp(escapeStringRegexp(params.q.trim()), "i");
    filter.$or = [
      { title: regex },
      { description: regex },
      { "location.city": regex },
      { "location.state": regex },
      { "location.address": regex },
    ];
  }

  const page = Math.max(1, Number(params.page ?? "1"));
  const total = await Property.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const properties = await Property.find(filter)
    .sort({ isFeatured: -1, createdAt: -1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .populate("owner", "name isVerified")
    .lean();

  // Preserve existing filters when building pagination links
  function pageHref(p: number) {
    const search = new URLSearchParams();
    if (params.q) search.set("q", params.q);
    if (params.type) search.set("type", params.type);
    if (params.purpose) search.set("purpose", params.purpose);
    if (params.state) search.set("state", params.state);
    if (params.minPrice) search.set("minPrice", params.minPrice);
    if (params.maxPrice) search.set("maxPrice", params.maxPrice);
    if (params.priceCurrency) search.set("priceCurrency", params.priceCurrency);
    search.set("page", String(p));
    return `/listings?${search.toString()}`;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-navy mb-1">Browse listings</h1>
      <p className="text-navy/60 mb-6">
        {total} {total === 1 ? "property" : "properties"} found
      </p>

      <form className="flex flex-wrap gap-3 mb-8 bg-white p-4 rounded-lg border border-navy/10">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Search by city, state, or keyword"
          className="flex-1 min-w-[200px] border border-navy/15 rounded-md px-3 py-2 text-sm outline-none focus:border-gold"
        />
        <select
          name="type"
          defaultValue={params.type ?? ""}
          className="border border-navy/15 rounded-md px-3 py-2 text-sm outline-none focus:border-gold"
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <select
          name="purpose"
          defaultValue={params.purpose ?? ""}
          className="border border-navy/15 rounded-md px-3 py-2 text-sm outline-none focus:border-gold"
        >
          <option value="">Sale or rent</option>
          <option value="sale">For sale</option>
          <option value="rent">For rent</option>
          <option value="shortlet">Short-let</option>
        </select>

        <div className="flex items-center gap-1.5 border border-navy/15 rounded-md px-2 bg-white">
          <input
            name="minPrice"
            type="number"
            min={0}
            defaultValue={params.minPrice}
            placeholder="Min price"
            className="w-24 py-2 text-sm outline-none"
          />
          <span className="text-navy/30">–</span>
          <input
            name="maxPrice"
            type="number"
            min={0}
            defaultValue={params.maxPrice}
            placeholder="Max price"
            className="w-24 py-2 text-sm outline-none"
          />
          <select
            name="priceCurrency"
            defaultValue={params.priceCurrency ?? "NGN"}
            className="text-sm outline-none bg-transparent border-l border-navy/10 pl-1.5"
          >
            <option value="NGN">NGN</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
          </select>
        </div>

        <button className="bg-navy text-white px-5 py-2 rounded-md text-sm font-semibold hover:bg-navy-light transition">
          Filter
        </button>
        <Suspense fallback={null}>
          <SaveSearchButton />
        </Suspense>
      </form>

      {properties.length === 0 ? (
        <div className="text-center py-20 text-navy/50">
          <p className="text-lg">No listings match yet.</p>
          <p className="text-sm mt-1">Try widening your search, or check back soon — new listings are added regularly.</p>
        </div>
      ) : (
        <>
          <ListingsViewToggle
            properties={properties.map((p: any) => ({
              ...p,
              _id: p._id.toString(),
              owner: p.owner ? { ...p.owner, _id: p.owner._id?.toString() } : undefined,
            }))}
          />

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <Link
                href={pageHref(Math.max(1, page - 1))}
                aria-disabled={page === 1}
                className={`px-3 py-2 rounded-md text-sm font-semibold border border-navy/15 ${
                  page === 1 ? "pointer-events-none opacity-40" : "hover:bg-navy hover:text-white transition"
                }`}
              >
                Previous
              </Link>
              <span className="text-sm text-navy/60 px-2">
                Page {page} of {totalPages}
              </span>
              <Link
                href={pageHref(Math.min(totalPages, page + 1))}
                aria-disabled={page === totalPages}
                className={`px-3 py-2 rounded-md text-sm font-semibold border border-navy/15 ${
                  page === totalPages ? "pointer-events-none opacity-40" : "hover:bg-navy hover:text-white transition"
                }`}
              >
                Next
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
