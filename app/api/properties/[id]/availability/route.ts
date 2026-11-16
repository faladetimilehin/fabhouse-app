import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/mongodb";
import Property from "@/models/Property";
import StayNight from "@/models/StayNight";
import { parseStayDate, DAY_MS } from "@/lib/stayDates";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Short-let listing not found." }, { status: 404 });
  const { searchParams } = new URL(request.url);
  const from = parseStayDate(searchParams.get("from") ?? "");
  const to = parseStayDate(searchParams.get("to") ?? "");
  if (!from || !to || to <= from || to.getTime() - from.getTime() > 120 * DAY_MS) {
    return NextResponse.json({ error: "Choose a valid calendar range of up to 120 days." }, { status: 400 });
  }

  await dbConnect();
  const property = await Property.findOne({ _id: id, status: "active", purpose: "shortlet", "reviewEvidence.checkedAt": { $exists: true } }).select("_id").lean();
  if (!property) return NextResponse.json({ error: "Short-let listing not found." }, { status: 404 });

  const nights = await StayNight.find({ property: id, day: { $gte: from, $lt: to }, $or: [
    { source: "host_block" },
    { source: "host_hold", expiresAt: { $gt: new Date() } },
  ] }).select("day").lean();
  return NextResponse.json({ unavailable: nights.map((night) => night.day.toISOString().slice(0, 10)) });
}
