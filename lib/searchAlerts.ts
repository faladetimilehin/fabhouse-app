import SearchAlert from "@/models/SearchAlert";
import { sendEmail } from "@/lib/email";
import type { IProperty } from "@/models/Property";
import { formatPrice } from "@/lib/formatting";
import { convertToNGN } from "@/lib/currency";

/**
 * Checks every saved search alert against a newly-activated listing and
 * emails matches. Called once, right after a listing is approved — not
 * on a schedule, so notifications go out immediately rather than on a
 * delay, and we never re-scan the whole listings table.
 */
export async function notifyMatchingSearchAlerts(property: IProperty & { _id: any }) {
  const alerts = await SearchAlert.find({}).lean();

  for (const alert of alerts) {
    if (!matches(property, alert.criteria)) continue;

    const priceText = formatPrice(property.price, property.currency, property.priceQualifier as any);
    const url = `${process.env.NEXTAUTH_URL}/listings/${property._id}`;

    await sendEmail({
      to: alert.email,
      subject: `New match for your saved search: ${alert.label}`,
      html: `
        <p>A new listing matches your saved search "<strong>${alert.label}</strong>":</p>
        <p><strong>${property.title}</strong><br/>
        ${priceText} — ${property.location.city}, ${property.location.state}</p>
        <p><a href="${url}">View this listing</a></p>
        <p style="font-size:12px;color:#888;margin-top:16px;">
          You're receiving this because you saved a search alert on Fabhouse. Manage your alerts at
          ${process.env.NEXTAUTH_URL}/saved-searches.
        </p>
      `,
    }).catch(() => {});
  }
}

function matches(property: any, criteria: Record<string, any>): boolean {
  if (criteria.type && property.type !== criteria.type) return false;
  if (criteria.purpose && property.purpose !== criteria.purpose) return false;
  if (criteria.state && property.location.state.toLowerCase() !== criteria.state.toLowerCase()) return false;

  // Compare on the NGN-normalized price so a search saved in GBP or USD
  // still matches listings priced in a different currency (lib/currency.ts).
  if (criteria.minPrice || criteria.maxPrice) {
    const currency = criteria.priceCurrency ?? "NGN";
    const propertyPriceNGN = property.priceNGN ?? convertToNGN(property.price, property.currency);
    if (criteria.minPrice && propertyPriceNGN < convertToNGN(criteria.minPrice, currency)) return false;
    if (criteria.maxPrice && propertyPriceNGN > convertToNGN(criteria.maxPrice, currency)) return false;
  }

  if (criteria.q) {
    const q = criteria.q.toLowerCase();
    const haystack = `${property.title} ${property.description} ${property.location.city} ${property.location.state}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }

  return true;
}
