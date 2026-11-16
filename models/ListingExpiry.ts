import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IListingExpiry extends Document {
  property: Types.ObjectId; // Reference to Property
  owner: Types.ObjectId; // Agent/Developer who owns the listing
  expiresAt: Date; // When the listing expires
  isActive: boolean; // Whether it's still active
  autoRenew: boolean; // Auto-renew when expired
  renewalDays?: number; // Days to renew for (default 30)
  renewalCount: number; // How many times renewed
  remindersSent: number; // How many reminder emails sent
  lastReminderAt?: Date; // Last reminder sent
  lastRenewalAt?: Date; // Last renewal date
  createdAt: Date;
  updatedAt: Date;
}

const ListingExpirySchema = new Schema<IListingExpiry>(
  {
    property: { type: Schema.Types.ObjectId, ref: "Property", required: true, unique: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    expiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    autoRenew: { type: Boolean, default: false },
    renewalDays: { type: Number, default: 30 },
    renewalCount: { type: Number, default: 0 },
    remindersSent: { type: Number, default: 0 },
    lastReminderAt: Date,
    lastRenewalAt: Date,
  },
  { timestamps: true }
);

// Index for expiry checks
ListingExpirySchema.index({ owner: 1, expiresAt: 1, isActive: 1 });
ListingExpirySchema.index({ expiresAt: 1, isActive: 1 }); // For bulk expiry checks

// TTL index: auto-remove expired records after 90 days
ListingExpirySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 7776000 });

export default (mongoose.models.ListingExpiry as Model<IListingExpiry>) ||
  mongoose.model<IListingExpiry>("ListingExpiry", ListingExpirySchema);
