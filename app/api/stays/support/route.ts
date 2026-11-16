import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { checkRateLimit } from "@/lib/rateLimit";
import StayBooking from "@/models/StayBooking";
import StaySupportTicket from "@/models/StaySupportTicket";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const userId = (session.user as any).id;
  const limit = await checkRateLimit({ key: `stay-support:${userId}`, limit: 5, windowSeconds: 86_400 });
  if (!limit.allowed) return NextResponse.json({ error: "You've reached today's support request limit." }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const category = body?.category;
  if (typeof body?.bookingId !== "string" || !mongoose.isValidObjectId(body.bookingId) || message.length < 10 || message.length > 2000 || !["booking", "payment", "safety", "listing", "other"].includes(category)) {
    return NextResponse.json({ error: "Choose a category and provide details between 10 and 2,000 characters." }, { status: 400 });
  }
  await dbConnect();
  const booking = await StayBooking.findOne({ _id: body.bookingId, $or: [{ host: userId }, { guest: userId }] }).select("_id").lean();
  if (!booking) return NextResponse.json({ error: "Stay request not found." }, { status: 404 });
  const ticket = await StaySupportTicket.create({ booking: booking._id, reporter: userId, category, message });
  return NextResponse.json({ ticketId: ticket._id.toString(), status: ticket.status }, { status: 201 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  await dbConnect();
  const isAdmin = (session.user as any).role === "admin";
  const ticketQuery = StaySupportTicket.find(isAdmin ? {} : { reporter: (session.user as any).id })
    .sort({ createdAt: isAdmin ? 1 : -1 }).limit(200)
    .populate("booking", "property checkIn checkOut status")
    .populate("reporter", "name email")
    .populate({ path: "booking", populate: { path: "property", select: "title" } });
  if (!isAdmin) ticketQuery.select("-staffNote -assignedTo");
  const tickets = await ticketQuery.lean();
  return NextResponse.json({ tickets });
}
