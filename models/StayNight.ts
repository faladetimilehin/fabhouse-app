import mongoose, { Model, Schema, Types } from "mongoose";

export interface IStayNight extends mongoose.Document {
  property: Types.ObjectId;
  day: Date;
  source: "host_block" | "host_hold";
  booking?: Types.ObjectId;
  expiresAt?: Date;
  createdAt: Date;
}

const StayNightSchema = new Schema<IStayNight>({
  property: { type: Schema.Types.ObjectId, ref: "Property", required: true },
  day: { type: Date, required: true },
  source: { type: String, enum: ["host_block", "host_hold"], required: true },
  booking: { type: Schema.Types.ObjectId, ref: "StayBooking" },
  expiresAt: { type: Date },
}, { timestamps: { createdAt: true, updatedAt: false } });

// One document per occupied night prevents overlapping host blocks or accepted requests.
StayNightSchema.index({ property: 1, day: 1 }, { unique: true });
StayNightSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });
StayNightSchema.index({ booking: 1 });

export default (mongoose.models.StayNight as Model<IStayNight>) || mongoose.model<IStayNight>("StayNight", StayNightSchema);
