import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IAddressFingerprint extends Document {
  hash: string; // SHA-256 of normalised "address|city|state" string
  normalised: string; // human-readable version for admin display
  listings: Types.ObjectId[];
  firstSeenAt: Date;
}

const AddressFingerprintSchema = new Schema<IAddressFingerprint>({
  hash: { type: String, required: true, unique: true, index: true },
  normalised: { type: String, required: true },
  listings: [{ type: Schema.Types.ObjectId, ref: "Property" }],
  firstSeenAt: { type: Date, default: Date.now },
});

export default (mongoose.models.AddressFingerprint as Model<IAddressFingerprint>) ||
  mongoose.model<IAddressFingerprint>("AddressFingerprint", AddressFingerprintSchema);
