"use client";

import { BILLING_ENABLED, PLAN_CATALOG, getMarketPlanPrice } from "@/config/features";
import { Check } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { getMarket } from "@/config/markets";
import { formatPrice } from "@/lib/formatting";

export default function PricingPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role as string | undefined;
  const currentTier = (session?.user as any)?.planTier as string | undefined;
  const market = getMarket((session?.user as any)?.countryCode);
  const canManageListings = userRole === "agent" || userRole === "developer";
  const isLoggedIn = !!session?.user;

  return (
    <div className="max-w-4xl mx-auto px-6 py-14">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-navy">Pricing</h1>
        {!BILLING_ENABLED ? (
          <p className="text-navy/60 mt-2 max-w-xl mx-auto">
            Fabhouse is free for everyone during launch — unlimited listings, no card required.
            The current plan prices are starting proposals for Nigeria. Local prices and payment options are not available in other markets yet.
          </p>
        ) : (
          <p className="text-navy/60 mt-2">Choose the plan that fits how much you list.</p>
        )}
      </div>

      {!BILLING_ENABLED && (
        <div className="bg-gold/10 border border-gold rounded-lg p-4 text-center mb-10">
          <p className="text-navy font-semibold">🎉 All plans are free right now.</p>
          <p className="text-navy/60 text-sm mt-1">
            You can list as much as you want today. We'll email everyone with plenty of notice before any plan starts being enforced.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {(["free", "starter", "professional"] as const).map((tier) => {
          const plan = PLAN_CATALOG[tier];
          const marketPrice = tier === "free" ? null : getMarketPlanPrice(market.code, tier);
          return (
            <div key={tier} className="bg-white border border-navy/10 rounded-lg p-6 flex flex-col">
              <h3 className="font-bold text-navy text-lg">{plan.label}</h3>
              <p className="text-2xl font-bold text-navy mt-2">
                {tier === "free"
                  ? "Free"
                  : !marketPrice
                    ? "Not available yet"
                    : formatPrice(marketPrice.amount, marketPrice.currency)}
                {marketPrice && <span className="text-sm font-normal text-navy/50">/30 days</span>}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-navy/70 flex-1">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                  {plan.maxActiveListings === Infinity ? "Unlimited active listings" : `Up to ${plan.maxActiveListings} active listings`}
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                  {plan.featuredSlots > 0 ? `${plan.featuredSlots} featured listing slot(s)` : "No featured slots"}
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                  {plan.diasporaCampaign ? "Diaspora campaign placement" : "Standard visibility only"}
                </li>
              </ul>
              
              {isLoggedIn && canManageListings && tier !== "free" && BILLING_ENABLED && !marketPrice ? (
                <button disabled className="mt-6 text-center bg-navy/50 text-white font-semibold py-2.5 rounded-md cursor-not-allowed opacity-75">
                  Plans coming soon in {market.name}
                </button>
              ) : isLoggedIn && canManageListings && tier !== "free" && BILLING_ENABLED && currentTier !== tier ? (
                <Link
                  href={`/billing/upgrade?tier=${tier}`}
                  className="mt-6 text-center bg-navy text-white font-semibold py-2.5 rounded-md hover:bg-navy-light transition"
                >
                  Choose {plan.label}
                </Link>
              ) : isLoggedIn && canManageListings ? (
                <button disabled className="mt-6 text-center bg-navy/50 text-white font-semibold py-2.5 rounded-md cursor-not-allowed opacity-75">
                  {currentTier === tier && BILLING_ENABLED ? "Current plan" : BILLING_ENABLED ? "Included with your account" : "Free during launch"}
                </button>
              ) : isLoggedIn ? (
                <button
                  disabled
                  className="mt-6 text-center bg-navy/50 text-white font-semibold py-2.5 rounded-md cursor-not-allowed opacity-75"
                >
                  {canManageListings ? (BILLING_ENABLED ? "Upgrade your plan" : "Free account active") : "Agent plans only"}
                </button>
              ) : (
                <Link
                  href="/register"
                  className="mt-6 text-center bg-navy text-white font-semibold py-2.5 rounded-md hover:bg-navy-light transition"
                >
                  {BILLING_ENABLED ? "Choose plan" : "Get started free"}
                </Link>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center mt-10">
        {BILLING_ENABLED && (
          <p className="text-navy/60 text-sm mb-4">Each payment gives 30 days of access. Plans do not renew automatically; renew when you choose.</p>
        )}
        <p className="text-navy/60 text-sm">
          Developer / bulk plans are custom —{" "}
          <a href="mailto:hello@fabhouse.ng" className="text-gold-dark font-semibold hover:underline">
            contact us
          </a>.
        </p>
      </div>
    </div>
  );
}
