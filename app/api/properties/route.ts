import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import escapeStringRegexp from "escape-string-regexp";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import Property from "@/models/Property";
import User from "@/models/User";
import { canPerform } from "@/lib/billing";
import { geocodeAddress } from "@/lib/geocode";
import { convertToNGN } from "@/lib/currency";
import { getMarket, MARKETS } from "@/config/markets";
import { registerImageFingerprints, registerAddressFingerprint, hashImageUrl, hashAddress } from "@/lib/fingerprint";
import { validateListingMedia } from "@/lib/listingMedia";

const createSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
  type: z.enum(["house", "flat", "land", "shortlet", "commercial"]),
  purpose: z.enum(["sale", "rent", "shortlet"]),
  price: z.number().positive(),
  pricePeriod: z.enum(["night", "week", "month", "year"]).optional(),
  currency: z.enum(["NGN", "GHS", "KES", "ZAR", "GBP", "USD"]).default("NGN"),
  priceQualifier: z.enum(["fixed", "negotiable", "offers_over", "offers_in_region_of", "guide_price", "poa"]).default("fixed"),
  location: z.object({
    countryCode: z.enum(MARKETS.map((market) => market.code) as [string, ...string[]]).default("NG"),
    state: z.string().min(2),
    city: z.string().min(2),
    address: z.string().optional(),
    postcode: z.string().optional(),
  }),
  bedrooms: z.number().int().nonnegative().optional(),
  bathrooms: z.number().int().nonnegative().optional(),
  sizeSqFt: z.number().positive().optional(),
  landSize: z.string().optional(),
  tenure: z.enum(["freehold", "leasehold", "governors_consent", "c_of_o", "not_applicable"]).optional(),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string().url()).max(8).optional(),
  videos: z.array(z.string().url()).max(3).optional(),
}).superRefine((value, ctx) => {
  if (value.purpose === "sale" && value.pricePeriod) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["pricePeriod"], message: "Sale listings cannot have a recurring price period." });
  }
  if (value.purpose === "shortlet" && !["night", "week"].includes(value.pricePeriod ?? "")) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["pricePeriod"], message: "Short-lets must be priced per night or week." });
  }
  if (value.purpose === "rent" && !["month", "year"].includes(value.pricePeriod ?? "")) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["pricePeriod"], message: "Rentals must be priced per month or year." });
  }
});

// GET /api/properties — public search/browse, only returns active listings
export async function GET(req: NextRequest) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const purpose = searchParams.get("purpose");
  const state = searchParams.get("state");
  const countryCode = searchParams.get("country")?.toUpperCase();
  const q = searchParams.get("q");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  // Price limits are compared only within the selected currency. FX is for
  // display/search conversion elsewhere, never a transactional price source.
  const priceCurrency = searchParams.get("priceCurrency") ?? getMarket(countryCode).currency;
  const filter: Record<string, any> = { status: "active" };
  if (type) filter.type = type;
  if (purpose) filter.purpose = purpose;
  if (state) filter["location.state"] = state;
  if (countryCode && MARKETS.some((market) => market.code === countryCode)) {
    filter.$and = [
      ...(filter.$and ?? []),
      countryCode === "NG"
        ? { $or: [{ "location.countryCode": "NG" }, { "location.countryCode": { $exists: false } }] }
        : { "location.countryCode": countryCode },
    ];
  }
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(48, Math.max(1, Number(searchParams.get("pageSize") ?? "12")));

  if (minPrice || maxPrice) {
    filter.currency = priceCurrency;
    filter.price = {};
    if (minPrice && Number.isFinite(Number(minPrice))) filter.price.$gte = Number(minPrice);
    if (maxPrice && Number.isFinite(Number(maxPrice))) filter.price.$lte = Number(maxPrice);
  }

  if (q) {
    // Partial, case-insensitive matching across the fields buyers actually
    // search by. This is more forgiving than a pure $text search (which
    // requires whole-word stem matches) — "lekk" or "3 bed lagos" will
    // still surface relevant listings instead of returning nothing.
    const regex = new RegExp(escapeStringRegexp(q.trim()), "i");
    const keywordFilter = { $or: [
      { title: regex },
      { description: regex },
      { "location.city": regex },
      { "location.state": regex },
      { "location.address": regex },
    ] };
    filter.$and = [...(filter.$and ?? []), keywordFilter];
  }

  const total = await Property.countDocuments(filter);
  const properties = await Property.find(filter)
    .sort({ isFeatured: -1, createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .populate("owner", "name isVerified phone");

  return NextResponse.json({
    properties,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  });
}

// POST /api/properties — create a listing (agents/developers/admin only)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "You must be signed in to list a property." }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (!["agent", "developer", "admin"].includes(role)) {
    return NextResponse.json(
      { error: "Only agents, developers, or admins can post listings." },
      { status: 403 }
    );
  }

  await dbConnect();

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const userId = (session.user as any).id;
  const mediaValidation = await validateListingMedia({ ...parsed.data, ownerId: userId });
  if (!mediaValidation.valid) {
    return NextResponse.json({ error: mediaValidation.error }, { status: mediaValidation.status });
  }

  const dbUser = await User.findById(userId);

  const activeListingCount = await Property.countDocuments({
    owner: userId,
    status: { $in: ["pending", "active"] },
  });

  // --- Billing gate ---
  // While BILLING_ENABLED is false in config/features.ts, this always
  // returns { allowed: true }. Once you turn billing on, this same code
  // starts enforcing plan limits with zero changes needed here.
  const gate = canPerform({ user: dbUser, activeListingCount, action: "createListing" });
  if (!gate.allowed) {
    return NextResponse.json(
      { error: gate.reason, upgradeSuggested: gate.upgradeSuggested },
      { status: 402 } // 402 Payment Required
    );
  }

  // Best-effort geocoding so the listing can show a pin on the map view.
  // Never blocks listing creation if it fails or times out.
  const coords = await geocodeAddress(parsed.data.location).catch(() => null);
  const location = coords ? { ...parsed.data.location, ...coords } : parsed.data.location;

  const property = await Property.create({
    ...parsed.data,
    location,
    priceNGN: ["NGN", "USD", "GBP"].includes(parsed.data.currency)
      ? convertToNGN(parsed.data.price, parsed.data.currency)
      : undefined,
    imageHashes: (parsed.data.images ?? []).map(hashImageUrl),
    addressHash: parsed.data.location.address
      ? hashAddress(parsed.data.location.address, parsed.data.location.city, parsed.data.location.state, parsed.data.location.countryCode)
      : undefined,
    owner: userId,
    status: "pending",
  });

  // Register fingerprints after creation (fire-and-forget — never blocks the response)
  registerImageFingerprints(property._id, parsed.data.images ?? []).catch(() => {});
  if (parsed.data.location.address) {
    registerAddressFingerprint(
      property._id,
      parsed.data.location.address,
      parsed.data.location.city,
      parsed.data.location.state,
      parsed.data.location.countryCode
    ).catch(() => {});
  }

  return NextResponse.json({ property }, { status: 201 });
}
