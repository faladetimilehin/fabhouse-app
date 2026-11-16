import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import Property from "@/models/Property";
import Inquiry from "@/models/Inquiry";

/**
 * NDPR data access / portability: lets a signed-in user download every
 * piece of personal data Fabhouse holds about them, in one structured
 * JSON file. No admin involvement required.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  await dbConnect();
  const userId = (session.user as any).id;

  const user = await User.findById(userId).select("-passwordHash -resetPasswordTokenHash").lean();
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  const listings = await Property.find({ owner: userId }).lean();
  const listingIds = listings.map((l: any) => l._id);

  // Inquiries received on this user's own listings (as an agent/developer).
  const inquiriesReceived = await Inquiry.find({ property: { $in: listingIds } }).lean();

  const exportData = {
    exportedAt: new Date().toISOString(),
    account: user,
    listings,
    inquiriesReceivedOnMyListings: inquiriesReceived,
    note:
      "This export contains all personal data and content associated with your Fabhouse account, provided under your NDPR data portability and access rights.",
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="fabhouse-my-data-${userId}.json"`,
    },
  });
}
