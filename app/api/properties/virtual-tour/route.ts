import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { dbConnect } from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import VirtualTour from "@/models/VirtualTour";
import Property from "@/models/Property";
import mongoose from "mongoose";

/**
 * GET - Fetch virtual tour for a property
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const searchParams = req.nextUrl.searchParams;
    const propertyId = searchParams.get("propertyId");

    if (!propertyId) {
      return NextResponse.json(
        { error: "propertyId is required" },
        { status: 400 }
      );
    }

    const tour = await VirtualTour.findOne({
      property: new mongoose.Types.ObjectId(propertyId),
    }).populate("owner", "name email");

    if (!tour) {
      return NextResponse.json(
        { error: "Virtual tour not found" },
        { status: 404 }
      );
    }

    // Increment views
    await VirtualTour.findByIdAndUpdate(tour._id, {
      $inc: { views: 1 },
    });

    return NextResponse.json({ tour });
  } catch (err) {
    console.error("Fetch tour error:", err);
    return NextResponse.json({ error: "Failed to fetch tour" }, { status: 500 });
  }
}

/**
 * POST - Create virtual tour
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { propertyId, title, description, photos, sequence, matterportUrl } =
      body;

    if (!propertyId || !title || !photos || photos.length === 0) {
      return NextResponse.json(
        { error: "propertyId, title, and photos are required" },
        { status: 400 }
      );
    }

    await dbConnect();
    const userId = new mongoose.Types.ObjectId((session.user as any).id);
    const propId = new mongoose.Types.ObjectId(propertyId);

    // Verify ownership
    const property = await Property.findOne({ _id: propId, owner: userId });
    if (!property) {
      return NextResponse.json(
        { error: "Property not found or not owned by you" },
        { status: 404 }
      );
    }

    // Create tour
    const tour = await VirtualTour.create({
      property: propId,
      owner: userId,
      title,
      description,
      photos,
      sequence:
        sequence ||
        photos.map((_photo: unknown, idx: number) => ({ photoIndex: idx })),
      matterportUrl,
    });

    return NextResponse.json(
      { success: true, tour },
      { status: 201 }
    );
  } catch (err) {
    console.error("Create tour error:", err);
    return NextResponse.json(
      { error: "Failed to create tour" },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update virtual tour
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { tourId, title, description, photos, sequence, matterportUrl } =
      body;

    if (!tourId) {
      return NextResponse.json({ error: "tourId is required" }, { status: 400 });
    }

    await dbConnect();
    const userId = new mongoose.Types.ObjectId((session.user as any).id);
    const tid = new mongoose.Types.ObjectId(tourId);

    // Verify ownership
    const tour = await VirtualTour.findOne({ _id: tid, owner: userId });
    if (!tour) {
      return NextResponse.json(
        { error: "Tour not found or not owned by you" },
        { status: 404 }
      );
    }

    const updated = await VirtualTour.findByIdAndUpdate(
      tid,
      {
        title: title || tour.title,
        description,
        photos: photos || tour.photos,
        sequence: sequence || tour.sequence,
        matterportUrl,
      },
      { new: true }
    );

    return NextResponse.json({ success: true, tour: updated });
  } catch (err) {
    console.error("Update tour error:", err);
    return NextResponse.json(
      { error: "Failed to update tour" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete virtual tour
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const tourId = searchParams.get("tourId");

    if (!tourId) {
      return NextResponse.json({ error: "tourId is required" }, { status: 400 });
    }

    await dbConnect();
    const userId = new mongoose.Types.ObjectId((session.user as any).id);
    const tid = new mongoose.Types.ObjectId(tourId);

    const tour = await VirtualTour.findOne({ _id: tid, owner: userId });
    if (!tour) {
      return NextResponse.json(
        { error: "Tour not found" },
        { status: 404 }
      );
    }

    await VirtualTour.findByIdAndDelete(tid);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete tour error:", err);
    return NextResponse.json(
      { error: "Failed to delete tour" },
      { status: 500 }
    );
  }
}
