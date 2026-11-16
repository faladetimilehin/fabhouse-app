import mongoose from "mongoose";
import { PlanTier } from "@/config/features";
import { dbConnect } from "@/lib/mongodb";
import PlanPayment from "@/models/PlanPayment";
import User from "@/models/User";
import { getMarket } from "@/config/markets";

type PaystackTransaction = {
  id?: number;
  reference?: string;
  status?: string;
  amount?: number;
  currency?: string;
  metadata?: { userId?: string; tier?: string };
  customer?: { customer_code?: string };
};

export async function activateVerifiedPlanPayment(reference: string, transaction: PaystackTransaction) {
  if (transaction.reference !== reference || transaction.status !== "success") {
    return { ok: false as const, error: "Payment could not be verified." };
  }

  const userId = transaction.metadata?.userId;
  const tier = transaction.metadata?.tier as PlanTier | undefined;
  if (!userId || (tier !== "starter" && tier !== "professional")) {
    return { ok: false as const, error: "This payment doesn't match a valid Fabhouse plan." };
  }

  await dbConnect();
  const payment = await PlanPayment.findOne({ reference });
  if (
    !payment ||
    payment.user.toString() !== userId ||
    payment.tier !== tier ||
    (payment.amountMinor ?? payment.amountKobo) !== transaction.amount ||
    payment.currency !== transaction.currency ||
    payment.status === "failed"
  ) {
    return { ok: false as const, error: "Payment record doesn't match this account and plan." };
  }

  if (payment.status !== "succeeded") {
    const objectId = new mongoose.Types.ObjectId(userId);
    const user = await User.findById(objectId).select("countryCode");
    if (!user) return { ok: false as const, error: "Fabhouse account not found." };
    const paymentMarketCode = payment.marketCode ?? user.countryCode;
    if (
      paymentMarketCode !== user.countryCode ||
      !getMarket(paymentMarketCode).paidPlans
    ) {
      return { ok: false as const, error: "Paid plans are not available in this account's market." };
    }

    const now = new Date();
    const result = await User.collection.updateOne(
      { _id: objectId, processedPlanPaymentReferences: { $ne: reference } },
      [{
        $set: {
          planTier: tier,
          planRenewsAt: {
            $dateAdd: {
              startDate: { $max: [{ $ifNull: ["$planRenewsAt", now] }, now] },
              unit: "month",
              amount: 1,
            },
          },
          processedPlanPaymentReferences: {
            $setUnion: [{ $ifNull: ["$processedPlanPaymentReferences", []] }, [reference]],
          },
          ...(transaction.customer?.customer_code
            ? { paystackCustomerCode: transaction.customer.customer_code }
            : {}),
        },
      }]
    );

    if (result.matchedCount === 0) {
      const alreadyApplied = await User.exists({ _id: objectId, processedPlanPaymentReferences: reference });
      if (!alreadyApplied) return { ok: false as const, error: "Could not activate the paid plan." };
    }
  }

  await PlanPayment.updateOne(
    { reference, status: { $ne: "succeeded" } },
    {
      $set: {
        status: "succeeded",
        paystackTransactionId: transaction.id,
        paidAt: new Date(),
      },
    }
  );

  return { ok: true as const, tier };
}
