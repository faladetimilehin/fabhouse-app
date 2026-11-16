import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import Property from "@/models/Property";
import Inquiry from "@/models/Inquiry";
import SearchAlert from "@/models/SearchAlert";
import AgentReview from "@/models/AgentReview";
import StayBooking from "@/models/StayBooking";
import StayNight from "@/models/StayNight";
import StaySupportTicket from "@/models/StaySupportTicket";
import { deleteCloudinaryImages, deleteCloudinaryVideos, deletePrivateVerificationDocument } from "@/lib/cloudinary";
import { removeListingFingerprints } from "@/lib/fingerprint";

/**
 * Permanently deletes the signed-in user's account,
 * their listings (and hosted photos/videos), inquiries they sent or
 * received, saved searches, and reviews. Requires re-entering the password as a confirmation
 * step, since this is irreversible.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const password = typeof body?.password === "string" ? body.password : "";

  await dbConnect();
  const userId = (session.user as any).id;
  const user = await User.findById(userId);
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  if (!user.passwordHash.startsWith("oauth:google:")) {
    if (!password) {
      return NextResponse.json({ error: "Enter your password to confirm account deletion." }, { status: 400 });
    }
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }
  }

  const listings = await Property.find({ owner: userId });
  const listingIds = listings.map((l) => l._id);
  const stayBookings = await StayBooking.find({ $or: [{ property: { $in: listingIds } }, { guest: userId }, { host: userId }] }).select("_id").lean();
  const stayBookingIds = stayBookings.map((booking) => booking._id);

  // Clean up hosted media for every listing this user owned.
  for (const listing of listings) {
    await deleteCloudinaryImages(listing.images ?? []).catch(() => {});
    await deleteCloudinaryVideos(listing.videos ?? []).catch(() => {});
    await removeListingFingerprints(listing._id).catch(() => {});
  }
  if (user.verificationDocument) await deletePrivateVerificationDocument(user.verificationDocument);
  if (user.verificationDocUrl) await deleteCloudinaryImages([user.verificationDocUrl]);

  const buyerContacts = [user.email, user.phone].filter(Boolean);
  await Promise.all([
    Inquiry.deleteMany({ $or: [
      { property: { $in: listingIds } },
      { buyerUser: userId },
      { buyerContact: { $in: buyerContacts } },
    ] }),
    SearchAlert.deleteMany({ user: userId }),
    AgentReview.deleteMany({ $or: [{ reviewer: userId }, { agent: userId }] }),
    StaySupportTicket.deleteMany({ $or: [{ reporter: userId }, { booking: { $in: stayBookingIds } }] }),
    StayNight.deleteMany({ $or: [{ property: { $in: listingIds } }, { booking: { $in: stayBookingIds } }] }),
    StayBooking.deleteMany({ _id: { $in: stayBookingIds } }),
  ]);
  await Property.deleteMany({ owner: userId });
  await User.findByIdAndDelete(userId);

  return NextResponse.json({ success: true });
}
