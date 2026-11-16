import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { dbConnect } from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import NotificationPreference from "@/models/NotificationPreference";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const userId = new mongoose.Types.ObjectId((session.user as any).id);

    let preferences = await NotificationPreference.findOne({ userId });

    // Create default preferences if not found
    if (!preferences) {
      preferences = await NotificationPreference.create({ userId });
    }

    return NextResponse.json(preferences);
  } catch (err) {
    console.error("Get notification preferences error:", err);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await dbConnect();
    const userId = new mongoose.Types.ObjectId((session.user as any).id);

    const preferences = await NotificationPreference.findOneAndUpdate(
      { userId },
      { $set: body },
      { new: true, upsert: true }
    );

    return NextResponse.json(preferences);
  } catch (err) {
    console.error("Update notification preferences error:", err);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
