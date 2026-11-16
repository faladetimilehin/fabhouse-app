import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import Property from "@/models/Property";
import Inquiry from "@/models/Inquiry";
import SearchAlert from "@/models/SearchAlert";
import AgentReview from "@/models/AgentReview";
import PlanPayment from "@/models/PlanPayment";
import StayBooking from "@/models/StayBooking";
import StaySupportTicket from "@/models/StaySupportTicket";

/**
 * Lets a signed-in user download account and listing data associated with
 * their account in one structured JSON file.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  await dbConnect();
  const userId = (session.user as any).id;

  const user = await User.findById(userId)
    .select("-passwordHash -resetPasswordTokenHash -emailVerificationTokenHash -processedPlanPaymentReferences -verificationDocUrl -verificationDocument.publicId")
    .lean();
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  const listings = await Property.find({ owner: userId }).lean();
  const listingIds = listings.map((l: any) => l._id);

  // Inquiries received on this user's own listings (as an agent/developer).
  const inquiriesReceived = await Inquiry.find({ property: { $in: listingIds } }).lean();
  const inquiriesSent = await Inquiry.find({
    $or: [
      { buyerUser: userId },
      { buyerContact: { $in: [user.email, user.phone].filter(Boolean) } },
    ],
  }).lean();
  const savedSearches = await SearchAlert.find({ user: userId }).lean();
  const reviewsWritten = await AgentReview.find({ reviewer: userId }).lean();
  const planPayments = await PlanPayment.find({ user: userId }).lean();
  const stayBookings = await StayBooking.find({ $or: [{ host: userId }, { guest: userId }] }).lean();
  const staySupportTickets = await StaySupportTicket.find({ reporter: userId }).lean();

  const exportData = {
    exportedAt: new Date().toISOString(),
    account: user,
    listings,
    inquiriesReceivedOnMyListings: inquiriesReceived,
    inquiriesSent,
    savedSearches,
    reviewsWritten,
    planPayments,
    stayBookings,
    staySupportTickets,
    note:
      "This export contains account, listing, inquiry, saved-search, review, and plan-payment data associated with your Fabhouse account. Authentication secrets are excluded.",
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="fabhouse-my-data-${userId}.json"`,
    },
  });
}
