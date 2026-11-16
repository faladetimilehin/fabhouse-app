import { MetadataRoute } from "next";
import { dbConnect } from "@/lib/mongodb";
import Property from "@/models/Property";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || "https://fabhouse.ng";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/listings`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/listings?purpose=sale`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${baseUrl}/listings?purpose=rent`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${baseUrl}/pricing`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    await dbConnect();
    const listings = await Property.find({ status: "active" }).select("_id updatedAt").limit(5000).lean();

    const listingRoutes: MetadataRoute.Sitemap = listings.map((l: any) => ({
      url: `${baseUrl}/listings/${l._id.toString()}`,
      lastModified: l.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...staticRoutes, ...listingRoutes];
  } catch {
    // If the DB is unreachable at build/request time, still return the
    // static routes rather than failing the whole sitemap.
    return staticRoutes;
  }
}
