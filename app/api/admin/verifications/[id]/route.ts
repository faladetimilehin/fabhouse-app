import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import { sendEmail } from "@/lib/email";
import { logAdminAction } from "@/lib/auditLog";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  const { decision, reason } = await req.json();
  if (!["approved", "rejected"].includes(decision)) {
    return NextResponse.json({ error: "Invalid decision." }, { status: 400 });
  }

  await dbConnect();
  const user = await User.findById(id);
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  user.verificationStatus = decision;
  user.isVerified = decision === "approved";
  user.verificationRejectedReason = decision === "rejected" ? reason : undefined;
  await user.save();

  await sendEmail({
    to: user.email,
    subject: decision === "approved" ? "You're verified on Fabhouse" : "Your Fabhouse verification needs another look",
    html:
      decision === "approved"
        ? `<p>Hi ${user.name},</p><p>Your account is now verified on Fabhouse. The verified badge will now show on your profile and listings.</p>`
        : `<p>Hi ${user.name},</p><p>We couldn't verify your account with the document submitted.${reason ? ` Reason: ${reason}` : ""}</p><p>You can submit a new document from your account settings any time.</p>`,
  }).catch(() => {});

  logAdminAction({
    adminId: (session!.user as any).id,
    adminName: session!.user!.name ?? "Admin",
    action: decision === "approved" ? "verification_approved" : "verification_rejected",
    targetType: "user",
    targetId: user._id.toString(),
    targetLabel: `${user.name} (${user.email})`,
    reason,
  }).catch(() => {});

  return NextResponse.json({ verificationStatus: user.verificationStatus, isVerified: user.isVerified });
}
