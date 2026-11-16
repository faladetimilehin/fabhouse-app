import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import Property from "@/models/Property";
import User from "@/models/User";
import { sendEmail, listingApprovedEmail, listingRejectedEmail } from "@/lib/email";
import { notifyMatchingSearchAlerts } from "@/lib/searchAlerts";
import { logAdminAction } from "@/lib/auditLog";
import ListingExpiry from "@/models/ListingExpiry";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  const { status, reason } = await req.json();
  if (!["active", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  await dbConnect();
  const property = await Property.findByIdAndUpdate(id, { status }, { new: true });
  if (!property) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const owner = await User.findById(property.owner);
  if (owner?.email) {
    const { subject, html } =
      status === "active"
        ? listingApprovedEmail(property.title)
        : listingRejectedEmail(property.title, reason);
    sendEmail({ to: owner.email, subject, html }).catch(() => {});
  }

  if (status === "active") {
    await ListingExpiry.updateOne(
      { property: property._id },
      {
        $setOnInsert: {
          property: property._id,
          owner: property.owner,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isActive: true,
        },
      },
      { upsert: true }
    );
    notifyMatchingSearchAlerts(property as any).catch(() => {});
  }

  logAdminAction({
    adminId: (session!.user as any).id,
    adminName: session!.user!.name ?? "Admin",
    action: status === "active" ? "listing_approved" : "listing_rejected",
    targetType: "listing",
    targetId: property._id.toString(),
    targetLabel: property.title,
    reason,
  }).catch(() => {});

  return NextResponse.json({ property });
}
