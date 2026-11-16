import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { dbConnect } from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import Property from "@/models/Property";
import { parsePropertyCSV, validateCSVFile } from "@/lib/csvParser";
import mongoose from "mongoose";
import User from "@/models/User";
import { canPerform } from "@/lib/billing";
import { convertToNGN } from "@/lib/currency";
import { hashAddress, hashImageUrl, registerAddressFingerprint, registerImageFingerprints } from "@/lib/fingerprint";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (!["agent", "developer", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "Only agents and developers can bulk upload" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file
    const validation = validateCSVFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Read file
    const csvText = await file.text();

    // Parse CSV
    const { valid, errors } = parsePropertyCSV(csvText);

    if (valid.length === 0) {
      return NextResponse.json(
        {
          error: "No valid properties found",
          errors,
        },
        { status: 400 }
      );
    }
    if (valid.length > 100) {
      return NextResponse.json({ error: "Upload no more than 100 listings at a time.", errors }, { status: 400 });
    }

    await dbConnect();
    const userId = new mongoose.Types.ObjectId((session.user as any).id);
    const dbUser = await User.findById(userId);
    if (!dbUser || dbUser.isSuspended) return NextResponse.json({ error: "Active account required." }, { status: 403 });

    const pendingAndActiveCount = await Property.countDocuments({ owner: userId, status: { $in: ["pending", "active"] } });
    for (let index = 0; index < valid.length; index += 1) {
      const gate = canPerform({ user: dbUser, activeListingCount: pendingAndActiveCount + index, action: "createListing" });
      if (!gate.allowed) {
        return NextResponse.json(
          { error: `${gate.reason} This upload would exceed your plan limit.`, upgradeSuggested: gate.upgradeSuggested },
          { status: 402 }
        );
      }
    }

    const propertiesToCreate = valid.map((prop) => {
      const images = prop.images ? prop.images.split(",").map((url) => url.trim()).filter(Boolean) : [];
      const title = prop.title?.trim() || `${prop.bedrooms ? `${prop.bedrooms}-bedroom ` : ""}${prop.type} in ${prop.city}`;
      const description = prop.description?.trim() || `${prop.type} listing in ${prop.city}, ${prop.state}.`;
      const priceNGN = ["NGN", "USD", "GBP"].includes(prop.currency)
        ? convertToNGN(prop.price, prop.currency)
        : undefined;
      return {
        title,
        description,
        type: prop.type,
        purpose: prop.purpose,
        price: prop.price,
        pricePeriod: prop.pricePeriod,
        currency: prop.currency,
        priceNGN,
        location: { countryCode: prop.countryCode, state: prop.state, city: prop.city, address: prop.address },
        bedrooms: prop.bedrooms,
        bathrooms: prop.bathrooms,
        amenities: prop.amenities ? prop.amenities.split(",").map((item) => item.trim()).filter(Boolean) : [],
        images,
        videos: [],
        imageHashes: images.map(hashImageUrl),
        addressHash: prop.address ? hashAddress(prop.address, prop.city, prop.state, prop.countryCode) : undefined,
        owner: userId,
        status: "pending",
        isFeatured: false,
      };
    });

    const created = await Property.insertMany(propertiesToCreate);
    for (const property of created as any[]) {
      registerImageFingerprints(property._id, property.images ?? []).catch(() => {});
      if (property.location?.address) {
        registerAddressFingerprint(property._id, property.location.address, property.location.city, property.location.state, property.location.countryCode).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      created: created.length,
      errors,
      properties: created.map((p: any) => ({
        id: p._id,
        address: p.location?.address,
        price: p.price,
      })),
    });
  } catch (err) {
    console.error("Bulk create error:", err);
    return NextResponse.json(
      { error: "Failed to upload listings" },
      { status: 500 }
    );
  }
}

/**
 * Get bulk upload summary/history
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const userId = new mongoose.Types.ObjectId((session.user as any).id);

    // Get properties created in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const stats = await Property.aggregate([
      {
        $match: {
          owner: userId,
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          sold: {
            $sum: { $cond: [{ $eq: ["$status", "sold"] }, 1, 0] },
          },
        },
      },
    ]);

    return NextResponse.json({
      stats: stats[0] || { total: 0, active: 0, sold: 0 },
    });
  } catch (err) {
    console.error("Get bulk stats error:", err);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
