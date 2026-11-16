import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import { BILLING_ENABLED } from "@/config/features";

/**
 * Verifies a Paystack transaction reference and, if successful, upgrades
 * the signed-in user's planTier. Call this from the callback page after
 * Paystack redirects back with ?reference=...
 */
export async function POST(req: NextRequest) {
  if (!BILLING_ENABLED) {
    return NextResponse.json({ error: "Billing isn't enabled yet." }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { reference } = await req.json();
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "PAYSTACK_SECRET_KEY isn't set." }, { status: 500 });
  }

  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  const data = await res.json();

  if (!data.status || data.data.status !== "success") {
    return NextResponse.json({ error: "Payment could not be verified." }, { status: 402 });
  }

  const tier = data.data.metadata?.tier;
  if (!tier) {
    return NextResponse.json({ error: "Missing plan info on transaction." }, { status: 400 });
  }

  await dbConnect();
  const renewsAt = new Date();
  renewsAt.setMonth(renewsAt.getMonth() + 1);

  await User.findByIdAndUpdate((session.user as any).id, {
    planTier: tier,
    planRenewsAt: renewsAt,
    paystackCustomerCode: data.data.customer?.customer_code,
  });

  return NextResponse.json({ success: true, tier });
}
