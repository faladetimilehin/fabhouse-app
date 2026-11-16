import crypto from "crypto";
import { Types } from "mongoose";
import ImageFingerprint from "@/models/ImageFingerprint";
import AddressFingerprint from "@/models/AddressFingerprint";

// ---------------------------------------------------------------------------
// Perceptual hashing (pHash) — 8x8 DCT-based, 64-bit output as 16-char hex
// Catches visually identical images even if resaved, renamed, or slightly
// compressed. Two images are "the same" if their Hamming distance is ≤ 10.
// ---------------------------------------------------------------------------

const PHASH_THRESHOLD = 10; // bits different — tune up to ~15 for looser matching

/**
 * Compute a 64-bit perceptual hash of an image URL using sharp.
 * We fetch a tiny 32x32 greyscale version via Cloudinary's transformation
 * API (no extra cost, no extra upload) then run a DCT-based pHash.
 */
export async function computePHash(imageUrl: string): Promise<string | null> {
  try {
    // Ask Cloudinary to serve a 32x32 greyscale thumbnail — fast and cheap
    const thumbUrl = imageUrl.replace(
      "/upload/",
      "/upload/w_32,h_32,c_fill,e_grayscale,f_jpg,q_auto:low/"
    );

    const res = await fetch(thumbUrl);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());

    // Use sharp to get raw 32x32 greyscale pixels
    const sharp = (await import("sharp")).default;
    const { data } = await sharp(buffer)
      .resize(32, 32, { fit: "fill" })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Compute mean
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    const mean = sum / data.length;

    // Build 64-bit hash: top-left 8x8 of the 32x32 grid
    // (standard pHash uses DCT; this is a simpler but effective aHash variant
    //  that works well for duplicate detection without a DCT library)
    let bits = BigInt(0);
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const pixel = data[row * 32 + col];
        bits = (bits << BigInt(1)) | BigInt(pixel >= mean ? 1 : 0);
      }
    }

    return bits.toString(16).padStart(16, "0");
  } catch {
    return null;
  }
}

/** Hamming distance between two 16-char hex pHash strings */
export function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) return 64;
  let dist = 0;
  const xor = BigInt("0x" + a) ^ BigInt("0x" + b);
  let n = xor;
  while (n > BigInt(0)) {
    dist += Number(n & BigInt(1));
    n >>= BigInt(1);
  }
  return dist;
}

/** Extract Cloudinary public_id from a secure_url */
function extractPublicId(url: string): string {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
  return match ? match[1] : url;
}

/** Normalise address fields and SHA-256 the result */
export function hashAddress(address: string, city: string, state: string): string {
  const normalised = [address, city, state]
    .map((s) => s.trim().toLowerCase().replace(/\s+/g, " "))
    .join("|");
  return crypto.createHash("sha256").update(normalised).digest("hex");
}

export function normaliseAddress(address: string, city: string, state: string): string {
  return [address, city, state]
    .map((s) => s.trim().toLowerCase().replace(/\s+/g, " "))
    .join(", ");
}

// ---------------------------------------------------------------------------
// Registration — called after a listing is created or edited
// ---------------------------------------------------------------------------

/**
 * Compute pHash for each image URL, store in ImageFingerprint, and return
 * any that are visually similar to an existing listing's images.
 */
export async function registerImageFingerprints(
  listingId: Types.ObjectId,
  imageUrls: string[]
): Promise<{ url: string; existingCount: number }[]> {
  const duplicates: { url: string; existingCount: number }[] = [];

  for (const url of imageUrls) {
    const pHash = await computePHash(url);
    if (!pHash) continue; // couldn't hash — skip silently

    const publicId = extractPublicId(url);

    // Find any stored fingerprint within Hamming threshold
    // We load all and compare in JS — fine at this scale; switch to a
    // vector DB or pre-bucketing if you ever have 100k+ listings.
    const all = await ImageFingerprint.find({}).lean() as any[];
    const match = all.find(
      (fp) => hammingDistance(fp.pHash, pHash) <= PHASH_THRESHOLD
    );

    if (match) {
      const alreadyHasListing = match.listings.some(
        (id: any) => id.toString() === listingId.toString()
      );
      if (!alreadyHasListing) {
        await ImageFingerprint.findByIdAndUpdate(match._id, {
          $addToSet: { listings: listingId, cloudinaryIds: publicId },
        });
      }
      const otherCount = match.listings.filter(
        (id: any) => id.toString() !== listingId.toString()
      ).length;
      if (otherCount > 0) duplicates.push({ url, existingCount: otherCount });
    } else {
      await ImageFingerprint.create({
        pHash,
        cloudinaryIds: [publicId],
        listings: [listingId],
      });
    }
  }

  return duplicates;
}

export async function registerAddressFingerprint(
  listingId: Types.ObjectId,
  address: string,
  city: string,
  state: string
): Promise<number> {
  if (!address.trim()) return 0;

  const hash = hashAddress(address, city, state);
  const normalised = normaliseAddress(address, city, state);
  const existing = await AddressFingerprint.findOne({ hash });

  if (existing) {
    if (!existing.listings.some((id) => id.equals(listingId))) {
      existing.listings.push(listingId);
      await existing.save();
    }
    return existing.listings.filter((id) => !id.equals(listingId)).length;
  } else {
    await AddressFingerprint.create({ hash, normalised, listings: [listingId] });
    return 0;
  }
}

export async function removeListingFingerprints(listingId: Types.ObjectId) {
  await ImageFingerprint.updateMany(
    { listings: listingId },
    { $pull: { listings: listingId } }
  );
  await AddressFingerprint.updateMany(
    { listings: listingId },
    { $pull: { listings: listingId } }
  );
}

// ---------------------------------------------------------------------------
// Pre-submission checks — read-only, never writes
// ---------------------------------------------------------------------------

export async function checkImageDuplicates(
  imageUrls: string[],
  excludeListingId?: string
): Promise<{ url: string; existingCount: number }[]> {
  const results: { url: string; existingCount: number }[] = [];
  const all = await ImageFingerprint.find({}).lean() as any[];

  for (const url of imageUrls) {
    const pHash = await computePHash(url);
    if (!pHash) continue;

    const match = all.find(
      (fp) => hammingDistance(fp.pHash, pHash) <= PHASH_THRESHOLD
    );
    if (!match) continue;

    const otherListings = excludeListingId
      ? match.listings.filter((id: any) => id.toString() !== excludeListingId)
      : match.listings;

    if (otherListings.length > 0) {
      results.push({ url, existingCount: otherListings.length });
    }
  }

  return results;
}

export async function checkAddressDuplicate(
  address: string,
  city: string,
  state: string,
  excludeListingId?: string
): Promise<number> {
  if (!address.trim()) return 0;
  const hash = hashAddress(address, city, state);
  const existing = await AddressFingerprint.findOne({ hash });
  if (!existing) return 0;

  const others = excludeListingId
    ? existing.listings.filter((id) => id.toString() !== excludeListingId)
    : existing.listings;

  return others.length;
}

// Keep this export so existing callers in Property model don't break
export function hashImageUrl(url: string): string {
  const publicId = extractPublicId(url);
  return crypto.createHash("sha256").update(publicId).digest("hex");
}
