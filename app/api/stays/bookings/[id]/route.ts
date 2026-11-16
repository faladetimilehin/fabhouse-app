import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import StayBooking from "@/models/StayBooking";
import StayNight from "@/models/StayNight";
import Property from "@/models/Property";
import User from "@/models/User";
import { sendEmail } from "@/lib/email";
import { listStayNights, validStayRange } from "@/lib/stayDates";
import { ensureStayNightIndexes } from "@/lib/stayNightIndexes";

const HOLD_MS = 24 * 60 * 60 * 1000;

async function notifyUser(userId: string, subject: string, bookingId: string, statusText: string) {
  const user = await User.findById(userId).select("name email").lean();
  if (!user?.email) return;
  const name = (user.name ?? "there").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
  sendEmail({ to: user.email, subject, html: `<p>Hi ${name},</p><p>${statusText}</p><p>Request reference: ${bookingId}</p><p>Sign in to Fabhouse to view the latest status. No stay payment has been taken.</p>` }).catch(() => {});
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Stay request not found." }, { status: 404 });
  const body = await request.json().catch(() => ({}));
  const action = body?.action;
  if (!(["accept", "decline", "cancel"] as unknown[]).includes(action)) return NextResponse.json({ error: "Choose a valid stay-request action." }, { status: 400 });

  await dbConnect();
  const userId = (session.user as any).id;
  const booking = await StayBooking.findById(id);
  if (!booking) return NextResponse.json({ error: "Stay request not found." }, { status: 404 });

  if (action === "accept" || action === "decline") {
    if (booking.host.toString() !== userId) return NextResponse.json({ error: "Only the host can decide this request." }, { status: 403 });
    if (booking.status !== "requested") return NextResponse.json({ error: "This request is no longer awaiting a host decision." }, { status: 409 });
    if (action === "accept" && !validStayRange(booking.checkIn, booking.checkOut)) {
      return NextResponse.json({ error: "The requested dates have passed or are invalid. Ask the guest to choose new dates." }, { status: 409 });
    }
    if (action === "decline") {
      const updated = await StayBooking.findOneAndUpdate({ _id: id, host: userId, status: "requested" }, { $set: { status: "declined" } }, { new: true });
      if (updated) await notifyUser(booking.guest.toString(), "Update on your Fabhouse stay request", id, "The host declined your requested dates.");
      return updated ? NextResponse.json({ status: updated.status }) : NextResponse.json({ error: "Request changed; refresh and try again." }, { status: 409 });
    }

    const property = await Property.findOne({ _id: booking.property, owner: userId, status: "active", purpose: "shortlet", "reviewEvidence.checkedAt": { $exists: true } }).select("_id").lean();
    if (!property) return NextResponse.json({ error: "The listing must be active to accept a request." }, { status: 409 });
    await ensureStayNightIndexes();
    const mongoSession = await mongoose.startSession();
    try {
      await mongoSession.withTransaction(async () => {
        const now = new Date();
        const current = await StayBooking.findOne({ _id: id, host: userId, status: "requested" }).session(mongoSession);
        if (!current) throw new Error("request_changed");
        await StayNight.deleteMany({ property: booking.property, source: "host_hold", expiresAt: { $lte: now } }).session(mongoSession);
        const holdExpiresAt = new Date(now.getTime() + HOLD_MS);
        await StayNight.insertMany(listStayNights(booking.checkIn, booking.checkOut).map((day) => ({
          property: booking.property, day, source: "host_hold", booking: booking._id, expiresAt: holdExpiresAt,
        })), { session: mongoSession, ordered: true });
        current.status = "accepted_unpaid";
        current.holdExpiresAt = holdExpiresAt;
        await current.save({ session: mongoSession });
      });
      await notifyUser(booking.guest.toString(), "The host accepted your Fabhouse stay request", id, "The host accepted your request and dates are held for 24 hours. This is unpaid and not a confirmed booking.");
      return NextResponse.json({ status: "accepted_unpaid", holdExpiresAt: new Date(Date.now() + HOLD_MS).toISOString() });
    } catch {
      return NextResponse.json({ error: "Those nights are no longer available or the request changed. Refresh the calendar." }, { status: 409 });
    } finally {
      await mongoSession.endSession();
    }
  }

  if (![booking.guest.toString(), booking.host.toString()].includes(userId)) return NextResponse.json({ error: "Only the guest or host can cancel this request." }, { status: 403 });
  if (!["requested", "accepted_unpaid"].includes(booking.status)) return NextResponse.json({ error: "This stay request can no longer be cancelled here." }, { status: 409 });

  const mongoSession = await mongoose.startSession();
  try {
    await mongoSession.withTransaction(async () => {
      const updated = await StayBooking.findOneAndUpdate({ _id: id, status: { $in: ["requested", "accepted_unpaid"] } }, { $set: { status: "cancelled" } }, { new: true, session: mongoSession });
      if (!updated) throw new Error("request_changed");
      await StayNight.deleteMany({ booking: booking._id, source: "host_hold" }).session(mongoSession);
    });
    const otherParty = booking.guest.toString() === userId ? booking.host.toString() : booking.guest.toString();
    await notifyUser(otherParty, "A Fabhouse stay request was cancelled", id, "The guest or host cancelled this unpaid request, and its date hold has been released.");
    return NextResponse.json({ status: "cancelled", paymentStatus: "not_collected" });
  } catch {
    return NextResponse.json({ error: "Request changed; refresh and try again." }, { status: 409 });
  } finally {
    await mongoSession.endSession();
  }
}
