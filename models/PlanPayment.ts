import mongoose, { Model, Schema, Types } from "mongoose";
import type { PlanTier } from "@/config/features";
import type { MarketCode, MarketCurrency } from "@/config/markets";

export interface IPlanPayment extends mongoose.Document {
  reference: string;
  user: Types.ObjectId;
  tier: Exclude<PlanTier, "free" | "developer">;
  marketCode?: MarketCode;
  amountMinor?: number;
  amountKobo?: number; // legacy pending-payment compatibility
  currency: MarketCurrency;
  status: "pending" | "succeeded" | "failed";
  paystackTransactionId?: number;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PlanPaymentSchema = new Schema<IPlanPayment>(
  {
    reference: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tier: { type: String, enum: ["starter", "professional"], required: true },
    marketCode: { type: String, enum: ["NG", "GH", "KE", "ZA"] },
    amountMinor: { type: Number },
    amountKobo: { type: Number },
    currency: { type: String, enum: ["NGN", "GHS", "KES", "ZAR", "GBP", "USD"], required: true },
    status: { type: String, enum: ["pending", "succeeded", "failed"], default: "pending" },
    paystackTransactionId: { type: Number },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

export default (mongoose.models.PlanPayment as Model<IPlanPayment>) ||
  mongoose.model<IPlanPayment>("PlanPayment", PlanPaymentSchema);
