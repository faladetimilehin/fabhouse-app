import { NextRequest, NextResponse } from "next/server";
import { processListingExpiryAutomation } from "@/lib/listingExpiryAutomation";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Cron is not configured" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json(await processListingExpiryAutomation());
  } catch (error) {
    console.error("Listing expiry cron failed:", error);
    return NextResponse.json({ error: "Listing expiry job failed" }, { status: 500 });
  }
}
