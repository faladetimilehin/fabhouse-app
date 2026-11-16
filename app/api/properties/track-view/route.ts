import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { dbConnect } from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

interface IPropertyView {
  propertyId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  ipAddress: string;
  userAgent: string;
  viewedAt: Date;
}

const PropertyViewSchema = new mongoose.Schema<IPropertyView>(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    ipAddress: String,
    userAgent: String,
    viewedAt: { type: Date, default: Date.now },
  },
  { collection: "PropertyViews" }
);

// TTL index to auto-delete views after 90 days
PropertyViewSchema.index({ viewedAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
PropertyViewSchema.index({ propertyId: 1, userId: 1, viewedAt: -1 });

const PropertyView =
  (mongoose.models.PropertyView as mongoose.Model<IPropertyView>) ||
  mongoose.model<IPropertyView>("PropertyView", PropertyViewSchema);

/**
 * Track a property view
 * Used to calculate popularity, analytics, and recommendations
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { propertyId } = body;

    if (!propertyId) {
      return NextResponse.json(
        { error: "Property ID required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Get user if logged in
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    // Get IP and user agent
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Track view
    await PropertyView.create({
      propertyId: new mongoose.Types.ObjectId(propertyId),
      userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      ipAddress,
      userAgent,
      viewedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Track view error:", err);
    return NextResponse.json(
      { error: "Failed to track view" },
      { status: 500 }
    );
  }
}
