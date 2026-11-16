import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IImageFingerprint extends Document {
  pHash: string;          // 16-char hex = 64-bit perceptual hash
  cloudinaryIds: string[]; // public_ids that produced this (or near) hash
  listings: Types.ObjectId[];
  firstSeenAt: Date;
}

const ImageFingerprintSchema = new Schema<IImageFingerprint>({
  pHash: { type: String, required: true, index: true },
  cloudinaryIds: [{ type: String }],
  listings: [{ type: Schema.Types.ObjectId, ref: "Property" }],
  firstSeenAt: { type: Date, default: Date.now },
});

export default (mongoose.models.ImageFingerprint as Model<IImageFingerprint>) ||
  mongoose.model<IImageFingerprint>("ImageFingerprint", ImageFingerprintSchema);
