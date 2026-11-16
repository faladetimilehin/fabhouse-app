import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type AuditAction =
  | "listing_approved"
  | "listing_rejected"
  | "user_verified"
  | "user_unverified"
  | "user_suspended"
  | "user_unsuspended"
  | "verification_approved"
  | "verification_rejected";

export interface IAuditLog extends Document {
  admin: Types.ObjectId;
  adminName: string; // denormalized so the log reads fine even if the admin account is later deleted
  action: AuditAction;
  targetType: "listing" | "user";
  targetId: Types.ObjectId;
  targetLabel: string; // denormalized listing title or user name/email, same reasoning
  reason?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    admin: { type: Schema.Types.ObjectId, ref: "User", required: true },
    adminName: { type: String, required: true },
    action: {
      type: String,
      enum: [
        "listing_approved",
        "listing_rejected",
        "user_verified",
        "user_unverified",
        "user_suspended",
        "user_unsuspended",
        "verification_approved",
        "verification_rejected",
      ],
      required: true,
    },
    targetType: { type: String, enum: ["listing", "user"], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    targetLabel: { type: String, required: true },
    reason: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ createdAt: -1 });

export default (mongoose.models.AuditLog as Model<IAuditLog>) ||
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
