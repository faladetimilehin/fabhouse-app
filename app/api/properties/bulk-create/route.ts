import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { dbConnect } from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import Property from "@/models/Property";
import { parsePropertyCSV, validateCSVFile } from "@/lib/csvParser";
import mongoose from "mongoose";

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

    await dbConnect();
    const userId = new mongoose.Types.ObjectId((session.user as any).id);

    // Create properties in bulk
    const propertiesToCreate = valid.map((prop) => ({
      owner: userId,
      address: prop.address,
      price: prop.price,
      bedrooms: prop.bedrooms,
      bathrooms: prop.bathrooms,
      type: prop.type,
      purpose: prop.purpose,
      description: prop.description || "",
      state: prop.state || "",
      lga: prop.lga || "",
      images: prop.images ? prop.images.split(",").map((u) => u.trim()) : [],
      amenities: prop.amenities ? prop.amenities.split(",").map((a) => a.trim()) : [],
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const created = await Property.insertMany(propertiesToCreate);

    return NextResponse.json({
      success: true,
      created: created.length,
      errors,
      properties: created.map((p: any) => ({
        id: p._id,
        address: p.address,
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
