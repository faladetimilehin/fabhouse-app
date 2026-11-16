import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { dbConnect } from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import Property from "@/models/Property";
import ListingExpiry from "@/models/ListingExpiry";
import { processListingExpiryAutomation } from "@/lib/listingExpiryAutomation";
import mongoose from "mongoose";

/**
 * GET - Check expiry status for user's listings
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const userId = new mongoose.Types.ObjectId((session.user as any).id);

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status"); // "expiring" | "expired" | "active"

    const query: any = { owner: userId };

    if (status === "expiring") {
      // Expiring in next 7 days
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      query.expiresAt = {
        $gte: new Date(),
        $lte: sevenDaysFromNow,
      };
      query.isActive = true;
    } else if (status === "expired") {
      query.expiresAt = { $lt: new Date() };
      // Expired listings are marked inactive by the cron after archiving them.
    } else if (status === "active") {
      query.expiresAt = { $gte: new Date() };
      query.isActive = true;
    }

    const listings = await ListingExpiry.find(query)
      .populate("property", "title location price currency type")
      .sort({ expiresAt: 1 })
      .limit(50);

    return NextResponse.json({ listings });
  } catch (err) {
    console.error("Expiry check error:", err);
    return NextResponse.json(
      { error: "Failed to fetch expiry status" },
      { status: 500 }
    );
  }
}

/**
 * PUT - Renew a listing
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { propertyId, renewalDays } = body;

    if (!propertyId) {
      return NextResponse.json({ error: "propertyId required" }, { status: 400 });
    }
    const days = Number(renewalDays ?? 30);
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      return NextResponse.json({ error: "renewalDays must be between 1 and 365" }, { status: 400 });
    }

    await dbConnect();
    const userId = new mongoose.Types.ObjectId((session.user as any).id);
    const propId = new mongoose.Types.ObjectId(propertyId);

    // Verify ownership
    const property = await Property.findOne({ _id: propId, owner: userId });
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    // Update expiry
    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + days);

    const expiry = await ListingExpiry.findOneAndUpdate(
      { property: propId },
      {
        expiresAt: newExpiryDate,
        isActive: true,
        $inc: { renewalCount: 1 },
        lastRenewalAt: new Date(),
      },
      { new: true }
    );
    if (property.status === "archived") {
      property.status = "active";
      await property.save();
    }

    if (!expiry) {
      // Create new expiry if doesn't exist
      const created = await ListingExpiry.create({
        property: propId,
        owner: userId,
        expiresAt: newExpiryDate,
        isActive: true,
        renewalCount: 1,
        lastRenewalAt: new Date(),
      });
      return NextResponse.json({
        success: true,
        message: "Listing renewed",
        expiresAt: created.expiresAt,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Listing renewed",
      expiresAt: expiry.expiresAt,
    });
  } catch (err) {
    console.error("Renewal error:", err);
    return NextResponse.json(
      { error: "Failed to renew listing" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET;
    const legacyKey = process.env.CRON_API_KEY;
    const authorized = Boolean(
      (secret && req.headers.get("authorization") === `Bearer ${secret}`) ||
      (legacyKey && req.headers.get("x-api-key") === legacyKey)
    );
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(await processListingExpiryAutomation());
  } catch (err) {
    console.error("Reminder job error:", err);
    return NextResponse.json(
      { error: "Failed to process reminders" },
      { status: 500 }
    );
  }
}
