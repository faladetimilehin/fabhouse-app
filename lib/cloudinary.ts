import { v2 as cloudinary } from "cloudinary";

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
function extractPublicId(url: string): string | null {
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
    return match ? match[1] : null;
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

async function deleteCloudinaryAssets(urls: string[], resourceType: "image" | "video"): Promise<void> {
  if (!urls || urls.length === 0) return;

  if (!configured) {
    console.warn(
      `Cloudinary not configured — skipping ${resourceType} cleanup for ${urls.length} asset(s).`
    );
    return;
  }

  const publicIds = urls.map(extractPublicId).filter((id): id is string => Boolean(id));
  if (publicIds.length === 0) return;

  try {
    await cloudinary.api.delete_resources(publicIds, { resource_type: resourceType });
  } catch {
    console.error(`Failed to delete some Cloudinary ${resourceType}s.`);
  }
}
