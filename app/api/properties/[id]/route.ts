import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import Property from "@/models/Property";
import { deleteCloudinaryImages, deleteCloudinaryVideos } from "@/lib/cloudinary";
import { geocodeAddress } from "@/lib/geocode";
import { convertToNGN } from "@/lib/currency";
import { registerImageFingerprints, registerAddressFingerprint, removeListingFingerprints, hashImageUrl, hashAddress } from "@/lib/fingerprint";
import StayBooking from "@/models/StayBooking";
import StayNight from "@/models/StayNight";
import StaySupportTicket from "@/models/StaySupportTicket";
import { validateListingMedia } from "@/lib/listingMedia";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await dbConnect();
  const property = await Property.findById(id).select("-reviewEvidence.notes -reviewEvidence.checkedBy").populate("owner", "name isVerified phone email");
  if (!property) return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  return NextResponse.json({ property });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const property = await Property.findById(id);
  if (!property) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  const isOwner = property.owner.toString() === (session.user as any).id;
  const isAdmin = (session.user as any).role === "admin";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "You don't have permission to edit this listing." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid listing update." }, { status: 400 });
  }
  if (
    (body.images !== undefined && !Array.isArray(body.images)) ||
    (body.videos !== undefined && !Array.isArray(body.videos))
  ) {
    return NextResponse.json({ error: "Listing photos and videos must be arrays." }, { status: 400 });
  }
  if (body.images !== undefined || body.videos !== undefined) {
    const mediaValidation = await validateListingMedia({
      ownerId: property.owner.toString(),
      images: body.images ?? property.images ?? [],
      videos: body.videos ?? property.videos ?? [],
    });
    if (!mediaValidation.valid) {
      return NextResponse.json({ error: mediaValidation.error }, { status: mediaValidation.status });
    }
  }

  // Review evidence is written only by the protected admin review endpoint.
  delete body.reviewEvidence;

  const effectivePurpose = body.purpose ?? property.purpose;
  if (effectivePurpose === "sale") {
    delete body.pricePeriod;
  } else {
    const allowedPeriods = effectivePurpose === "shortlet" ? ["night", "week"] : ["month", "year"];
    if (body.pricePeriod === undefined) {
      body.pricePeriod = property.purpose === effectivePurpose
        ? property.pricePeriod ?? (effectivePurpose === "shortlet" ? "night" : "year")
        : effectivePurpose === "shortlet" ? "night" : "year";
    }
    if (!allowedPeriods.includes(body.pricePeriod)) {
      return NextResponse.json({ error: "Choose a price period that matches the listing type." }, { status: 400 });
    }
  }

  // Owner-managed statuses: once a listing has passed review, its owner
  // can freely mark it Sold / Rented / Withdrawn (archived) / Active again
  // themselves — no need to wait on an admin for that. Admins alone still
  // control the pending -> active/rejected review decision.
  const OWNER_MANAGEABLE_STATUSES = ["active", "sold", "rented", "archived"];

  if (!isAdmin) {
    if (body.status !== undefined) {
      const canOwnerChangeStatus =
        OWNER_MANAGEABLE_STATUSES.includes(property.status) &&
        OWNER_MANAGEABLE_STATUSES.includes(body.status);

      if (!canOwnerChangeStatus) {
        return NextResponse.json(
          {
            error:
              property.status === "pending"
                ? "This listing is still awaiting admin review — its status can't be changed yet."
                : "You can only switch between Active, Sold, Rented, and Withdrawn.",
          },
          { status: 403 }
        );
      }
    }
    delete body.isFeatured;
    delete body.targetDiaspora;
  }

  // If images were replaced, clean up any that were dropped so storage
  // doesn't accumulate orphaned photos from edits.
  if (Array.isArray(body.images)) {
    const oldImages: string[] = property.images ?? [];
    const removedImages = oldImages.filter((url) => !body.images.includes(url));
    if (removedImages.length > 0) {
      deleteCloudinaryImages(removedImages).catch(() => {});
    }
  }

  if (Array.isArray(body.videos)) {
    const oldVideos: string[] = property.videos ?? [];
    const removedVideos = oldVideos.filter((url) => !body.videos.includes(url));
    if (removedVideos.length > 0) {
      deleteCloudinaryVideos(removedVideos).catch(() => {});
    }
  }

  // Track price reductions automatically, the way Rightmove shows
  // "Reduced on [date]" — only fires when the new price is strictly lower.
  if (typeof body.price === "number" && body.price < property.price) {
    body.previousPrice = property.price;
    body.priceReducedAt = new Date();
  }

  // Keep the NGN-equivalent price in sync whenever price or currency
  // changes, so cross-currency search filtering (lib/currency.ts) stays
  // accurate.
  if (typeof body.price === "number" || typeof body.currency === "string") {
    const newPrice = typeof body.price === "number" ? body.price : property.price;
    const newCurrency = typeof body.currency === "string" ? body.currency : property.currency;
    if (["NGN", "USD", "GBP"].includes(newCurrency)) {
      body.priceNGN = convertToNGN(newPrice, newCurrency);
    } else {
      body.priceNGN = undefined;
    }
  }

  // Re-geocode if the address changed, so the map pin stays accurate.
  if (body.location) {
    const addressChanged =
      body.location.address !== property.location.address ||
      body.location.city !== property.location.city ||
      body.location.state !== property.location.state ||
      body.location.countryCode !== (property.location.countryCode ?? "NG") ||
      body.location.postcode !== property.location.postcode;

    if (addressChanged) {
      const coords = await geocodeAddress(body.location).catch(() => null);
      if (coords) body.location = { ...body.location, ...coords };
    }
  }

  const locationFields = ["countryCode", "state", "city", "address", "postcode"] as const;
  const locationChanged = body.location && locationFields.some((field) =>
    body.location[field] !== undefined && body.location[field] !== (property.location as any)[field]
  );
  const shortletReviewChanged = effectivePurpose === "shortlet" && [
    property.purpose !== "shortlet",
    body.title !== undefined && body.title !== property.title,
    body.description !== undefined && body.description !== property.description,
    body.price !== undefined && body.price !== property.price,
    body.currency !== undefined && body.currency !== property.currency,
    body.pricePeriod !== undefined && body.pricePeriod !== property.pricePeriod,
    body.bedrooms !== undefined && body.bedrooms !== property.bedrooms,
    body.bathrooms !== undefined && body.bathrooms !== property.bathrooms,
    body.images !== undefined && JSON.stringify(body.images) !== JSON.stringify(property.images ?? []),
    body.amenities !== undefined && JSON.stringify(body.amenities) !== JSON.stringify(property.amenities ?? []),
    Boolean(locationChanged),
  ].some(Boolean);
  const mediaChanged = [
    body.images !== undefined && JSON.stringify(body.images) !== JSON.stringify(property.images ?? []),
    body.videos !== undefined && JSON.stringify(body.videos) !== JSON.stringify(property.videos ?? []),
  ].some(Boolean);
  if (shortletReviewChanged || mediaChanged) body.status = "pending";

  const updated = await Property.findByIdAndUpdate(id, body, { new: true });
  if (updated && (shortletReviewChanged || mediaChanged)) {
    await Property.updateOne({ _id: id }, { $unset: { reviewEvidence: 1 } });
  }

  // Update fingerprints after edit (fire-and-forget)
  if (updated) {
    const newImages: string[] = updated.images ?? [];
    const newHashes = newImages.map(hashImageUrl);
    Property.findByIdAndUpdate(id, { imageHashes: newHashes }).catch(() => {});
    registerImageFingerprints(updated._id, newImages).catch(() => {});

    const loc = updated.location;
    if (loc.address) {
      const countryCode = loc.countryCode ?? "NG";
      const addrHash = hashAddress(loc.address, loc.city, loc.state, countryCode);
      Property.findByIdAndUpdate(id, { addressHash: addrHash }).catch(() => {});
      registerAddressFingerprint(updated._id, loc.address, loc.city, loc.state, countryCode).catch(() => {});
    }
  }

  return NextResponse.json({ property: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const property = await Property.findById(id);
  if (!property) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  const isOwner = property.owner.toString() === (session.user as any).id;
  const isAdmin = (session.user as any).role === "admin";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "You don't have permission to delete this listing." }, { status: 403 });
  }

  // Clean up hosted media before removing the listing, so storage
  // doesn't quietly grow with orphaned photos/videos. Best-effort — see
  // lib/cloudinary.ts for what happens if credentials aren't set.
  await deleteCloudinaryImages(property.images ?? []);
  await deleteCloudinaryVideos(property.videos ?? []);
  await removeListingFingerprints(property._id).catch(() => {});
  const bookings = await StayBooking.find({ property: property._id }).select("_id").lean();
  const bookingIds = bookings.map((booking) => booking._id);
  await Promise.all([
    StaySupportTicket.deleteMany({ booking: { $in: bookingIds } }),
    StayNight.deleteMany({ property: property._id }),
    StayBooking.deleteMany({ property: property._id }),
  ]);
  await Property.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
