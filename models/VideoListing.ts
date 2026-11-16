import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IVideoListing extends Document {
  property: Types.ObjectId;
  owner: Types.ObjectId; // Agent/Developer
  title: string;
  description?: string;
  videoUrl: string; // Cloudinary or other video hosting
  thumbnailUrl?: string;
  duration: number; // seconds
  views: number;
  isHighlight: boolean; // Feature this video
  createdAt: Date;
  updatedAt: Date;
}

const VideoListingSchema = new Schema<IVideoListing>(
  {
    property: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: String,
    videoUrl: { type: String, required: true },
    thumbnailUrl: String,
    duration: { type: Number, required: true },
    views: { type: Number, default: 0 },
    isHighlight: { type: Boolean, default: false },
  },
  { timestamps: true }
);

VideoListingSchema.index({ property: 1 });
VideoListingSchema.index({ owner: 1 });
VideoListingSchema.index({ isHighlight: 1, createdAt: -1 });

export default (mongoose.models.VideoListing as Model<IVideoListing>) ||
  mongoose.model<IVideoListing>("VideoListing", VideoListingSchema);
