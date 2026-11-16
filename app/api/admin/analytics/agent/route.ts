import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { dbConnect } from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import Property from "@/models/Property";
import Inquiry from "@/models/Inquiry";
import mongoose from "mongoose";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (!["agent", "developer", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    await dbConnect();
    const userId = new mongoose.Types.ObjectId((session.user as any).id);

    // Get date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // 1. Total listings
    const totalListings = await Property.countDocuments({ owner: userId });
    const activeListings = await Property.countDocuments({
      owner: userId,
      status: "active",
    });

    // 2. Total inquiries (all time)
    const totalInquiries = await Inquiry.countDocuments({ agent: userId });

    // 3. Inquiries this month
    const thisMonthInquiries = await Inquiry.countDocuments({
      agent: userId,
      createdAt: { $gte: today },
    });

    // 4. Inquiries last 30 days
    const lastMonthInquiries = await Inquiry.countDocuments({
      agent: userId,
      createdAt: { $gte: thirtyDaysAgo },
    });

    // 5. Property views (aggregate from PropertyView collection)
    const totalViews = await mongoose.connection.collection("PropertyViews").aggregate([
      {
        $lookup: {
          from: "properties",
          localField: "propertyId",
          foreignField: "_id",
          as: "property",
        },
      },
      {
        $match: {
          "property.owner": userId,
        },
      },
      {
        $count: "total",
      },
    ]).toArray();

    const views = totalViews[0]?.total || 0;

    // 6. Views last 30 days
    const viewsLastMonth = await mongoose.connection.collection("PropertyViews").aggregate([
      {
        $lookup: {
          from: "properties",
          localField: "propertyId",
          foreignField: "_id",
          as: "property",
        },
      },
      {
        $match: {
          "property.owner": userId,
          viewedAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $count: "total",
      },
    ]).toArray();

    const viewsMonth = viewsLastMonth[0]?.total || 0;

    // 7. Conversion rate (inquiries / views)
    const conversionRate = views > 0 ? ((lastMonthInquiries / viewsMonth) * 100).toFixed(2) : "0";

    // 8. Sold/Rented properties
    const sold = await Property.countDocuments({
      owner: userId,
      status: "sold",
    });

    const rented = await Property.countDocuments({
      owner: userId,
      status: "rented",
    });

    // 9. Property type breakdown
    const byType = await Property.aggregate([
      { $match: { owner: userId } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);

    // 10. Purpose breakdown (sale vs rent)
    const byPurpose = await Property.aggregate([
      { $match: { owner: userId } },
      { $group: { _id: "$purpose", count: { $sum: 1 } } },
    ]);

    // 11. Featured listings
    const featured = await Property.countDocuments({
      owner: userId,
      isFeatured: true,
    });

    // 12. Average price
    const priceStats = await Property.aggregate([
      { $match: { owner: userId } },
      {
        $group: {
          _id: null,
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
    ]);

    // 13. Properties by status
    const byStatus = await Property.aggregate([
      { $match: { owner: userId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    return NextResponse.json({
      summary: {
        totalListings,
        activeListings,
        totalInquiries,
        thisMonthInquiries,
        lastMonthInquiries,
        totalViews: views,
        viewsLastMonth: viewsMonth,
        conversionRate: `${conversionRate}%`,
        sold,
        rented,
        featured,
      },
      pricing: priceStats[0] || { avgPrice: 0, minPrice: 0, maxPrice: 0 },
      breakdown: {
        byType: byType.reduce((acc: any, item: any) => {
          acc[item._id || "unknown"] = item.count;
          return acc;
        }, {}),
        byPurpose: byPurpose.reduce((acc: any, item: any) => {
          acc[item._id || "unknown"] = item.count;
          return acc;
        }, {}),
        byStatus: byStatus.reduce((acc: any, item: any) => {
          acc[item._id || "unknown"] = item.count;
          return acc;
        }, {}),
      },
    });
  } catch (err) {
    console.error("Analytics error:", err);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
