export interface ListingRecommendationProfile {
  type: string;
  purpose: string;
  price: number;
  currency: string;
  bedrooms?: number;
  location: {
    countryCode?: string;
    city: string;
    state: string;
  };
  createdAt?: Date | string;
}

function normalized(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

function scoreMatch(candidate: ListingRecommendationProfile, seed: ListingRecommendationProfile): number {
  let score = 0;
  const candidateCountry = normalized(candidate.location.countryCode) || "ng";
  const seedCountry = normalized(seed.location.countryCode) || "ng";

  if (candidateCountry !== seedCountry || candidate.currency !== seed.currency) return -1;

  score += 7;
  if (candidate.purpose === seed.purpose) score += 4;
  if (candidate.type === seed.type) score += 2;
  if (normalized(candidate.location.city) === normalized(seed.location.city)) score += 4;
  if (normalized(candidate.location.state) === normalized(seed.location.state)) score += 2;
  if (candidate.bedrooms !== undefined && seed.bedrooms !== undefined) {
    if (candidate.bedrooms === seed.bedrooms) score += 2;
    else if (Math.abs(candidate.bedrooms - seed.bedrooms) === 1) score += 1;
  }

  if (candidate.currency === seed.currency && seed.price > 0) {
    const priceRatio = candidate.price / seed.price;
    if (priceRatio >= 0.75 && priceRatio <= 1.25) score += 3;
    else if (priceRatio >= 0.5 && priceRatio <= 1.5) score += 1;
  }

  return score;
}

export function rankPropertyRecommendations<T extends ListingRecommendationProfile>(
  candidates: T[],
  seeds: ListingRecommendationProfile[],
  limit = 6
): T[] {
  return candidates
    .map((candidate, index) => {
      const scores = seeds.map((seed) => scoreMatch(candidate, seed)).sort((a, b) => b - a);
      const score = (scores[0] ?? 0) + (scores[1] ?? 0) * 0.25;
      const createdAt = candidate.createdAt ? new Date(candidate.createdAt).getTime() : 0;
      return { candidate, index, score, createdAt };
    })
    .filter(({ score }) => score >= 0)
    .sort((a, b) => b.score - a.score || b.createdAt - a.createdAt || a.index - b.index)
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}
