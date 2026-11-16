import { NextRequest, NextResponse } from "next/server";
import { processListingExpiryAutomation } from "@/lib/listingExpiryAutomation";
import { cleanupAbandonedVerificationDocuments } from "@/lib/verificationCleanup";
import { expireUnpaidStayHolds } from "@/lib/stayBookingExpiry";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Cron is not configured" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [listings, deletedVerificationDocuments, expiredStayHolds] = await Promise.all([
      processListingExpiryAutomation(),
      cleanupAbandonedVerificationDocuments(),
      expireUnpaidStayHolds(),
    ]);
    return NextResponse.json({ listings, deletedVerificationDocuments, expiredStayHolds });
  } catch (error) {
    console.error("Listing expiry cron failed:", error);
    return NextResponse.json({ error: "Listing expiry job failed" }, { status: 500 });
  }
}
