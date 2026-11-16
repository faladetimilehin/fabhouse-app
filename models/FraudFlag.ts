import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IFraudFlag extends Document {
  property: Types.ObjectId;
  owner: Types.ObjectId; // Agent being flagged
  flaggedBy: Types.ObjectId; // Admin or user
  reason: string; // "duplicate_listing", "fake_images", "price_mismatch", "inactive_agent", "spam", "other"
  description: string; // Details
  evidence?: string[]; // URLs to evidence
  severity: "low" | "medium" | "high"; // Risk level
  status: "pending" | "investigating" | "resolved" | "dismissed"; // Investigation status
  action?: string; // Action taken (e.g., "listing_removed", "agent_suspended")
  resolvedBy?: Types.ObjectId; // Admin who resolved
  resolvedAt?: Date;
  notes?: string; // Investigation notes
  createdAt: Date;
  updatedAt: Date;
}

const FraudFlagSchema = new Schema<IFraudFlag>(
  {
    property: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    flaggedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: {
      type: String,
      enum: [
        "duplicate_listing",
        "fake_images",
        "price_mismatch",
        "inactive_agent",
        "spam",
        "scam",
        "other",
      ],
      required: true,
    },
    description: { type: String, required: true },
    evidence: [String],
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "investigating", "resolved", "dismissed"],
      default: "pending",
    },
    action: String,
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    resolvedAt: Date,
    notes: String,
  },
  { timestamps: true }
);

FraudFlagSchema.index({ status: 1, severity: -1 });
FraudFlagSchema.index({ owner: 1, createdAt: -1 });
FraudFlagSchema.index({ property: 1 });

export default (mongoose.models.FraudFlag as Model<IFraudFlag>) ||
  mongoose.model<IFraudFlag>("FraudFlag", FraudFlagSchema);
