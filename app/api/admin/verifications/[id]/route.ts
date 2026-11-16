import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import { sendEmail } from "@/lib/email";
import { logAdminAction } from "@/lib/auditLog";
import { z } from "zod";
import { deletePrivateVerificationDocument, deleteCloudinaryImages } from "@/lib/cloudinary";

const decisionSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  reason: z.string().trim().max(500).optional(),
});

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  const parsed = decisionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid verification decision." }, { status: 400 });
  const { decision, reason } = parsed.data;

  await dbConnect();
  const user = await User.findById(id);
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  if (user.verificationStatus !== "pending") {
    return NextResponse.json({ error: "This verification is no longer pending." }, { status: 409 });
  }

  const privateDocument = user.verificationDocument;
  const legacyDocumentUrl = user.verificationDocUrl;
  user.verificationStatus = decision;
  user.isVerified = decision === "approved";
  user.verificationRejectedReason = decision === "rejected" ? reason : undefined;
  user.verificationDocument = undefined;
  user.verificationDocUrl = undefined;
  await user.save();

  if (privateDocument) await deletePrivateVerificationDocument(privateDocument);
  if (legacyDocumentUrl) await deleteCloudinaryImages([legacyDocumentUrl]);

  await sendEmail({
    to: user.email,
    subject: decision === "approved" ? "You're verified on Fabhouse" : "Your Fabhouse verification needs another look",
    html:
      decision === "approved"
        ? `<p>Hi ${escapeHtml(user.name)},</p><p>Your submitted identity document has been reviewed by Fabhouse. The identity-checked badge will show on your profile and listings. This does not verify property title or guarantee listing details.</p>`
        : `<p>Hi ${escapeHtml(user.name)},</p><p>We couldn't verify your account with the document submitted.${reason ? ` Reason: ${escapeHtml(reason)}` : ""}</p><p>You can submit a new document from your account settings any time.</p>`,
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
