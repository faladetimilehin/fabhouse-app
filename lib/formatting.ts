export const CURRENCY_SYMBOL: Record<string, string> = { NGN: "\u20a6", GBP: "\u00a3", USD: "$" };

const QUALIFIER_PREFIX: Record<string, string> = {
  fixed: "",
  negotiable: "",
  offers_over: "Offers Over ",
  offers_in_region_of: "Offers in Region of ",
  guide_price: "Guide Price ",
  poa: "",
};

const QUALIFIER_SUFFIX: Record<string, string> = {
  negotiable: " (Negotiable)",
};

export function formatPrice(price: number, currency: string, qualifier?: string): string {
  if (qualifier === "poa") return "Price on Application";
  const symbol = CURRENCY_SYMBOL[currency] ?? "";
  const prefix = qualifier ? QUALIFIER_PREFIX[qualifier] ?? "" : "";
  const suffix = qualifier ? QUALIFIER_SUFFIX[qualifier] ?? "" : "";
  return `${prefix}${symbol}${price.toLocaleString()}${suffix}`;
}

const TENURE_LABEL: Record<string, string> = {
  c_of_o: "C of O (Certificate of Occupancy)",
  governors_consent: "Governor's Consent",
  freehold: "Freehold",
  leasehold: "Leasehold",
  not_applicable: "Not applicable",
};

export function formatTenure(tenure?: string): string | null {
  if (!tenure) return null;
  return TENURE_LABEL[tenure] ?? tenure;
}

export function formatSize(sqFt?: number): { sqFt: string; sqM: string } | null {
  if (!sqFt) return null;
  const sqM = sqFt * 0.092903;
  return {
    sqFt: `${sqFt.toLocaleString()} sq ft`,
    sqM: `${Math.round(sqM).toLocaleString()} sq m`,
  };
}

export function formatReducedDate(date?: string | Date): string | null {
  if (!date) return null;
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}
