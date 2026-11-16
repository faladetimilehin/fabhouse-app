import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Property from "@/models/Property";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const searchParams = req.nextUrl.searchParams;
    
    // Parse filters
    const filters: any = { status: "active" };

    // Keyword search
    const q = searchParams.get("q");
    if (q) {
      filters.$or = [
        { address: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { location: { $regex: q, $options: "i" } },
      ];
    }

    // Price range
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    if (minPrice || maxPrice) {
      filters.price = {};
      if (minPrice) filters.price.$gte = parseInt(minPrice);
      if (maxPrice) filters.price.$lte = parseInt(maxPrice);
    }

    // Bedrooms
    const bedrooms = searchParams.get("bedrooms");
    if (bedrooms) {
      filters.bedrooms = parseInt(bedrooms);
    }

    // Bathrooms
    const bathrooms = searchParams.get("bathrooms");
    if (bathrooms) {
      filters.bathrooms = parseInt(bathrooms);
    }

    // Property type
    const type = searchParams.get("type");
    if (type) {
      filters.type = type;
    }

    // Purpose (sale/rent)
    const purpose = searchParams.get("purpose");
    if (purpose) {
      filters.purpose = purpose;
    }

    // Location filters
    const state = searchParams.get("state");
    if (state) {
      filters.state = state;
    }

    const lga = searchParams.get("lga");
    if (lga) {
      filters.lga = lga;
    }

    // Featured only
    const featured = searchParams.get("featured");
    if (featured === "true") {
      filters.isFeatured = true;
    }

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "12"));
    const skip = (page - 1) * limit;

    // Execute query
    const [properties, total] = await Promise.all([
      Property.find(filters)
        .sort({ createdAt: -1 })
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
