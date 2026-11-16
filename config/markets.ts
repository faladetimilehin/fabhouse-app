export const MARKETS = [
  { code: "NG", name: "Nigeria", currency: "NGN", currencyLabel: "Naira", regionLabel: "State", locale: "en-NG", paidPlans: true },
  { code: "GH", name: "Ghana", currency: "GHS", currencyLabel: "Cedi", regionLabel: "Region", locale: "en-GH", paidPlans: false },
  { code: "KE", name: "Kenya", currency: "KES", currencyLabel: "Kenyan shilling", regionLabel: "County", locale: "en-KE", paidPlans: false },
  { code: "ZA", name: "South Africa", currency: "ZAR", currencyLabel: "Rand", regionLabel: "Province", locale: "en-ZA", paidPlans: false },
] as const;

export type MarketCode = (typeof MARKETS)[number]["code"];
export type MarketCurrency = (typeof MARKETS)[number]["currency"];

export const DEFAULT_MARKET = MARKETS[0];

export function getMarket(code?: string | null) {
  return MARKETS.find((market) => market.code === code?.toUpperCase()) ?? DEFAULT_MARKET;
}

export function isMarketCode(value: string): value is MarketCode {
  return MARKETS.some((market) => market.code === value.toUpperCase());
}
