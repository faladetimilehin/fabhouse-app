/**
 * Recently Viewed Listings Management
 * Stores in localStorage for buyers, tracks in DB for recommendations
 */

export interface RecentlyViewed {
  propertyId: string;
  title: string;
  viewedAt: number; // timestamp
}

const STORAGE_KEY = "fabhouse_recently_viewed";
const MAX_ITEMS = 20;

/**
 * Get recently viewed listings from localStorage
 */
export function getRecentlyViewed(): RecentlyViewed[] {
  if (typeof window === "undefined") return [];
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error("Failed to parse recently viewed:", err);
    return [];
  }
}

/**
 * Add a property to recently viewed
 */
export function addToRecentlyViewed(propertyId: string, title: string) {
  if (typeof window === "undefined") return;

  try {
    let viewed = getRecentlyViewed();

    // Remove if already exists (to move to top)
    viewed = viewed.filter((v) => v.propertyId !== propertyId);

    // Add to top
    viewed.unshift({
      propertyId,
      title,
      viewedAt: Date.now(),
    });

    // Keep only last 20
    viewed = viewed.slice(0, MAX_ITEMS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(viewed));

    // Also track in DB (fire and forget)
    if (typeof window !== "undefined") {
      fetch("/api/properties/track-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId }),
      }).catch(() => {});
    }
  } catch (err) {
    console.error("Failed to add to recently viewed:", err);
  }
}

/**
 * Clear all recently viewed
 */
export function clearRecentlyViewed() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get recently viewed (last N items, default 6 for homepage display)
 */
export function getRecentlyViewedDisplay(count = 6): RecentlyViewed[] {
  const viewed = getRecentlyViewed();
  // Sort by most recent and return only requested count
  return viewed.sort((a, b) => b.viewedAt - a.viewedAt).slice(0, count);
}
