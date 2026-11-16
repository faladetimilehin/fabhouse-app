import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BILLING_ENABLED, PLAN_CATALOG, getMarketPlanPrice } from "@/config/features";
import { randomUUID } from "crypto";
import { z } from "zod";
import { dbConnect } from "@/lib/mongodb";
import PlanPayment from "@/models/PlanPayment";
import User from "@/models/User";
import { getMarket } from "@/config/markets";

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

  if (!["agent", "developer"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Agent and developer plans are for property professionals." }, { status: 403 });
  }

  const parsed = z.object({ tier: z.enum(["starter", "professional"]) }).safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid paid plan." }, { status: 400 });
  const tier = parsed.data.tier as "starter" | "professional";
  const plan = PLAN_CATALOG[tier];
  if (!plan) {
    return NextResponse.json({ error: "Invalid plan for self-serve checkout." }, { status: 400 });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "PAYSTACK_SECRET_KEY isn't set. Add it to .env.local before enabling billing." },
      { status: 500 }
    );
  }

  await dbConnect();
  const payer = await User.findById((session.user as any).id).select("role countryCode isSuspended");
  if (!payer || payer.isSuspended || !["agent", "developer"].includes(payer.role)) {
    return NextResponse.json({ error: "Agent and developer plans are for active property professionals." }, { status: 403 });
  }
  const market = getMarket(payer.countryCode);
  const marketPrice = getMarketPlanPrice(market.code, tier);
  if (!market.paidPlans || !marketPrice) {
    return NextResponse.json({ error: `Paid plans are not available in ${market.name} yet.` }, { status: 403 });
  }

  const reference = `fh_plan_${randomUUID().replaceAll("-", "")}`;
  await PlanPayment.create({
    reference,
    user: (session.user as any).id,
    tier,
    marketCode: market.code,
    amountMinor: marketPrice.amount * 100,
    currency: marketPrice.currency,
    status: "pending",
  });

  try {
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: session.user.email,
        amount: marketPrice.amount * 100,
        currency: marketPrice.currency,
        reference,
        metadata: { userId: (session.user as any).id, tier, marketCode: market.code },
        callback_url: `${process.env.NEXTAUTH_URL}/billing/upgrade?tier=${tier}`,
      }),
    });

    const data = await res.json();
    if (!data.status) {
      await PlanPayment.updateOne({ reference, status: "pending" }, { $set: { status: "failed" } });
      return NextResponse.json({ error: data.message ?? "Couldn't start checkout." }, { status: 502 });
    }

    return NextResponse.json({ authorizationUrl: data.data.authorization_url, reference });
  } catch {
    await PlanPayment.updateOne({ reference, status: "pending" }, { $set: { status: "failed" } });
    return NextResponse.json({ error: "Couldn't reach Paystack. Please try again." }, { status: 502 });
  }
}
