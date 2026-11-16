import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISchool {
  name: string;
  type: "primary" | "secondary" | "tertiary";
  rating: number; // 1-5
  distance: number; // meters from property
}

export interface IHealthcare {
  name: string;
  type: "hospital" | "clinic" | "pharmacy";
  rating: number; // 1-5
  distance: number; // meters
}

export interface ITransport {
  type: "bus" | "train" | "metro" | "taxi";
  name?: string;
  distance: number; // meters
}

export interface IAmenity {
  name: string;
  type: string; // "grocery", "restaurant", "gym", "park", etc.
  distance: number; // meters
}

export interface INeighborhoodData extends Document {
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  address: string;
  state: string;
  lga: string;
  
  // Scores (1-5)
  safetyScore: number;
  walkabilityScore: number;
  developmentScore: number; // How developed/urban
  
  // Details
  schools: ISchool[];
  healthcare: IHealthcare[];
  transport: ITransport[];
  amenities: IAmenity[];
  
  // Demographics
  populationDensity?: string; // "low" | "medium" | "high"
  averageIncome?: string;
  propertyTypes?: string[]; // Common property types in area
  
  // Meta
  lastUpdated: Date;
  source?: string; // "manual" | "api" | "user-contributed"
}

const SchoolSchema = new Schema<ISchool>({
  name: String,
  type: { type: String, enum: ["primary", "secondary", "tertiary"] },
  rating: Number,
  distance: Number,
}, { _id: false });

const HealthcareSchema = new Schema<IHealthcare>({
  name: String,
  type: { type: String, enum: ["hospital", "clinic", "pharmacy"] },
  rating: Number,
  distance: Number,
}, { _id: false });

const TransportSchema = new Schema<ITransport>({
  type: { type: String, enum: ["bus", "train", "metro", "taxi"] },
  name: String,
  distance: Number,
}, { _id: false });

const AmenitySchema = new Schema<IAmenity>({
  name: String,
  type: String,
  distance: Number,
}, { _id: false });

const NeighborhoodDataSchema = new Schema<INeighborhoodData>(
  {
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: [Number], // [longitude, latitude]
    },
    address: String,
    state: String,
    lga: String,
    safetyScore: { type: Number, min: 1, max: 5, default: 3 },
    walkabilityScore: { type: Number, min: 1, max: 5, default: 3 },
    developmentScore: { type: Number, min: 1, max: 5, default: 3 },
    schools: [SchoolSchema],
    healthcare: [HealthcareSchema],
    transport: [TransportSchema],
    amenities: [AmenitySchema],
    populationDensity: { type: String, enum: ["low", "medium", "high"] },
    averageIncome: String,
    propertyTypes: [String],
    lastUpdated: { type: Date, default: Date.now },
    source: { type: String, default: "manual" },
  },
  { timestamps: true }
);

// Geospatial index for proximity queries
NeighborhoodDataSchema.index({ location: "2dsphere" });
// Index for state/lga lookups
NeighborhoodDataSchema.index({ state: 1, lga: 1 });

export default (mongoose.models.NeighborhoodData as Model<INeighborhoodData>) ||
  mongoose.model<INeighborhoodData>("NeighborhoodData", NeighborhoodDataSchema);
