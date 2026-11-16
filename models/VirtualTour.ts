import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IVirtualTour extends Document {
  property: Types.ObjectId;
  owner: Types.ObjectId; // Agent/Developer
  title: string;
  description?: string;
  
  // 360 photos
  photos: {
    url: string;
    title?: string;
    hotspots?: Array<{
      x: number; // 0-100 percentage
      y: number; // 0-100 percentage
      label: string;
      description?: string;
    }>;
  }[];
  
  // Tour sequence
  sequence: Array<{
    photoIndex: number;
    yaw?: number;     // Heading angle 0-360
    pitch?: number;   // Vertical angle -90 to 90
    fov?: number;     // Field of view zoom level
    duration?: number; // Auto-advance duration in ms
  }>;
  
  // Matterport embed (if available)
  matterportUrl?: string;
  
  // Stats
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const HotspotSchema = new Schema({
  x: { type: Number, min: 0, max: 100 },
  y: { type: Number, min: 0, max: 100 },
  label: String,
  description: String,
}, { _id: false });

const PhotoSchema = new Schema({
  url: { type: String, required: true },
  title: String,
  hotspots: [HotspotSchema],
}, { _id: false });

const SequenceSchema = new Schema({
  photoIndex: Number,
  yaw: Number,
  pitch: Number,
  fov: { type: Number, default: 75 },
  duration: Number,
}, { _id: false });

const VirtualTourSchema = new Schema<IVirtualTour>(
  {
    property: { type: Schema.Types.ObjectId, ref: "Property", required: true, unique: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: String,
    photos: [PhotoSchema],
    sequence: [SequenceSchema],
    matterportUrl: String,
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

VirtualTourSchema.index({ property: 1 });
VirtualTourSchema.index({ owner: 1 });

export default (mongoose.models.VirtualTour as Model<IVirtualTour>) ||
  mongoose.model<IVirtualTour>("VirtualTour", VirtualTourSchema);
