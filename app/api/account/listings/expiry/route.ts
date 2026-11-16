import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { dbConnect } from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import Property from "@/models/Property";
import ListingExpiry from "@/models/ListingExpiry";
import { sendEmail } from "@/lib/email";
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
      query.isActive = true;
    } else if (status === "active") {
      query.expiresAt = { $gte: new Date() };
      query.isActive = true;
    }

    const listings = await ListingExpiry.find(query)
      .populate("property", "address price type")
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
    newExpiryDate.setDate(newExpiryDate.getDate() + (renewalDays || 30));

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

/**
 * POST - Send expiry reminder emails (called by cron job)
 */
export async function POST(req: NextRequest) {
  try {
    // Verify API key for cron job
    const apiKey = req.headers.get("x-api-key");
    if (apiKey !== process.env.CRON_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Find listings expiring in 7 days that haven't been reminded
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const twoDaysFromNow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

    const expiringListings = await ListingExpiry.find({
      expiresAt: {
        $gte: twoDaysFromNow,
        $lte: sevenDaysFromNow,
      },
      isActive: true,
      $or: [
        { lastReminderAt: null },
        {
          lastReminderAt: {
            $lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Not reminded in last 24 hours
          },
        },
      ],
    })
      .populate("property", "address price")
      .populate("owner", "email name");

    let emailsSent = 0;

    for (const listing of expiringListings) {
      try {
        const owner = listing.owner as any;
        const property = listing.property as any;
        const daysUntilExpiry = Math.ceil(
          (listing.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        await sendEmail({
          to: owner.email,
          subject: `Listing Expiring Soon: ${property.address}`,
          html: `
            <h2>Your listing is expiring soon!</h2>
            <p><strong>Property:</strong> ${property.address}</p>
            <p><strong>Expiring in:</strong> ${daysUntilExpiry} days</p>
            <p>Visit your dashboard to renew this listing and keep it visible to buyers.</p>
            <a href="${process.env.NEXTAUTH_URL}/dashboard">Renew Now</a>
          `,
        });

        await ListingExpiry.findByIdAndUpdate(listing._id, {
          lastReminderAt: new Date(),
          $inc: { remindersSent: 1 },
        });

        emailsSent++;
      } catch (err) {
        console.error(`Failed to send reminder for listing ${listing._id}:`, err);
      }
    }

    // Check for auto-renew
    const expiredListings = await ListingExpiry.find({
      expiresAt: { $lt: new Date() },
      isActive: true,
      autoRenew: true,
    }).populate("property");

    let autoRenewed = 0;

    for (const listing of expiredListings) {
      try {
        const newExpiryDate = new Date();
        newExpiryDate.setDate(
          newExpiryDate.getDate() + (listing.renewalDays || 30)
        );

        await ListingExpiry.findByIdAndUpdate(listing._id, {
          expiresAt: newExpiryDate,
          $inc: { renewalCount: 1 },
          lastRenewalAt: new Date(),
        });

        autoRenewed++;
      } catch (err) {
        console.error(`Failed to auto-renew listing ${listing._id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent,
      autoRenewed,
    });
  } catch (err) {
    console.error("Reminder job error:", err);
    return NextResponse.json(
      { error: "Failed to process reminders" },
      { status: 500 }
    );
  }
}
