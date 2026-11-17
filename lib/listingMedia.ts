import { v2 as cloudinary } from "cloudinary";

export const MAX_LISTING_IMAGES = 8;
export const MAX_LISTING_VIDEOS = 3;
export const MAX_LISTING_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_LISTING_VIDEO_BYTES = 100 * 1024 * 1024;

type MediaResourceType = "image" | "video";

interface ListingMedia {
  ownerId: string;
  images?: string[];
  videos?: string[];
}

interface MediaReference {
  url: string;
  publicId: string;
  resourceType: MediaResourceType;
}

type MediaValidationResult =
  | { valid: true }
  | { valid: false; status: 400 | 503; error: string };

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const cloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);
if (cloudName && apiKey && apiSecret) {
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
}

function parseMediaUrl(url: string, resourceType: MediaResourceType, ownerId: string): MediaReference | null {
  if (!cloudName) return null;

  try {
    const parsed = new URL(url);
    if (
      parsed.protocol !== "https:" ||
      parsed.hostname !== "res.cloudinary.com" ||
      parsed.port ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash
    ) {
      return null;
    }

    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts[0] !== cloudName || parts[1] !== resourceType || parts[2] !== "upload") return null;

    const assetParts = parts.slice(3);
    if (assetParts[0]?.match(/^v\d+$/)) assetParts.shift();
    const legacyFolders = resourceType === "image"
      ? ["fabhouse-listings"]
      : ["fabhouse-listings", "videos"];
    const ownerFolders = resourceType === "image"
      ? ["fabhouse-listings", ownerId]
      : ["fabhouse-listings", ownerId, "videos"];
    const folders = [ownerFolders, legacyFolders].find((candidate) =>
      assetParts.length === candidate.length + 1 &&
      candidate.every((folder, index) => assetParts[index] === folder)
    );
    if (
      !folders
    ) {
      return null;
    }

    const fileName = assetParts[assetParts.length - 1];
    if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9]+$/.test(fileName)) return null;
    const extension = fileName.slice(fileName.lastIndexOf(".") + 1).toLowerCase();
    const allowedFormats = resourceType === "image"
      ? ["jpg", "jpeg", "png", "webp"]
      : ["mp4", "mov", "webm"];
    if (!allowedFormats.includes(extension)) return null;

    return {
      url,
      publicId: assetParts.slice(0, -1).concat(fileName.slice(0, fileName.lastIndexOf("."))).join("/"),
      resourceType,
    };
  } catch {
    return null;
  }
}

function chunk<T>(values: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

export async function validateListingMediaBatch(listings: ListingMedia[]): Promise<MediaValidationResult> {
  if (listings.some(({ images = [], videos = [] }) =>
    images.length > MAX_LISTING_IMAGES || videos.length > MAX_LISTING_VIDEOS
  )) {
    return { valid: false, status: 400, error: "Listings can include up to 8 photos and 3 videos each." };
  }

  const parsedReferences = listings.flatMap(({ ownerId, images = [], videos = [] }) => [
    ...images.map((url) => parseMediaUrl(url, "image", ownerId)),
    ...videos.map((url) => parseMediaUrl(url, "video", ownerId)),
  ]);
  if (parsedReferences.some((reference) => !reference)) {
    return {
      valid: false,
      status: 400,
      error: "Use valid Fabhouse Cloudinary uploads for listing photos and videos.",
    };
  }

  const uniqueReferences = [...new Map(
    parsedReferences
      .filter((reference): reference is MediaReference => reference !== null)
      .map((reference) => [`${reference.resourceType}:${reference.publicId}`, reference])
  ).values()];
  if (uniqueReferences.length === 0) return { valid: true };
  if (!cloudinaryConfigured) {
    return {
      valid: false,
      status: 503,
      error: "Listing media verification is unavailable. Configure server-side Cloudinary credentials.",
    };
  }

  const byType: Record<MediaResourceType, MediaReference[]> = {
    image: uniqueReferences.filter((reference) => reference.resourceType === "image"),
    video: uniqueReferences.filter((reference) => reference.resourceType === "video"),
  };

  try {
    const batches = (["image", "video"] as const).flatMap((resourceType) =>
      chunk(byType[resourceType], 100).map((references) => ({ resourceType, references }))
    );
    const results = await Promise.all(batches.map(async ({ resourceType, references }) => ({
      resourceType,
      references,
      resources: await cloudinary.api.resources_by_ids(
        references.map((reference) => reference.publicId),
        { resource_type: resourceType, type: "upload" }
      ),
    })));

    for (const { resourceType, references, resources } of results) {
      const assets = new Map(
        resources.resources.map((asset) => [`${asset.resource_type}:${asset.public_id}`, asset])
      );
      const maxBytes = resourceType === "image" ? MAX_LISTING_IMAGE_BYTES : MAX_LISTING_VIDEO_BYTES;
      const allowedFormats = resourceType === "image"
        ? ["jpg", "jpeg", "png", "webp"]
        : ["mp4", "mov", "webm"];

      for (const reference of references) {
        const asset = assets.get(`${resourceType}:${reference.publicId}`);
        if (
          !asset ||
          asset.type !== "upload" ||
          asset.secure_url !== reference.url ||
          !allowedFormats.includes(asset.format.toLowerCase()) ||
          asset.bytes <= 0 ||
          asset.bytes > maxBytes
        ) {
          return {
            valid: false,
            status: 400,
            error: resourceType === "image"
              ? "A photo is missing, invalid, or over the 10 MB limit."
              : "A video is missing, invalid, or over the 100 MB limit.",
          };
        }
      }
    }
  } catch (error) {
    console.error("Cloudinary listing media verification failed:", error);
    return {
      valid: false,
      status: 503,
      error: "Listing media verification is temporarily unavailable. Please try again.",
    };
  }

  return { valid: true };
}

export async function validateListingMedia(media: ListingMedia): Promise<MediaValidationResult> {
  return validateListingMediaBatch([media]);
}
