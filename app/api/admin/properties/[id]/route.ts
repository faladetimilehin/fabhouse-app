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
import { z } from "zod";

const reviewSchema = z.object({
  status: z.enum(["active", "rejected"]),
  reason: z.string().trim().max(500).optional(),
  reviewEvidence: z.object({
    locationConfirmed: z.boolean(),
    authorityToLetReviewed: z.boolean(),
    mediaCompared: z.boolean(),
    chargesAndCapacityConfirmed: z.boolean(),
    notes: z.string().trim().max(1000),
  }).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  const parsed = reviewSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid listing review." }, { status: 400 });
  const { status, reason, reviewEvidence } = parsed.data;

  await dbConnect();
  const current = await Property.findById(id);
  if (!current) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (current.status !== "pending") return NextResponse.json({ error: "This listing is no longer awaiting review." }, { status: 409 });
  if (status === "active" && (!reviewEvidence?.mediaCompared || !reviewEvidence.notes || reviewEvidence.notes.length < 10)) {
    return NextResponse.json({ error: "Review the listing media and record at least 10 characters of review notes before approval." }, { status: 400 });
  }
  if (status === "active" && current.purpose === "shortlet") {
    const checks = reviewEvidence && [
      reviewEvidence.locationConfirmed,
      reviewEvidence.authorityToLetReviewed,
      reviewEvidence.mediaCompared,
      reviewEvidence.chargesAndCapacityConfirmed,
    ].every(Boolean);
    if (!checks) {
      return NextResponse.json({ error: "Complete all short-stay checks and add a note describing the evidence reviewed." }, { status: 400 });
    }
  }
  const update: Record<string, any> = { status };
  if (status === "active" && reviewEvidence) {
    update.reviewEvidence = {
      checks: {
        locationConfirmed: reviewEvidence.locationConfirmed ?? false,
        authorityToLetReviewed: reviewEvidence.authorityToLetReviewed ?? false,
        mediaCompared: reviewEvidence.mediaCompared,
        chargesAndCapacityConfirmed: reviewEvidence.chargesAndCapacityConfirmed ?? false,
      },
      notes: reviewEvidence.notes,
      checkedBy: (session!.user as any).id,
      checkedAt: new Date(),
    };
  }
  const property = await Property.findOneAndUpdate({ _id: id, status: "pending" }, { $set: update }, { new: true });
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
