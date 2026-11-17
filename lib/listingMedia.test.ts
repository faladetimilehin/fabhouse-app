import { beforeEach, describe, expect, it, vi } from "vitest";

const cloudinaryMocks = vi.hoisted(() => ({
  resourcesByIds: vi.fn(),
}));

vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    api: { resources_by_ids: cloudinaryMocks.resourcesByIds },
  },
}));

const ownerId = "65b123456789012345678901";
const imageUrl = `https://res.cloudinary.com/test-cloud/image/upload/v123/fabhouse-listings/${ownerId}/house.jpg`;

describe("validateListingMedia", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "test-cloud");
    vi.stubEnv("CLOUDINARY_API_KEY", "test-key");
    vi.stubEnv("CLOUDINARY_API_SECRET", "test-secret");
    cloudinaryMocks.resourcesByIds.mockReset();
  });

  it("rejects media outside the signed-in owner's Cloudinary folder", async () => {
    const { validateListingMedia } = await import("./listingMedia");
    const result = await validateListingMedia({
      ownerId,
      images: ["https://res.cloudinary.com/test-cloud/image/upload/fabhouse-listings/another-owner/photo.jpg"],
    });

    expect(result).toMatchObject({ valid: false, status: 400 });
    expect(cloudinaryMocks.resourcesByIds).not.toHaveBeenCalled();
  });

  it("accepts a verified image in the owner's folder", async () => {
    cloudinaryMocks.resourcesByIds.mockResolvedValue({
      resources: [{
        public_id: `fabhouse-listings/${ownerId}/house`,
        resource_type: "image",
        type: "upload",
        secure_url: imageUrl,
        format: "jpg",
        bytes: 1024,
      }],
    });
    const { validateListingMedia } = await import("./listingMedia");

    await expect(validateListingMedia({ ownerId, images: [imageUrl] })).resolves.toEqual({ valid: true });
  });

  it("rejects media that exceeds the server-side size limit", async () => {
    cloudinaryMocks.resourcesByIds.mockResolvedValue({
      resources: [{
        public_id: `fabhouse-listings/${ownerId}/house`,
        resource_type: "image",
        type: "upload",
        secure_url: imageUrl,
        format: "jpg",
        bytes: 10 * 1024 * 1024 + 1,
      }],
    });
    const { validateListingMedia } = await import("./listingMedia");

    await expect(validateListingMedia({ ownerId, images: [imageUrl] })).resolves.toMatchObject({
      valid: false,
      status: 400,
    });
  });
});
