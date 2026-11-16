/**
 * Geocodes an address into lat/lng using OpenStreetMap's Nominatim —
 * free, no API key required. Nominatim's usage policy asks for a max of
 * 1 request/second and a descriptive User-Agent, which is fine for our
 * volume (one geocode per listing create/edit, not per page view).
 *
 * Returns null on any failure — geocoding is best-effort. A listing
 * without coordinates just won't show a pin on the map view; everything
 * else about it still works.
 */
export async function geocodeAddress(parts: {
  address?: string;
  city: string;
  state: string;
  postcode?: string;
}): Promise<{ lat: number; lng: number } | null> {
  const query = [parts.address, parts.city, parts.state, parts.postcode, "Nigeria"]
    .filter(Boolean)
    .join(", ");

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Fabhouse Property Platform (contact: hello@fabhouse.ng)" },
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}
