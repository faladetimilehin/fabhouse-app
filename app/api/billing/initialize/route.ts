import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BILLING_ENABLED, PLAN_CATALOG, PlanTier } from "@/config/features";

/**
 * Starts a Paystack transaction for a plan upgrade.
 * Inactive while BILLING_ENABLED is false — returns 404 so there's no
 * confusion about a "half-working" payment endpoint being reachable
 * before you're ready to charge anyone.
 */
export async function POST(req: NextRequest) {
  if (!BILLING_ENABLED) {
    return NextResponse.json({ error: "Billing isn't enabled yet." }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { tier } = (await req.json()) as { tier: PlanTier };
  const plan = PLAN_CATALOG[tier];
  if (!plan || plan.priceMonthlyNGN <= 0) {
    return NextResponse.json({ error: "Invalid plan for self-serve checkout." }, { status: 400 });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "PAYSTACK_SECRET_KEY isn't set. Add it to .env.local before enabling billing." },
      { status: 500 }
    );
  }

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: session.user.email,
      amount: plan.priceMonthlyNGN * 100, // Paystack expects kobo
      metadata: { userId: (session.user as any).id, tier },
      callback_url: `${process.env.NEXTAUTH_URL}/billing/upgrade?tier=${tier}`,
    }),
  });

  const data = await res.json();
  if (!data.status) {
    return NextResponse.json({ error: data.message ?? "Couldn't start checkout." }, { status: 502 });
  }

  return NextResponse.json({ authorizationUrl: data.data.authorization_url, reference: data.data.reference });
}
