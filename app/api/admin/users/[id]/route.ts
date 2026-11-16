import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import { logAdminAction } from "@/lib/auditLog";

const schema = z.object({
  isVerified: z.boolean().optional(),
  isSuspended: z.boolean().optional(),
  suspendedReason: z.string().optional(),
  role: z.enum(["buyer", "agent", "developer", "admin"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  const isSelf = id === (session!.user as any).id;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (isSelf && (parsed.data.isSuspended !== undefined || parsed.data.role !== undefined)) {
    return NextResponse.json(
      { error: "You can't suspend or change the role of your own account from here." },
      { status: 400 }
    );
  }

  await dbConnect();
  const existing = await User.findById(id);
  if (!existing) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (parsed.data.isVerified === true && existing.verificationStatus !== "approved") {
    return NextResponse.json({ error: "Review identity documents before adding the verified badge." }, { status: 409 });
  }

  const update: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.isVerified === false) update.verificationStatus = "none";
  const updated = await User.findByIdAndUpdate(id, update, { new: true })
    .select("name email role isVerified isSuspended verificationStatus")
    .lean();

  if (!updated) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const adminId = (session!.user as any).id;
  const adminName = session!.user!.name ?? "Admin";
  const targetLabel = `${updated.name} (${updated.email})`;

  if (parsed.data.isVerified !== undefined) {
    logAdminAction({
      adminId,
      adminName,
      action: parsed.data.isVerified ? "user_verified" : "user_unverified",
      targetType: "user",
      targetId: updated._id.toString(),
      targetLabel,
    }).catch(() => {});
  }
  if (parsed.data.isSuspended !== undefined) {
    logAdminAction({
      adminId,
      adminName,
      action: parsed.data.isSuspended ? "user_suspended" : "user_unsuspended",
      targetType: "user",
      targetId: updated._id.toString(),
      targetLabel,
      reason: parsed.data.suspendedReason,
    }).catch(() => {});
  }

  return NextResponse.json({ user: updated });
}
