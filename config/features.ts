import type { MarketCode, MarketCurrency } from "@/config/markets";

/**
 * FABHOUSE FEATURE FLAGS
 * -----------------------------------------------------------------------
 * This file is the single source of truth for what's "free" vs "paid"
 * on Fabhouse.
 *
 * TODAY: BILLING_ENABLED is false, so every gated check in lib/billing.ts
 * resolves to "allowed" and users never see a paywall.
 *
 * BILLING GO-LIVE REQUIRES:
 * 1. Set NEXT_PUBLIC_BILLING_ENABLED=true only after pricing and support are approved.
 * 2. Configure Paystack keys and POST /api/billing/webhook in the Paystack dashboard.
 * 3. Verify test payments, webhook signatures, access expiry, and support/refund steps.
 * -----------------------------------------------------------------------
 */

export const BILLING_ENABLED =
  process.env.NEXT_PUBLIC_BILLING_ENABLED === "true" || false;

// Plan tiers — these mirror the packages in the Fabhouse client proposal.
export type PlanTier = "free" | "starter" | "professional" | "developer";
export type PaidPlanTier = "starter" | "professional";

export interface MarketPlanPrice {
  amount: number;
  currency: MarketCurrency;
}

// Proposals are kept separate from payable prices so a global billing flag
// cannot accidentally expose an unvalidated price.
export const DRAFT_MARKET_PLAN_PRICES: Record<MarketCode, Partial<Record<PaidPlanTier, MarketPlanPrice>>> = {
  NG: {
    starter: { amount: 15_000, currency: "NGN" },
    professional: { amount: 50_000, currency: "NGN" },
  },
  GH: {},
  KE: {},
  ZA: {},
};

// Add prices here only after market pricing, payment, and support are approved.
export const MARKET_PLAN_PRICES: Record<MarketCode, Partial<Record<PaidPlanTier, MarketPlanPrice>>> = {
  NG: {},
  GH: {},
  KE: {},
  ZA: {},
};

export function getMarketPlanPrice(marketCode: string, tier: PaidPlanTier): MarketPlanPrice | null {
  return MARKET_PLAN_PRICES[marketCode.toUpperCase() as MarketCode]?.[tier] ?? null;
}

export interface PlanLimits {
  tier: PlanTier;
  label: string;
  maxActiveListings: number; // Infinity = unlimited
  featuredSlots: number;
  diasporaCampaign: boolean;
}

// While BILLING_ENABLED is false, every user is effectively on this plan,
// regardless of what's stored on their account.
export const UNRESTRICTED_PLAN: PlanLimits = {
  tier: "free",
  label: "Free (Launch Period)",
  maxActiveListings: Infinity,
  featuredSlots: Infinity,
  diasporaCampaign: true,
};

// The real plan definitions, used once BILLING_ENABLED = true.
export const PLAN_CATALOG: Record<PlanTier, PlanLimits> = {
  free: {
    tier: "free",
    label: "Free",
    maxActiveListings: 2,
    featuredSlots: 0,
    diasporaCampaign: false,
  },
  starter: {
    tier: "starter",
    label: "Starter",
    maxActiveListings: 5,
    featuredSlots: 0,
    diasporaCampaign: false,
  },
  professional: {
    tier: "professional",
    label: "Professional",
    maxActiveListings: 25,
    featuredSlots: 1,
    diasporaCampaign: true,
  },
  developer: {
    tier: "developer",
    label: "Developer",
    maxActiveListings: Infinity,
    featuredSlots: 5,
    diasporaCampaign: true,
  },
};
