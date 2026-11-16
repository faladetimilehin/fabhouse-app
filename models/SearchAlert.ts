import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ISearchAlert extends Document {
  user: Types.ObjectId;
  email: string;
  label: string; // e.g. "3-bed in Lekki under ₦100m"
  criteria: {
    q?: string;
    type?: string;
    purpose?: string;
    state?: string;
    city?: string;
    country?: string;
    minPrice?: number;
    maxPrice?: number;
    priceCurrency?: string;
  };
  lastNotifiedAt?: Date;
  createdAt: Date;
}

const SearchAlertSchema = new Schema<ISearchAlert>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String, required: true },
    label: { type: String, required: true },
    criteria: {
      q: { type: String },
      type: { type: String },
      purpose: { type: String },
      state: { type: String },
      city: { type: String },
      country: { type: String },
      minPrice: { type: Number },
      maxPrice: { type: Number },
      priceCurrency: { type: String },
    },
    lastNotifiedAt: { type: Date },
  },
  { timestamps: true }
);

export default (mongoose.models.SearchAlert as Model<ISearchAlert>) ||
  mongoose.model<ISearchAlert>("SearchAlert", SearchAlertSchema);
