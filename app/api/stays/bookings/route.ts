import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import Property from "@/models/Property";
import StayBooking from "@/models/StayBooking";
import StayNight from "@/models/StayNight";
import User from "@/models/User";
import { sendEmail } from "@/lib/email";
import { listStayNights, parseStayDate, validStayRange } from "@/lib/stayDates";
import { checkRateLimit } from "@/lib/rateLimit";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  await dbConnect();
  const userId = (session.user as any).id;
  const bookings = await StayBooking.find({ $or: [{ host: userId }, { guest: userId }] })
    .sort({ createdAt: -1 }).limit(100)
    .populate({ path: "property", select: "title location.city price currency pricePeriod", populate: { path: "owner", select: "name email phone" } })
    .populate("guest", "name email phone").lean();
  return NextResponse.json({ bookings: bookings.map((booking: any) => ({
    ...booking,
    _id: booking._id.toString(),
    property: booking.property ? { ...booking.property, _id: booking.property._id.toString() } : null,
    isHost: booking.host.toString() === userId,
    isGuest: (booking.guest?._id?.toString?.() ?? booking.guest.toString()) === userId,
  })) });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Sign in to request a stay." }, { status: 401 });
  const guestId = (session.user as any).id;
  const limit = await checkRateLimit({ key: `stay-request:${guestId}`, limit: 10, windowSeconds: 86_400 });
  if (!limit.allowed) return NextResponse.json({ error: "You've reached today's stay request limit." }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  const propertyId = typeof body?.propertyId === "string" ? body.propertyId : "";
  const checkIn = parseStayDate(typeof body?.checkIn === "string" ? body.checkIn : "");
  const checkOut = parseStayDate(typeof body?.checkOut === "string" ? body.checkOut : "");
  const guestCount = Number(body?.guestCount);
  const guestMessage = typeof body?.message === "string" ? body.message.trim().slice(0, 1000) : "";
  if (!mongoose.isValidObjectId(propertyId) || !checkIn || !checkOut || !validStayRange(checkIn, checkOut) || !Number.isInteger(guestCount) || guestCount < 1 || guestCount > 20) {
    return NextResponse.json({ error: "Choose valid future dates for 1–60 nights and a guest count from 1 to 20." }, { status: 400 });
  }

  await dbConnect();
  const property = await Property.findOne({ _id: propertyId, status: "active", purpose: "shortlet", "reviewEvidence.checkedAt": { $exists: true } }).select("owner title").lean();
  if (!property) return NextResponse.json({ error: "Active short-let listing not found." }, { status: 404 });
  if (property.owner.toString() === guestId) return NextResponse.json({ error: "You can't request your own listing." }, { status: 400 });

  const unavailable = await StayNight.exists({
    property: propertyId,
    day: { $in: listStayNights(checkIn, checkOut) },
    $or: [{ source: "host_block" }, { source: "host_hold", expiresAt: { $gt: new Date() } }],
  });
  if (unavailable) return NextResponse.json({ error: "At least one selected night is unavailable. Choose other dates." }, { status: 409 });

  const booking = await StayBooking.create({
    property: propertyId,
    host: property.owner,
    guest: guestId,
    checkIn,
    checkOut,
    guestCount,
    guestMessage,
    status: "requested",
  });
  const host = await User.findById(property.owner).select("email name").lean();
  if (host?.email) {
    sendEmail({
      to: host.email,
      subject: `Stay request for ${property.title}`,
      html: `<p>Hi ${escapeHtml(host.name ?? "host")},</p><p>You have a new stay request for <strong>${escapeHtml(property.title)}</strong>.</p><p>Dates: ${checkIn.toISOString().slice(0, 10)} to ${checkOut.toISOString().slice(0, 10)} · Guests: ${guestCount}</p><p>Review it in your Fabhouse stay requests. Accepting creates a temporary unpaid hold; it is not a confirmed booking.</p>`,
    }).catch(() => {});
  }
  if (session.user.email) {
    sendEmail({
      to: session.user.email,
      subject: "Your Fabhouse stay request was sent",
      html: `<p>Hi ${escapeHtml(session.user.name ?? "there")},</p><p>Your request for <strong>${escapeHtml(property.title)}</strong> from ${checkIn.toISOString().slice(0, 10)} to ${checkOut.toISOString().slice(0, 10)} was sent to the host.</p><p>This is not a confirmed booking. Fabhouse has not collected a payment.</p>`,
    }).catch(() => {});
  }
  return NextResponse.json({ bookingId: booking._id.toString(), status: booking.status }, { status: 201 });
}
