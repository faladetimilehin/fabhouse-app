import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import StaySupportTicket from "@/models/StaySupportTicket";
import User from "@/models/User";
import { sendEmail } from "@/lib/email";

const schema = z.object({ status: z.enum(["open", "in_progress", "resolved"]), staffNote: z.string().trim().max(2000).optional(), staffResponse: z.string().trim().max(2000).optional() });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "admin") return NextResponse.json({ error: "Admins only." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid support update." }, { status: 400 });
  const { id } = await params;
  await dbConnect();
  const ticket = await StaySupportTicket.findByIdAndUpdate(id, { $set: { ...parsed.data, assignedTo: (session!.user as any).id } }, { new: true });
  if (!ticket) return NextResponse.json({ error: "Support ticket not found." }, { status: 404 });
  if (parsed.data.staffResponse) {
    const user = await User.findById(ticket.reporter).select("email name").lean();
    if (user?.email) {
      const response = parsed.data.staffResponse.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
      sendEmail({ to: user.email, subject: "Fabhouse support updated your stay request", html: `<p>Hi ${user.name ?? "there"},</p><p>Your stay support request is now <strong>${ticket.status.replace("_", " ")}</strong>.</p><p>${response}</p><p>Reply to this email if you need more help.</p>` }).catch(() => {});
    }
  }
  return NextResponse.json({ status: ticket.status });
}
