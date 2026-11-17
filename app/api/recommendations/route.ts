import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { checkRateLimit } from "@/lib/rateLimit";
import Property from "@/models/Property";
import User from "@/models/User";
import { rankPropertyRecommendations, type ListingRecommendationProfile } from "@/lib/recommendations";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Sign in to get recommendations." }, { status: 401 });
  const userId = (session.user as any).id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Sign in to get recommendations." }, { status: 401 });

  try {
    const limit = await checkRateLimit({ key: `recommendations:${userId}`, limit: 30, windowSeconds: 60 });
    if (!limit.allowed) {
      return NextResponse.json({ error: "Too many recommendation requests. Try again shortly." }, { status: 429 });
    }

    await dbConnect();
    const user = await User.findById(userId).select("savedListings isSuspended").lean();
    if (!user || user.isSuspended) {
      return NextResponse.json({ error: "Active account required." }, { status: 403 });
    }

    const savedIds = (user.savedListings ?? []).map((id) => id.toString());
    if (savedIds.length === 0) {
      return NextResponse.json({ recommendations: [], basedOn: 0 });
    }

    const savedListings = await Property.find({ _id: { $in: savedIds }, status: "active" })
      .select("type purpose price currency bedrooms location.countryCode location.city location.state")
      .limit(20)
      .lean();
    if (savedListings.length === 0) {
      return NextResponse.json({ recommendations: [], basedOn: 0 });
    }

    const seeds: ListingRecommendationProfile[] = savedListings.map((listing) => ({
      type: listing.type,
      purpose: listing.purpose,
      price: listing.price,
      currency: listing.currency,
      bedrooms: listing.bedrooms,
      location: {
        countryCode: listing.location.countryCode ?? "NG",
        city: listing.location.city,
        state: listing.location.state,
      },
    }));
    const countries = [...new Set(seeds.map((seed) => seed.location.countryCode ?? "NG"))];
    const currencies = [...new Set(savedListings.map((listing) => listing.currency))];
    const fields = {
      _id: 1,
      title: 1,
      price: 1,
      pricePeriod: 1,
      currency: 1,
      priceQualifier: 1,
      priceReducedAt: 1,
      type: 1,
      purpose: 1,
      location: 1,
      bedrooms: 1,
      bathrooms: 1,
      images: 1,
      videos: 1,
      isFeatured: 1,
      createdAt: 1,
    };
    const candidateQueries = [
      Property.find({
        status: "active",
        owner: { $ne: userId },
        _id: { $nin: savedIds },
        currency: { $in: currencies },
        "location.countryCode": { $in: countries },
      })
        .sort({ createdAt: -1 })
        .limit(250)
        .select(fields)
        .lean(),
      ...(countries.includes("NG")
        ? [
            Property.find({
              status: "active",
              owner: { $ne: userId },
              _id: { $nin: savedIds },
              currency: { $in: currencies },
              "location.countryCode": { $exists: false },
            })
              .sort({ createdAt: -1 })
              .limit(250)
              .select(fields)
              .lean(),
          ]
        : []),
    ];
    const candidateGroups = await Promise.all(candidateQueries);
    const candidates = candidateGroups.flat();

    const recommendations = rankPropertyRecommendations(
      candidates,
      seeds,
      6
    );
    return NextResponse.json({ recommendations, basedOn: savedListings.length });
  } catch (error) {
    console.error("Property recommendations failed:", error);
    return NextResponse.json({ error: "Couldn't load recommendations right now." }, { status: 500 });
  }
}
