import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { dbConnect } from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import AgentReview from "@/models/AgentReview";
import User from "@/models/User";
import Property from "@/models/Property";
import mongoose from "mongoose";

/**
 * GET - Fetch reviews for an agent
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const searchParams = req.nextUrl.searchParams;
    const agentId = searchParams.get("agentId");
    const propertyId = searchParams.get("propertyId");

    if (!agentId) {
      return NextResponse.json(
        { error: "agentId is required" },
        { status: 400 }
      );
    }

    const agent = new mongoose.Types.ObjectId(agentId);

    let query: any = { agent };

    if (propertyId) {
      query.property = new mongoose.Types.ObjectId(propertyId);
    }

    const reviews = await AgentReview.find(query)
      .populate("reviewer", "name email image")
      .sort({ createdAt: -1 })
      .limit(50);

    // Calculate aggregate stats
    const stats = await AgentReview.aggregate([
      { $match: { agent } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: "$rating" },
          avgCommunication: { $avg: "$categories.communication" },
          avgResponsiveness: { $avg: "$categories.responsiveness" },
          avgAccuracy: { $avg: "$categories.accuracy" },
          avgProfessionalism: { $avg: "$categories.professionalism" },
        },
      },
    ]);

    // Rating distribution
    const distribution = await AgentReview.aggregate([
      { $match: { agent } },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    return NextResponse.json({
      reviews,
      stats: stats[0] || {
        totalReviews: 0,
        averageRating: 0,
        avgCommunication: 0,
        avgResponsiveness: 0,
        avgAccuracy: 0,
        avgProfessionalism: 0,
      },
      distribution: distribution.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    });
  } catch (err) {
    console.error("Fetch reviews error:", err);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new review
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      agentId,
      propertyId,
      rating,
      categories,
      title,
      text,
    } = body;

    if (!agentId || !propertyId || !rating || !title || !text) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be 1-5" },
        { status: 400 }
      );
    }

    await dbConnect();

    const reviewerId = new mongoose.Types.ObjectId((session.user as any).id);
    const agentObjId = new mongoose.Types.ObjectId(agentId);
    const propertyObjId = new mongoose.Types.ObjectId(propertyId);

    // Check if property exists and matches agent
    const property = await Property.findOne({
      _id: propertyObjId,
      owner: agentObjId,
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found or doesn't belong to agent" },
        { status: 404 }
      );
    }

    // Check if user already reviewed this agent
    const existingReview = await AgentReview.findOne({
      reviewer: reviewerId,
      agent: agentObjId,
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this agent" },
        { status: 409 }
      );
    }

    // Create review
    const review = await AgentReview.create({
      reviewer: reviewerId,
      agent: agentObjId,
      property: propertyObjId,
      rating,
      categories: categories || {
        communication: rating,
        responsiveness: rating,
        accuracy: rating,
        professionalism: rating,
      },
      title,
      text,
      verifiedPurchase: true, // Verified since property exists
    });

    return NextResponse.json(
      {
        success: true,
        review: await review.populate("reviewer", "name email image"),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Create review error:", err);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update review (mark as helpful)
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { reviewId, isHelpful } = body;

    if (!reviewId) {
      return NextResponse.json(
        { error: "reviewId is required" },
        { status: 400 }
      );
    }

    await dbConnect();
    const revId = new mongoose.Types.ObjectId(reviewId);

    const update = isHelpful ? { $inc: { helpful: 1 } } : { helpful: 0 };

    const review = await AgentReview.findByIdAndUpdate(revId, update, {
      new: true,
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, review });
  } catch (err) {
    console.error("Update review error:", err);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete review
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const reviewId = searchParams.get("reviewId");

    if (!reviewId) {
      return NextResponse.json(
        { error: "reviewId is required" },
        { status: 400 }
      );
    }

    await dbConnect();
    const revId = new mongoose.Types.ObjectId(reviewId);
    const userId = new mongoose.Types.ObjectId((session.user as any).id);

    const review = await AgentReview.findOne({ _id: revId, reviewer: userId });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    await AgentReview.findByIdAndDelete(revId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete review error:", err);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}
