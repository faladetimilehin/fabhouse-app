import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import Property from "@/models/Property";
import Inquiry from "@/models/Inquiry";
import { deleteCloudinaryImages, deleteCloudinaryVideos } from "@/lib/cloudinary";

/**
 * NDPR right to erasure: permanently deletes the signed-in user's account,
 * their listings (and hosted photos/videos), and inquiries received on
 * those listings. Requires re-entering the password as a confirmation
 * step, since this is irreversible.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { password } = await req.json();
  if (!password) {
    return NextResponse.json({ error: "Enter your password to confirm account deletion." }, { status: 400 });
  }

  await dbConnect();
  const userId = (session.user as any).id;
  const user = await User.findById(userId);
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const listings = await Property.find({ owner: userId });
  const listingIds = listings.map((l) => l._id);

  // Clean up hosted media for every listing this user owned.
  for (const listing of listings) {
    await deleteCloudinaryImages(listing.images ?? []).catch(() => {});
    await deleteCloudinaryVideos(listing.videos ?? []).catch(() => {});
  }

  await Inquiry.deleteMany({ property: { $in: listingIds } });
  await Property.deleteMany({ owner: userId });
  await User.findByIdAndDelete(userId);

  return NextResponse.json({ success: true });
}
