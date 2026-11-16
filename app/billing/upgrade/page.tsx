"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { PLAN_CATALOG, BILLING_ENABLED, PlanTier, getMarketPlanPrice } from "@/config/features";
import { Loader2 } from "lucide-react";
import { getMarket } from "@/config/markets";
import { formatPrice } from "@/lib/formatting";

export default function UpgradePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto px-6 py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-gold" />
        </div>
      }
    >
      <UpgradePageInner />
    </Suspense>
  );
}

function UpgradePageInner() {
  const { data: authSession } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [verifying, setVerifying] = useState(false);
  const [loadingTier, setLoadingTier] = useState<PlanTier | null>(null);
  const market = getMarket((authSession?.user as any)?.countryCode);

  const reference = searchParams.get("reference");

  // If Paystack redirected back here with a reference, verify it.
  useEffect(() => {
    if (!reference) return;
    setVerifying(true);
    fetch("/api/billing/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          toast.success(`Upgraded to ${PLAN_CATALOG[data.tier as PlanTier].label}!`);
          router.push("/dashboard");
        } else {
          toast.error(data.error ?? "Payment verification failed.");
        }
      })
      .finally(() => setVerifying(false));
  }, [reference, router]);

  async function startCheckout(tier: PlanTier) {
    if (!authSession?.user) {
      router.push("/login");
      return;
    }
    setLoadingTier(tier);
    const res = await fetch("/api/billing/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier }),
    });
    const data = await res.json();
    setLoadingTier(null);

    if (!res.ok) {
      toast.error(data.error ?? "Couldn't start checkout.");
      return;
    }
    window.location.href = data.authorizationUrl;
  }

  if (!BILLING_ENABLED) {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-navy mb-2">Billing isn't enabled yet</h1>
        <p className="text-navy/60">Everything on Fabhouse is free during launch — there's nothing to upgrade to right now.</p>
      </div>
    );
  }

  if (verifying) {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-gold" />
        <p className="text-navy/60 mt-4">Confirming your payment...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-2xl font-bold text-navy mb-2 text-center">Upgrade your plan</h1>
      <p className="text-center text-sm text-navy/60 mb-6">One-time payment for 30 days. No automatic renewal.</p>
      {!getMarketPlanPrice(market.code, "starter") ? (
        <p className="rounded-lg border border-navy/10 bg-white p-6 text-center text-navy/60">Agent plans are not available in {market.name} yet. Fabhouse will publish local pricing when payment and support are ready.</p>
      ) : <div className="grid md:grid-cols-2 gap-6">
        {(["starter", "professional"] as PlanTier[]).map((tier) => {
          const plan = PLAN_CATALOG[tier];
          const marketPrice = getMarketPlanPrice(market.code, tier as "starter" | "professional");
          if (!marketPrice) return null;
          return (
            <div key={tier} className="bg-white border border-navy/10 rounded-lg p-6">
              <h3 className="font-bold text-navy text-lg">{plan.label}</h3>
              <p className="text-2xl font-bold text-navy mt-1">
                {formatPrice(marketPrice.amount, marketPrice.currency)}<span className="text-sm font-normal text-navy/50">/30 days</span>
              </p>
              <button
                onClick={() => startCheckout(tier)}
                disabled={loadingTier === tier}
                className="mt-4 w-full bg-navy text-white font-semibold py-2.5 rounded-md hover:bg-navy-light transition disabled:opacity-50"
              >
                {loadingTier === tier ? "Redirecting..." : "Pay with Paystack"}
              </button>
            </div>
          );
        })}
      </div>}
    </div>
  );
}
