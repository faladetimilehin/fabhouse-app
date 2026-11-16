import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Property from "@/models/Property";
import escapeStringRegexp from "escape-string-regexp";
import { getMarket, MARKETS } from "@/config/markets";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const searchParams = req.nextUrl.searchParams;
    
    // Parse filters
    const filters: any = { status: "active" };

    // Match the nested fields stored by the Property model.
    const q = searchParams.get("q");
    if (q?.trim()) {
      const query = new RegExp(escapeStringRegexp(q.trim()), "i");
      filters.$and = [...(filters.$and ?? []), { $or: [
        { title: query },
        { description: query },
        { "location.address": query },
        { "location.city": query },
        { "location.state": query },
      ] }];
    }

    // Price range
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    if (minPrice || maxPrice) {
      filters.price = {};
      const currency = searchParams.get("priceCurrency") ?? getMarket(searchParams.get("country")).currency;
      filters.currency = currency;
      const min = minPrice === null ? undefined : Number(minPrice);
      const max = maxPrice === null ? undefined : Number(maxPrice);
      if (min !== undefined && Number.isFinite(min) && min >= 0) filters.price.$gte = min;
      if (max !== undefined && Number.isFinite(max) && max >= 0) filters.price.$lte = max;
      if (Object.keys(filters.price).length === 0) {
        delete filters.price;
        delete filters.currency;
      }
    }

    // Bedrooms
    const bedrooms = searchParams.get("bedrooms");
    if (bedrooms) {
      const count = Number(bedrooms);
      if (Number.isInteger(count) && count >= 0) {
        filters.bedrooms = count >= 5 ? { $gte: 5 } : count;
      }
    }

    // Bathrooms
    const bathrooms = searchParams.get("bathrooms");
    if (bathrooms) {
      const count = Number(bathrooms);
      if (Number.isInteger(count) && count >= 0) filters.bathrooms = count;
    }

    // Property type
    const type = searchParams.get("type");
    if (type) {
      filters.type = type;
    }

    // Purpose (sale, rent, or short-let)
    const purpose = searchParams.get("purpose");
    if (purpose) {
      filters.purpose = purpose;
    }

    // Location filters
    const state = searchParams.get("state");
    if (state) {
      filters["location.state"] = state;
    }

    const countryCode = searchParams.get("country")?.toUpperCase();
    if (countryCode && MARKETS.some((market) => market.code === countryCode)) {
      const countryFilter = countryCode === "NG"
        ? [{ "location.countryCode": "NG" }, { "location.countryCode": { $exists: false } }]
        : [{ "location.countryCode": countryCode }];
      filters.$and = [...(filters.$and ?? []), { $or: countryFilter }];
    }

    const city = searchParams.get("city");
    if (city) {
      filters["location.city"] = city;
    }

    // Featured only
    const featured = searchParams.get("featured");
    if (featured === "true") {
      filters.isFeatured = true;
    }

    // Pagination
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(searchParams.get("limit") || "12", 10) || 12));
    const skip = (page - 1) * limit;

    // Execute query
    const [properties, total] = await Promise.all([
      Property.find(filters)
        .sort({ isFeatured: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Property.countDocuments(filters),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      properties,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
