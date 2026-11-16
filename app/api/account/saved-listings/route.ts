import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import Property from "@/models/Property";

const toggleSchema = z.object({ propertyId: z.string() });

// GET /api/account/saved-listings — the signed-in user's saved listings, full data.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  await dbConnect();
  const user = await User.findById((session.user as any).id).select("savedListings").lean();
  const savedIds = (user as any)?.savedListings ?? [];

  const listings = await Property.find({ _id: { $in: savedIds }, status: "active" })
    .sort({ createdAt: -1 })
    .populate("owner", "name isVerified")
    .lean();

  return NextResponse.json({ listings });
}

// POST /api/account/saved-listings — toggle save/unsave for a listing.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await req.json();
  const parsed = toggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  await dbConnect();
  const userId = (session.user as any).id;
  const user = await User.findById(userId);
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  const propertyId = parsed.data.propertyId;
  const alreadySaved = user.savedListings.some((id) => id.toString() === propertyId);

  if (alreadySaved) {
    user.savedListings = user.savedListings.filter((id) => id.toString() !== propertyId);
  } else {
    user.savedListings.push(propertyId as any);
  }

  await user.save();

  return NextResponse.json({ saved: !alreadySaved });
}
