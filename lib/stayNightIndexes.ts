import StayNight from "@/models/StayNight";

export async function ensureStayNightIndexes() {
  // Build uniqueness and TTL indexes before any operation can reserve nights.
  await StayNight.createIndexes();
}
