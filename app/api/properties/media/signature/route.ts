import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import { checkRateLimit } from "@/lib/rateLimit";
import { createListingUploadSignature } from "@/lib/cloudinary";

const signatureRequestSchema = z.object({
  resourceType: z.enum(["image", "video"]),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Sign in to upload listing media." }, { status: 401 });
  if (!["agent", "developer", "admin"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Only agents, developers, or admins can upload listing media." }, { status: 403 });
  }

  const parsed = signatureRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid media type." }, { status: 400 });

  const userId = (session.user as any).id as string;
  const rateLimit = await checkRateLimit({ key: `listing-media-signature:${userId}`, limit: 50, windowSeconds: 86_400 });
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Daily media upload limit reached. Try again tomorrow." }, { status: 429 });
  }

  await dbConnect();
  const user = await User.findById(userId).select("_id isSuspended");
  if (!user || user.isSuspended) return NextResponse.json({ error: "Active account required." }, { status: 403 });

  try {
    return NextResponse.json(createListingUploadSignature(user._id.toString(), parsed.data.resourceType));
  } catch (error) {
    console.error("Could not sign listing media upload:", error);
    return NextResponse.json({ error: "Secure media uploads are not configured." }, { status: 503 });
  }
}
