import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { activateVerifiedPlanPayment } from "@/lib/planPayments";
import PlanPayment from "@/models/PlanPayment";
import { dbConnect } from "@/lib/mongodb";

function matchesSignature(expectedHex: string, providedHex: string) {
  if (!/^[a-f0-9]{128}$/i.test(providedHex)) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const provided = Buffer.from(providedHex, "hex");
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

function verifySignature(request: NextRequest, rawBody: Buffer) {
  const versionedSignature = request.headers.get("paystack-signature");
  const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;

  if (versionedSignature && webhookSecret) {
    let timestamp: string | undefined;
    const signatures: string[] = [];
    for (const field of versionedSignature.split(",")) {
      const separator = field.indexOf("=");
      if (separator < 0) continue;
      const name = field.slice(0, separator).trim();
      const value = field.slice(separator + 1).trim();
      if (name === "t") {
        if (timestamp || !/^\d+$/.test(value)) return false;
        timestamp = value;
      } else if (name === "v1") {
        const keyIdSeparator = value.indexOf(":");
        if (keyIdSeparator > 0) signatures.push(value.slice(keyIdSeparator + 1));
      }
    }
    const seconds = Number(timestamp);
    if (!timestamp || !Number.isFinite(seconds) || Math.abs(Date.now() / 1000 - seconds) > 300) return false;
    const expected = createHmac("sha512", webhookSecret).update(`${timestamp}.`).update(rawBody).digest("hex");
    return signatures.some((signature) => matchesSignature(expected, signature));
  }

  const legacySignature = request.headers.get("x-paystack-signature");
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (legacySignature && secretKey) {
    const expected = createHmac("sha512", secretKey).update(rawBody).digest("hex");
    return matchesSignature(expected, legacySignature);
  }

  return false;
}

export async function POST(request: NextRequest) {
  const rawBody = Buffer.from(await request.arrayBuffer());
  if (!verifySignature(request, rawBody)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let event: { event?: string; data?: Record<string, any> };
  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  if (event.event === "charge.success" && typeof event.data?.reference === "string") {
    const result = await activateVerifiedPlanPayment(event.data.reference, event.data);
    if (!result.ok && result.error === "Could not activate the paid plan.") {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } else if (event.event === "charge.failed" && typeof event.data?.reference === "string") {
    await dbConnect();
    await PlanPayment.updateOne(
      { reference: event.data.reference, status: "pending" },
      { $set: { status: "failed" } }
    );
  }

  return NextResponse.json({ received: true });
}
