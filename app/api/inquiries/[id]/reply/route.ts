import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import Inquiry from "@/models/Inquiry";
import Property from "@/models/Property";
import { sendEmail } from "@/lib/email";

const schema = z.object({ reply: z.string().min(2) });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await dbConnect();
  const inquiry = await Inquiry.findById(params.id);
  if (!inquiry) return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });

  const property = await Property.findById(inquiry.property);
  if (!property) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  const isOwner = property.owner.toString() === (session.user as any).id;
  const isAdmin = (session.user as any).role === "admin";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "You don't have permission to reply to this inquiry." }, { status: 403 });
  }

  inquiry.reply = parsed.data.reply;
  inquiry.repliedAt = new Date();
  await inquiry.save();

  let emailed = false;
  if (EMAIL_RE.test(inquiry.buyerContact)) {
    await sendEmail({
      to: inquiry.buyerContact,
      subject: `Re: your inquiry about ${property.title}`,
      html: `
        <p>Hi ${inquiry.buyerName},</p>
        <p>You messaged about <strong>${property.title}</strong> on Fabhouse. Here's the reply from the agent:</p>
        <blockquote style="border-left:3px solid #C9A24B;margin:0;padding-left:12px;color:#1B2A4A;">${parsed.data.reply}</blockquote>
        <p style="margin-top:16px;">Your original message: "${inquiry.message}"</p>
      `,
    }).catch(() => {});
    emailed = true;
  }

  return NextResponse.json({ success: true, emailed });
}
