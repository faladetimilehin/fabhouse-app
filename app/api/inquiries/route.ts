import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import Property from "@/models/Property";
import User from "@/models/User";
import Inquiry from "@/models/Inquiry";
import { sendEmail, newInquiryEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const schema = z.object({
  propertyId: z.string(),
  buyerName: z.string().min(2),
  buyerContact: z.string().min(5),
  message: z.string().min(5),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  guestCount: z.coerce.number().int().min(1).max(20).optional(),
});

// GET /api/inquiries — inquiries across the signed-in agent's own listings,
// optionally filtered to a single property.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  await dbConnect();
  const userId = (session.user as any).id;
  const isAdmin = (session.user as any).role === "admin";

  const { searchParams } = new URL(req.url);
  const propertyId = searchParams.get("property");

  const propertyFilter: Record<string, any> = isAdmin ? {} : { owner: userId };
  if (propertyId) propertyFilter._id = propertyId;

  const ownedProperties = await Property.find(propertyFilter).select("_id title").lean();
  const ownedIds = ownedProperties.map((p: any) => p._id);

  const inquiries = await Inquiry.find({ property: { $in: ownedIds } })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const titleById: Record<string, string> = {};
  ownedProperties.forEach((p: any) => { titleById[p._id.toString()] = p.title; });

  const enriched = inquiries.map((i: any) => ({
    ...i,
    _id: i._id.toString(),
    property: i.property.toString(),
    propertyTitle: titleById[i.property.toString()] ?? "Listing",
  }));

  return NextResponse.json({ inquiries: enriched });
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Max 5 inquiries per IP per 10 minutes — generous for a real buyer
  // messaging a few agents, tight enough to blunt spam scripts.
  const { allowed } = await checkRateLimit({ key: `inquiry:${ip}`, limit: 5, windowSeconds: 600 });
  if (!allowed) {
    return NextResponse.json(
      { error: "You're sending messages too quickly. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { propertyId, buyerName, buyerContact, message, checkIn, checkOut, guestCount } = parsed.data;

  await dbConnect();
  const property = await Property.findById(propertyId);
  if (!property) return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  if (property.status !== "active") return NextResponse.json({ error: "This listing is not available for inquiries." }, { status: 409 });

  let stayDates: { stayCheckIn: Date; stayCheckOut: Date; stayGuestCount: number } | undefined;
  if (property.purpose === "shortlet") {
    if (!checkIn || !checkOut || !guestCount) {
      return NextResponse.json({ error: "Choose check-in, check-out, and guest count for a short-let enquiry." }, { status: 400 });
    }
    const stayCheckIn = new Date(`${checkIn}T00:00:00.000Z`);
    const stayCheckOut = new Date(`${checkOut}T00:00:00.000Z`);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const nights = (stayCheckOut.getTime() - stayCheckIn.getTime()) / 86_400_000;
    if (
      stayCheckIn.toISOString().slice(0, 10) !== checkIn ||
      stayCheckOut.toISOString().slice(0, 10) !== checkOut ||
      stayCheckIn < today || nights < 1 || nights > 60
    ) {
      return NextResponse.json({ error: "Choose future dates for a stay of 1 to 60 nights." }, { status: 400 });
    }
    stayDates = { stayCheckIn, stayCheckOut, stayGuestCount: guestCount };
  } else if (checkIn || checkOut || guestCount !== undefined) {
    return NextResponse.json({ error: "Stay dates can only be sent for short-let listings." }, { status: 400 });
  }

  const buyerSession = await getServerSession(authOptions);
  await Inquiry.create({
    property: propertyId,
    buyerUser: (buyerSession?.user as any)?.id,
    buyerName,
    buyerContact,
    message,
    ...stayDates,
  });

  const owner = await User.findById(property.owner);
  if (owner?.email) {
    const { subject, html } = newInquiryEmail(property.title, buyerName, buyerContact, message, stayDates && {
      checkIn: stayDates.stayCheckIn.toISOString().slice(0, 10),
      checkOut: stayDates.stayCheckOut.toISOString().slice(0, 10),
      guests: stayDates.stayGuestCount,
    });
    sendEmail({ to: owner.email, subject, html }).catch(() => {});
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
