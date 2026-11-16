import mongoose, { Model, Schema, Types } from "mongoose";

export type StayBookingStatus = "requested" | "accepted_unpaid" | "declined" | "cancelled" | "expired";

export interface IStayBooking extends mongoose.Document {
  property: Types.ObjectId;
  host: Types.ObjectId;
  guest: Types.ObjectId;
  checkIn: Date;
  checkOut: Date;
  guestCount: number;
  guestMessage?: string;
  status: StayBookingStatus;
  holdExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StayBookingSchema = new Schema<IStayBooking>({
  property: { type: Schema.Types.ObjectId, ref: "Property", required: true, index: true },
  host: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  guest: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  guestCount: { type: Number, min: 1, max: 20, required: true },
  guestMessage: { type: String, maxlength: 1000 },
  status: { type: String, enum: ["requested", "accepted_unpaid", "declined", "cancelled", "expired"], default: "requested", index: true },
  holdExpiresAt: { type: Date },
}, { timestamps: true });

StayBookingSchema.index({ host: 1, status: 1, createdAt: -1 });
StayBookingSchema.index({ guest: 1, createdAt: -1 });
StayBookingSchema.index({ property: 1, checkIn: 1, checkOut: 1 });

export default (mongoose.models.StayBooking as Model<IStayBooking>) || mongoose.model<IStayBooking>("StayBooking", StayBookingSchema);
