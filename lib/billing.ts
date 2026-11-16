import { BILLING_ENABLED, PLAN_CATALOG, UNRESTRICTED_PLAN, PlanLimits } from "@/config/features";
import type { IUser } from "@/models/User";

/**
 * Returns the plan limits that should apply to this user RIGHT NOW.
 * While BILLING_ENABLED is false, everyone gets the unrestricted plan
 * no matter what's on their account — so switching billing on later
 * doesn't require a data migration, just a flag flip.
 */
export function getEffectivePlan(user: Pick<IUser, "planTier" | "planRenewsAt"> | null | undefined): PlanLimits {
  if (!BILLING_ENABLED) return UNRESTRICTED_PLAN;
  let tier = user?.planTier ?? "free";
  if (
    (tier === "starter" || tier === "professional") &&
    (!user?.planRenewsAt || user.planRenewsAt <= new Date())
  ) {
    tier = "free";
  }
  return PLAN_CATALOG[tier] ?? PLAN_CATALOG.free;
}

interface CanPerformArgs {
  user: Pick<IUser, "planTier"> | null | undefined;
  activeListingCount: number;
  action: "createListing" | "featureListing" | "runDiasporaCampaign";
}

interface CanPerformResult {
  allowed: boolean;
  reason?: string;
  upgradeSuggested?: PlanLimits["tier"];
}

/**
 * The single gate every "does this user get to do X" check should go through.
 * Call this from API routes and server components rather than checking
 * plan fields directly — that way BILLING_ENABLED stays the only switch
 * that matters.
 */
export function canPerform({ user, activeListingCount, action }: CanPerformArgs): CanPerformResult {
  const plan = getEffectivePlan(user);

  if (!BILLING_ENABLED) return { allowed: true };

  switch (action) {
    case "createListing":
      if (activeListingCount >= plan.maxActiveListings) {
        return {
          allowed: false,
          reason: `Your ${plan.label} plan allows up to ${plan.maxActiveListings} active listings.`,
          upgradeSuggested: nextTierUp(plan.tier),
        };
      }
      return { allowed: true };

    case "featureListing":
      if (plan.featuredSlots <= 0) {
        return {
          allowed: false,
          reason: `Featured listings aren't included in your ${plan.label} plan.`,
          upgradeSuggested: nextTierUp(plan.tier),
        };
      }
      return { allowed: true };

    case "runDiasporaCampaign":
      if (!plan.diasporaCampaign) {
        return {
          allowed: false,
          reason: `Diaspora campaign placement isn't included in your ${plan.label} plan.`,
          upgradeSuggested: "professional",
        };
      }
      return { allowed: true };

    default:
      return { allowed: true };
  }
}

function nextTierUp(tier: PlanLimits["tier"]): PlanLimits["tier"] {
  const order: PlanLimits["tier"][] = ["free", "starter", "professional", "developer"];
  const idx = order.indexOf(tier);
  return order[Math.min(idx + 1, order.length - 1)];
}
