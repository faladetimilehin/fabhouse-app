import mongoose, { Schema, Document, Model, Types } from "mongoose";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 5);

export type PropertyType = "house" | "flat" | "land" | "shortlet" | "commercial";
export type ListingPurpose = "sale" | "rent" | "shortlet";
export type ListingStatus = "pending" | "active" | "sold" | "rented" | "rejected" | "archived";
export type PriceQualifier = "fixed" | "negotiable" | "offers_over" | "offers_in_region_of" | "guide_price" | "poa";
export type Tenure = "freehold" | "leasehold" | "governors_consent" | "c_of_o" | "not_applicable";

export interface IProperty extends Document {
  title: string;
  description: string;
  type: PropertyType;
  purpose: ListingPurpose;
  price: number;
  priceNGN: number; // denormalized NGN equivalent, for cross-currency price filtering — see lib/currency.ts
  currency: "NGN" | "GBP" | "USD";
  priceQualifier: PriceQualifier;
  priceReducedAt?: Date;
  previousPrice?: number;
  location: {
    state: string;
    city: string;
    address?: string;
    postcode?: string;
    lat?: number;
    lng?: number;
  };
  bedrooms?: number;
  bathrooms?: number;
  sizeSqFt?: number;
  landSize?: string; // free text, since Nigerian land is sold in plots/acres/hectares as often as sqm
  tenure?: Tenure;
  amenities: string[];
  images: string[]; // URLs
  videos: string[]; // hosted video URLs (walkthroughs, virtual tours)
  imageHashes: string[]; // SHA-256 of each image's Cloudinary public_id — for duplicate detection
  addressHash?: string;  // SHA-256 of normalised address|city|state
  owner: Types.ObjectId; // ref User
  status: ListingStatus;
  isFeatured: boolean;
  targetDiaspora: boolean;
  mustSee: boolean;       // admin-flagged "Must See" badge
  pid: string;            // short public ID e.g. "3NLED"
  createdAt: Date;
  updatedAt: Date;
}

const PropertySchema = new Schema<IProperty>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    type: { type: String, enum: ["house", "flat", "land", "shortlet", "commercial"], required: true },
    purpose: { type: String, enum: ["sale", "rent", "shortlet"], required: true },
    price: { type: Number, required: true },
    priceNGN: { type: Number, required: true, index: true },
    currency: { type: String, enum: ["NGN", "GBP", "USD"], default: "NGN" },
    priceQualifier: {
      type: String,
      enum: ["fixed", "negotiable", "offers_over", "offers_in_region_of", "guide_price", "poa"],
      default: "fixed",
    },
    priceReducedAt: { type: Date },
    previousPrice: { type: Number },
    location: {
      state: { type: String, required: true },
      city: { type: String, required: true },
      address: { type: String },
      postcode: { type: String },
      lat: { type: Number },
      lng: { type: Number },
    },
    bedrooms: { type: Number },
    bathrooms: { type: Number },
    sizeSqFt: { type: Number },
    landSize: { type: String },
    tenure: {
      type: String,
      enum: ["freehold", "leasehold", "governors_consent", "c_of_o", "not_applicable"],
    },
    amenities: [{ type: String }],
    images: [{ type: String }],
    videos: [{ type: String }],
    imageHashes: [{ type: String, index: true }],
    addressHash: { type: String, index: true, sparse: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "active", "sold", "rented", "rejected", "archived"],
      default: "pending",
    },
    isFeatured: { type: Boolean, default: false },
    targetDiaspora: { type: Boolean, default: false },
    mustSee: { type: Boolean, default: false },
    pid: { type: String, unique: true, sparse: true, index: true },
  },
  { timestamps: true }
);

// Auto-generate a short PID on first save (like PropertyPro's 3NLED style)
PropertySchema.pre("save", function (next) {
  if (!this.pid) this.pid = nanoid();
  next();
});

PropertySchema.index({ title: "text", description: "text", "location.city": "text", "location.state": "text", "location.address": "text" });
// Compound indexes for the most common query patterns
PropertySchema.index({ status: 1, purpose: 1, "location.state": 1 });
PropertySchema.index({ status: 1, type: 1, priceNGN: 1 });
PropertySchema.index({ owner: 1, status: 1 });
PropertySchema.index({ status: 1, isFeatured: -1, createdAt: -1 });
PropertySchema.index({ "location.lat": 1, "location.lng": 1 }, { sparse: true });

export default (mongoose.models.Property as Model<IProperty>) ||
  mongoose.model<IProperty>("Property", PropertySchema);
