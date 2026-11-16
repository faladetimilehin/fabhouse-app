import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotificationPreference extends Document {
  userId: mongoose.Types.ObjectId;
  // Email notifications
  emailOnInquiry: boolean; // New inquiry received
  emailOnSavedPriceChange: boolean; // Price drop on saved listing
  emailOnSearchAlert: boolean; // Search alert matches
  emailOnProductUpdates: boolean; // New features/updates
  emailOnMonthlyReport: boolean; // Agent stats report
  // Notification frequency
  inquiryNotification: "instant" | "daily" | "weekly" | "never";
  searchAlertFrequency: "daily" | "weekly" | "never";
  // SMS notifications (optional, future)
  smsOnUrgentInquiry: boolean;
  phoneNumber?: string;
  // Push notifications (future)
  pushEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    emailOnInquiry: { type: Boolean, default: true },
    emailOnSavedPriceChange: { type: Boolean, default: false },
    emailOnSearchAlert: { type: Boolean, default: true },
    emailOnProductUpdates: { type: Boolean, default: true },
    emailOnMonthlyReport: { type: Boolean, default: true },
    inquiryNotification: {
      type: String,
      enum: ["instant", "daily", "weekly", "never"],
      default: "instant",
    },
    searchAlertFrequency: {
      type: String,
      enum: ["daily", "weekly", "never"],
      default: "daily",
    },
    smsOnUrgentInquiry: { type: Boolean, default: false },
    phoneNumber: String,
    pushEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default (mongoose.models.NotificationPreference as Model<INotificationPreference>) ||
  mongoose.model<INotificationPreference>(
    "NotificationPreference",
    NotificationPreferenceSchema
  );
