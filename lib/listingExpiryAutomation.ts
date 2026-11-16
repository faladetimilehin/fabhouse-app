import { dbConnect } from "@/lib/mongodb";
import { sendEmail } from "@/lib/email";
import ListingExpiry from "@/models/ListingExpiry";
import Property from "@/models/Property";
import { Types } from "mongoose";

const DAY_MS = 24 * 60 * 60 * 1000;
const LEGACY_BACKFILL_BATCH_SIZE = 500;

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

/** Sends renewal reminders, renews opted-in listings, and archives expired listings. */
export async function processListingExpiryAutomation() {
  await dbConnect();

  const now = new Date();

  // Give older active listings a 30-day runway the first time automation runs.
  const legacyListings = await Property.aggregate([
    { $match: { status: "active" } },
    {
      $lookup: {
        from: ListingExpiry.collection.name,
        localField: "_id",
        foreignField: "property",
        as: "expiryRecord",
      },
    },
    { $match: { expiryRecord: { $size: 0 } } },
    { $limit: LEGACY_BACKFILL_BATCH_SIZE },
    { $project: { _id: 1, owner: 1 } },
  ]);

  if (legacyListings.length > 0) {
    const graceExpiry = new Date(now.getTime() + 30 * DAY_MS);
    await ListingExpiry.bulkWrite(
    legacyListings.map((listing: { _id: Types.ObjectId; owner: Types.ObjectId }) => ({
        updateOne: {
          filter: { property: listing._id },
          update: {
            $setOnInsert: {
              property: listing._id,
              owner: listing.owner,
              expiresAt: graceExpiry,
              isActive: true,
            },
          },
          upsert: true,
        },
      })),
      { ordered: false }
    );
  }

  const reminderStart = new Date(now.getTime() + 2 * DAY_MS);
  const reminderEnd = new Date(now.getTime() + 7 * DAY_MS);
  const expiringListings = await ListingExpiry.find({
    expiresAt: { $gte: reminderStart, $lte: reminderEnd },
    isActive: true,
    $or: [
      { lastReminderAt: null },
      { lastReminderAt: { $lt: new Date(now.getTime() - DAY_MS) } },
    ],
  })
    .populate("property", "title location")
    .populate("owner", "email name");

  let emailsSent = 0;
  for (const listing of expiringListings) {
    const owner = listing.owner as any;
    const property = listing.property as any;
    if (!owner?.email || !property) continue;

    const address =
      property.location?.address ||
      [property.location?.city, property.location?.state].filter(Boolean).join(", ") ||
      "your listing";
    const title = property.title || address;
    const daysUntilExpiry = Math.ceil((listing.expiresAt.getTime() - now.getTime()) / DAY_MS);
    const safeTitle = escapeHtml(title);
    const safeAddress = escapeHtml(address);

    const result = await sendEmail({
      to: owner.email,
      subject: `Listing expiring soon: ${title}`,
      html: `
        <h2>Your Fabhouse listing is expiring soon</h2>
        <p><strong>Property:</strong> ${safeTitle} — ${safeAddress}</p>
        <p><strong>Time remaining:</strong> ${daysUntilExpiry} days</p>
        <p>Renew it now to keep it visible to buyers.</p>
        <a href="${process.env.NEXTAUTH_URL}/dashboard/listings/expiry">Review and renew listing</a>
      `,
    });

    if (!result.skipped) {
      await ListingExpiry.findByIdAndUpdate(listing._id, {
        lastReminderAt: now,
        $inc: { remindersSent: 1 },
      });
      emailsSent++;
    }
  }

  const autoRenewListings = await ListingExpiry.find({
    expiresAt: { $lt: now },
    isActive: true,
    autoRenew: true,
  });

  let autoRenewed = 0;
  for (const listing of autoRenewListings) {
    const renewalDays = Math.min(Math.max(listing.renewalDays || 30, 1), 365);
    const newExpiryDate = new Date(now.getTime() + renewalDays * DAY_MS);
    await ListingExpiry.findByIdAndUpdate(listing._id, {
      expiresAt: newExpiryDate,
      $inc: { renewalCount: 1 },
      lastRenewalAt: now,
      isActive: true,
    });
    await Property.updateOne(
      { _id: listing.property, status: "archived" },
      { $set: { status: "active" } }
    );
    autoRenewed++;
  }

  const expiredListings = await ListingExpiry.find({
    expiresAt: { $lt: now },
    isActive: true,
    autoRenew: { $ne: true },
  }).limit(LEGACY_BACKFILL_BATCH_SIZE);

  let archived = 0;
  for (const listing of expiredListings) {
    const result = await Property.updateOne(
      { _id: listing.property, status: "active" },
      { $set: { status: "archived" } }
    );
    await ListingExpiry.findByIdAndUpdate(listing._id, { isActive: false });
    if (result.modifiedCount > 0) archived++;
  }

  return {
    success: true,
    legacyListingsBackfilled: legacyListings.length,
    emailsSent,
    autoRenewed,
    archived,
  };
}
