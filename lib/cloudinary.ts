import { v2 as cloudinary } from "cloudinary";
import { randomUUID } from "crypto";

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const configured = Boolean(cloudName && apiKey && apiSecret);

if (configured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

/**
 * Extracts the public_id Cloudinary needs to delete an asset, from a
 * secure_url like:
 * https://res.cloudinary.com/<cloud>/image/upload/v169.../fabhouse-listings/abc123.jpg
 * -> "fabhouse-listings/abc123"
 */
function extractPublicId(url: string, resourceType: "image" | "video"): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "res.cloudinary.com") return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts[0] !== cloudName || parts[1] !== resourceType || parts[2] !== "upload") return null;
    const publicIdParts = parts.slice(3);
    if (publicIdParts[0]?.match(/^v\d+$/)) publicIdParts.shift();
    const publicId = publicIdParts.join("/").replace(/\.[a-zA-Z0-9]+$/, "");
    return publicId.startsWith("fabhouse-listings/") ? publicId : null;
  } catch {
    return null;
  }
}

/**
 * Deletes one or more Cloudinary assets by their hosted URL. Silently
 * no-ops (logging a warning) if server-side Cloudinary credentials
 * (CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET) aren't configured — so
 * listing deletion never fails just because cleanup couldn't run.
 */
export async function deleteCloudinaryImages(urls: string[]): Promise<void> {
  return deleteCloudinaryAssets(urls, "image");
}

export async function deleteCloudinaryVideos(urls: string[]): Promise<void> {
  return deleteCloudinaryAssets(urls, "video");
}

export async function uploadPrivateVerificationDocument(userId: string, file: File) {
  if (!configured) throw new Error("Private document storage is not configured.");

  const mimeType = file.type;
  const resourceType = mimeType === "application/pdf" ? "raw" : "image";
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const publicId = `${userId}/${randomUUID()}`;
  const result = await cloudinary.uploader.upload(`data:${mimeType};base64,${base64}`, {
    folder: "fabhouse-verification",
    public_id: publicId,
    resource_type: resourceType,
    type: "authenticated",
    overwrite: false,
    unique_filename: false,
    use_filename: false,
  });

  return {
    publicId: result.public_id,
    format: result.format,
    resourceType: resourceType as "image" | "raw",
  };
}

export function getPrivateVerificationDocumentUrl(
  document: { publicId: string; format: string; resourceType: "image" | "raw" },
  expiresInSeconds = 300
) {
  if (!configured) throw new Error("Private document storage is not configured.");
  return cloudinary.utils.private_download_url(document.publicId, document.format, {
    resource_type: document.resourceType,
    type: "authenticated",
    expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
  });
}

export async function deletePrivateVerificationDocument(
  document: { publicId: string; resourceType: "image" | "raw" }
): Promise<void> {
  if (!configured) return;
  try {
    await cloudinary.uploader.destroy(document.publicId, {
      resource_type: document.resourceType,
      type: "authenticated",
      invalidate: true,
    });
  } catch {
    console.error("Failed to delete a private verification document.");
  }
}

async function deleteCloudinaryAssets(urls: string[], resourceType: "image" | "video"): Promise<void> {
  if (!urls || urls.length === 0) return;

  if (!configured) {
    console.warn(
      `Cloudinary not configured — skipping ${resourceType} cleanup for ${urls.length} asset(s).`
    );
    return;
  }

  const publicIds = urls.map((url) => extractPublicId(url, resourceType)).filter((id): id is string => Boolean(id));
  if (publicIds.length === 0) return;

  try {
    await cloudinary.api.delete_resources(publicIds, { resource_type: resourceType });
  } catch {
    console.error(`Failed to delete some Cloudinary ${resourceType}s.`);
  }
}
