/**
 * FABHOUSE FEATURE FLAGS
 * -----------------------------------------------------------------------
 * This file is the single source of truth for what's "free" vs "paid"
 * on Fabhouse.
 *
 * TODAY: BILLING_ENABLED is false, so every gated check in lib/billing.ts
 * resolves to "allowed" and users never see a paywall.
 *
 * WHEN YOU'RE READY TO CHARGE:
 * 1. Flip BILLING_ENABLED to true (or set env var NEXT_PUBLIC_BILLING_ENABLED=true)
 * 2. Fill in the Paystack keys in .env.local
 * 3. That's it — every place in the app that calls canPerform() / getPlanLimits()
 *    will start enforcing limits automatically. No other code changes needed.
 * -----------------------------------------------------------------------
 */

export const BILLING_ENABLED =
  process.env.NEXT_PUBLIC_BILLING_ENABLED === "true" || false;

// Plan tiers — these mirror the packages in the Fabhouse client proposal.
export type PlanTier = "free" | "starter" | "professional" | "developer";

export interface PlanLimits {
  tier: PlanTier;
  label: string;
  maxActiveListings: number; // Infinity = unlimited
  featuredSlots: number;
  priceMonthlyNGN: number; // 0 while billing is disabled / for the free tier
  diasporaCampaign: boolean;
}

// While BILLING_ENABLED is false, every user is effectively on this plan,
// regardless of what's stored on their account.
export const UNRESTRICTED_PLAN: PlanLimits = {
  tier: "free",
  label: "Free (Launch Period)",
  maxActiveListings: Infinity,
  featuredSlots: Infinity,
  priceMonthlyNGN: 0,
  diasporaCampaign: true,
};

// The real plan definitions, used once BILLING_ENABLED = true.
export const PLAN_CATALOG: Record<PlanTier, PlanLimits> = {
  free: {
    tier: "free",
    label: "Free",
    maxActiveListings: 2,
    featuredSlots: 0,
    priceMonthlyNGN: 0,
    diasporaCampaign: false,
  },
  starter: {
    tier: "starter",
    label: "Starter",
    maxActiveListings: 5,
    featuredSlots: 0,
    priceMonthlyNGN: 15000,
    diasporaCampaign: false,
  },
  professional: {
    tier: "professional",
    label: "Professional",
    maxActiveListings: 25,
    featuredSlots: 1,
    priceMonthlyNGN: 50000,
    diasporaCampaign: true,
  },
  developer: {
    tier: "developer",
    label: "Developer",
    maxActiveListings: Infinity,
    featuredSlots: 5,
    priceMonthlyNGN: 0, // custom — handled outside self-serve billing
    diasporaCampaign: true,
  },
};
