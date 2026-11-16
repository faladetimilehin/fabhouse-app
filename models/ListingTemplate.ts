import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IListingTemplate extends Document {
  owner: Types.ObjectId; // Agent/Developer who created it
  name: string; // Template name
  description?: string; // Template description
  // Template fields
  bedrooms?: number;
  bathrooms?: number;
  type?: "house" | "flat" | "land" | "commercial";
  amenities?: string[]; // Pre-filled amenities
  description_template?: string; // Pre-filled description text
  // Meta
  usageCount: number; // How many times this template was used
  isDefault: boolean; // User's default template
  createdAt: Date;
  updatedAt: Date;
}

const ListingTemplateSchema = new Schema<IListingTemplate>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    bedrooms: Number,
    bathrooms: Number,
    type: {
      type: String,
      enum: ["house", "flat", "land", "commercial"],
    },
    amenities: [String],
    description_template: String,
    usageCount: { type: Number, default: 0 },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for quick lookup
ListingTemplateSchema.index({ owner: 1, isDefault: 1 });

export default (mongoose.models.ListingTemplate as Model<IListingTemplate>) ||
  mongoose.model<IListingTemplate>("ListingTemplate", ListingTemplateSchema);
