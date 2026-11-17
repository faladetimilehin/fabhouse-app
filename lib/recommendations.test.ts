import { describe, expect, it } from "vitest";
import { rankPropertyRecommendations, type ListingRecommendationProfile } from "./recommendations";

const savedListing: ListingRecommendationProfile = {
  type: "flat",
  purpose: "rent",
  price: 500_000,
  currency: "NGN",
  bedrooms: 2,
  location: { countryCode: "NG", city: "Lagos", state: "Lagos" },
};

describe("rankPropertyRecommendations", () => {
  it("ranks active-market listings similar to a saved place ahead of unrelated listings", () => {
    const similar = {
      ...savedListing,
      title: "Two-bedroom flat in Lekki",
      location: { countryCode: "NG", city: "Lagos", state: "Lagos" },
    };
    const unrelated = {
      ...savedListing,
      type: "house",
      purpose: "sale",
      currency: "GHS",
      location: { countryCode: "GH", city: "Accra", state: "Greater Accra" },
    };

    expect(rankPropertyRecommendations([unrelated, similar], [savedListing])[0]).toBe(similar);
  });

  it("uses the requested result limit", () => {
    const candidates = Array.from({ length: 8 }, (_, index) => ({
      ...savedListing,
      title: `Listing ${index}`,
    }));

    expect(rankPropertyRecommendations(candidates, [savedListing], 3)).toHaveLength(3);
  });
});
