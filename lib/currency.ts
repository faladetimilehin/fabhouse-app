/**
 * Static exchange rates to NGN, used only to make cross-currency price
 * filtering possible (e.g. a buyer searching "under ₦100m" should also
 * match a listing priced in USD or GBP that's roughly equivalent).
 *
 * These are NOT used for anything financial/transactional — Fabhouse
 * doesn't process currency conversion for payments. They only normalize
 * listings onto one scale so min/max price search works across currencies.
 *
 * UPDATE THESE PERIODICALLY. Rates drift; stale rates make search results
 * slightly wrong, not broken — worth reviewing every few months, or wiring
 * up a live FX API (e.g. exchangerate.host) if accuracy becomes important.
 * Last set: July 2026.
 */
export const EXCHANGE_RATES_TO_NGN: Record<string, number> = {
  NGN: 1,
  USD: 1550,
  GBP: 1980,
};

export function convertToNGN(amount: number, currency: string): number {
  const rate = EXCHANGE_RATES_TO_NGN[currency] ?? 1;
  return Math.round(amount * rate);
}

export function convertFromNGN(amountNGN: number, targetCurrency: string): number {
  const rate = EXCHANGE_RATES_TO_NGN[targetCurrency] ?? 1;
  return Math.round(amountNGN / rate);
}
