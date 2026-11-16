import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BILLING_ENABLED } from "@/config/features";
import { activateVerifiedPlanPayment } from "@/lib/planPayments";

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
  if (!["agent", "developer"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Agent and developer plans are for property professionals." }, { status: 403 });
  }

  let reference: unknown;
  try {
    reference = (await req.json()).reference;
  } catch {
    return NextResponse.json({ error: "Invalid payment reference." }, { status: 400 });
  }
  if (typeof reference !== "string" || reference.length < 8 || reference.length > 100) {
    return NextResponse.json({ error: "Invalid payment reference." }, { status: 400 });
  }
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "PAYSTACK_SECRET_KEY isn't set." }, { status: 500 });
  }

  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  const data = await res.json();

  if (!data.status || data.data?.status !== "success") {
    return NextResponse.json({ error: "Payment could not be verified." }, { status: 402 });
  }

  const result = await activateVerifiedPlanPayment(reference, data.data);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 403 });

  return NextResponse.json({ success: true, tier: result.tier });
}
