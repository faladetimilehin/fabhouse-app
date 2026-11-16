import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import Property from "@/models/Property";
import StayNight from "@/models/StayNight";
import { parseStayDate, listStayNights, validStayRange } from "@/lib/stayDates";
import { ensureStayNightIndexes } from "@/lib/stayNightIndexes";

export async function POST(request: NextRequest, { params }: { params: Promise<{ propertyId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { propertyId } = await params;
  if (!mongoose.isValidObjectId(propertyId)) return NextResponse.json({ error: "Short-let listing not found." }, { status: 404 });
  const body = await request.json().catch(() => ({}));
  const checkIn = parseStayDate(typeof body?.from === "string" ? body.from : "");
  const checkOut = parseStayDate(typeof body?.to === "string" ? body.to : "");
  if (!checkIn || !checkOut || !validStayRange(checkIn, checkOut, 365)) {
    return NextResponse.json({ error: "Choose future dates up to one year ahead." }, { status: 400 });
  }

  await dbConnect();
  const property = await Property.findOne({ _id: propertyId, owner: (session.user as any).id, purpose: "shortlet" }).select("_id").lean();
  if (!property) return NextResponse.json({ error: "Short-let listing not found." }, { status: 404 });

  await ensureStayNightIndexes();
  const mongoSession = await mongoose.startSession();
  try {
    await mongoSession.withTransaction(async () => {
      await StayNight.deleteMany({ property: propertyId, source: "host_hold", expiresAt: { $lte: new Date() } }).session(mongoSession);
      await StayNight.insertMany(listStayNights(checkIn, checkOut).map((day) => ({
        property: propertyId, day, source: "host_block",
      })), { session: mongoSession, ordered: true });
    });
    return NextResponse.json({ blocked: true });
  } catch {
    return NextResponse.json({ error: "Some nights are already unavailable. Refresh the calendar and try again." }, { status: 409 });
  } finally {
    await mongoSession.endSession();
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ propertyId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { propertyId } = await params;
  if (!mongoose.isValidObjectId(propertyId)) return NextResponse.json({ error: "Short-let listing not found." }, { status: 404 });
  const { searchParams } = new URL(request.url);
  const from = parseStayDate(searchParams.get("from") ?? "");
  const to = parseStayDate(searchParams.get("to") ?? "");
  if (!from || !to || to <= from) return NextResponse.json({ error: "Choose a valid date range." }, { status: 400 });

  await dbConnect();
  const property = await Property.findOne({ _id: propertyId, owner: (session.user as any).id, purpose: "shortlet" }).select("_id").lean();
  if (!property) return NextResponse.json({ error: "Short-let listing not found." }, { status: 404 });
  await StayNight.deleteMany({ property: propertyId, source: "host_block", day: { $gte: from, $lt: to } });
  return NextResponse.json({ unblocked: true });
}
