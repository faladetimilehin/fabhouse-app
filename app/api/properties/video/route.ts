import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { dbConnect } from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import VideoListing from "@/models/VideoListing";
import Property from "@/models/Property";
import mongoose from "mongoose";
import { validateListingMedia } from "@/lib/listingMedia";

/**
 * GET - Fetch videos for a property or get trending videos
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const searchParams = req.nextUrl.searchParams;
    const propertyId = searchParams.get("propertyId");
    const trending = searchParams.get("trending");

    if (trending) {
      // Get trending videos (most viewed)
      const videos = await VideoListing.find({ isHighlight: true })
        .sort({ views: -1 })
        .limit(20)
        .populate("property", "address price")
        .populate("owner", "name email");

      return NextResponse.json({ videos });
    }

    if (!propertyId) {
      return NextResponse.json(
        { error: "propertyId or trending param required" },
        { status: 400 }
      );
    }

    const videos = await VideoListing.find({
      property: new mongoose.Types.ObjectId(propertyId),
    })
      .sort({ createdAt: -1 })
      .populate("owner", "name email");

    return NextResponse.json({ videos });
  } catch (err) {
    console.error("Fetch videos error:", err);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create video listing
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { propertyId, title, description, videoUrl, thumbnailUrl, duration } =
      body;

    if (!propertyId || !title || !videoUrl || !duration) {
      return NextResponse.json(
        { error: "propertyId, title, videoUrl, and duration are required" },
        { status: 400 }
      );
    }
    const userId = (session.user as any).id;
    const mediaValidation = await validateListingMedia({
      ownerId: userId,
      videos: [videoUrl],
      images: thumbnailUrl ? [thumbnailUrl] : [],
    });
    if (!mediaValidation.valid) {
      return NextResponse.json({ error: mediaValidation.error }, { status: mediaValidation.status });
    }

    await dbConnect();
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const propId = new mongoose.Types.ObjectId(propertyId);

    // Verify ownership
    const property = await Property.findOne({ _id: propId, owner: userObjectId });
    if (!property) {
      return NextResponse.json(
        { error: "Property not found or not owned by you" },
        { status: 404 }
      );
    }

    const video = await VideoListing.create({
      property: propId,
      owner: userObjectId,
      title,
      description,
      videoUrl,
      thumbnailUrl,
      duration,
    });

    return NextResponse.json(
      { success: true, video },
      { status: 201 }
    );
  } catch (err) {
    console.error("Create video error:", err);
    return NextResponse.json(
      { error: "Failed to create video" },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update video or mark as highlight
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { videoId, title, description, isHighlight } = body;

    if (!videoId) {
      return NextResponse.json({ error: "videoId is required" }, { status: 400 });
    }

    await dbConnect();
    const userId = new mongoose.Types.ObjectId((session.user as any).id);
    const vid = new mongoose.Types.ObjectId(videoId);

    const video = await VideoListing.findOne({ _id: vid, owner: userId });
    if (!video) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    const updated = await VideoListing.findByIdAndUpdate(
      vid,
      {
        title: title || video.title,
        description: description !== undefined ? description : video.description,
        isHighlight: isHighlight !== undefined ? isHighlight : video.isHighlight,
      },
      { new: true }
    );

    return NextResponse.json({ success: true, video: updated });
  } catch (err) {
    console.error("Update video error:", err);
    return NextResponse.json(
      { error: "Failed to update video" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete video listing
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const videoId = searchParams.get("videoId");

    if (!videoId) {
      return NextResponse.json({ error: "videoId is required" }, { status: 400 });
    }

    await dbConnect();
    const userId = new mongoose.Types.ObjectId((session.user as any).id);
    const vid = new mongoose.Types.ObjectId(videoId);

    const video = await VideoListing.findOne({ _id: vid, owner: userId });
    if (!video) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    await VideoListing.findByIdAndDelete(vid);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete video error:", err);
    return NextResponse.json(
      { error: "Failed to delete video" },
      { status: 500 }
    );
  }
}
