import mongoose, { Schema, Document, Model, Types } from "mongoose";
import type { PlanTier } from "@/config/features";
import type { MarketCode } from "@/config/markets";
import { MARKETS } from "@/config/markets";

export type UserRole = "buyer" | "agent" | "developer" | "admin";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  countryCode: MarketCode;
  // Email verification
  isEmailVerified: boolean;
  emailVerificationTokenHash?: string;
  emailVerificationExpires?: Date;
  // Trust & verification
  isVerified: boolean; // the "trust badge" from the pitch deck
  isSuspended: boolean; // admin can block a user without deleting their data
  suspendedReason?: string;
  consentedToTermsAt?: Date; // records acceptance of Privacy Policy & Terms
  savedListings: Types.ObjectId[]; // buyer favorites
  verificationDocument?: {
    publicId: string;
    format: string;
    resourceType: "image" | "raw";
    uploadedAt: Date;
  };
  verificationDocUrl?: string; // ID/CAC document submitted for the verified badge
  verificationStatus: "none" | "pending" | "approved" | "rejected";
  verificationRejectedReason?: string;
  // --- billing fields: stored from day one, but ignored while
  // BILLING_ENABLED is false (see lib/billing.ts) ---
  planTier: PlanTier;
  planRenewsAt?: Date;
  paystackCustomerCode?: string;
  processedPlanPaymentReferences: string[];
  // --- password reset ---
  resetPasswordTokenHash?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["buyer", "agent", "developer", "admin"], default: "buyer" },
    phone: { type: String },
    countryCode: { type: String, enum: MARKETS.map((market) => market.code), default: "NG", uppercase: true, trim: true },
    // Email verification
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: { type: String },
    emailVerificationExpires: { type: Date },
    // Trust & verification
    isVerified: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    suspendedReason: { type: String },
    consentedToTermsAt: { type: Date },
    savedListings: [{ type: Schema.Types.ObjectId, ref: "Property" }],
    verificationDocument: {
      publicId: { type: String },
      format: { type: String },
      resourceType: { type: String, enum: ["image", "raw"] },
      uploadedAt: { type: Date },
    },
    verificationDocUrl: { type: String },
    verificationStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    verificationRejectedReason: { type: String },
    planTier: { type: String, enum: ["free", "starter", "professional", "developer"], default: "free" },
    planRenewsAt: { type: Date },
    paystackCustomerCode: { type: String },
    processedPlanPaymentReferences: { type: [String], default: [] },
    resetPasswordTokenHash: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

UserSchema.index({ role: 1, isVerified: 1 });
UserSchema.index({ verificationStatus: 1 }, { sparse: true });
UserSchema.index({ resetPasswordTokenHash: 1 }, { sparse: true });
UserSchema.index({ emailVerificationTokenHash: 1 }, { sparse: true });

export default (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>("User", UserSchema);
