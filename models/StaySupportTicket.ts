import mongoose, { Model, Schema, Types } from "mongoose";

export type StaySupportCategory = "booking" | "payment" | "safety" | "listing" | "other";

export interface IStaySupportTicket extends mongoose.Document {
  booking: Types.ObjectId;
  reporter: Types.ObjectId;
  category: StaySupportCategory;
  message: string;
  status: "open" | "in_progress" | "resolved";
  staffNote?: string;
  staffResponse?: string;
  assignedTo?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StaySupportTicketSchema = new Schema<IStaySupportTicket>({
  booking: { type: Schema.Types.ObjectId, ref: "StayBooking", required: true, index: true },
  reporter: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  category: { type: String, enum: ["booking", "payment", "safety", "listing", "other"], required: true },
  message: { type: String, required: true, maxlength: 2000 },
  status: { type: String, enum: ["open", "in_progress", "resolved"], default: "open", index: true },
  staffNote: { type: String, maxlength: 2000 },
  staffResponse: { type: String, maxlength: 2000 },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

StaySupportTicketSchema.index({ status: 1, createdAt: 1 });

export default (mongoose.models.StaySupportTicket as Model<IStaySupportTicket>) || mongoose.model<IStaySupportTicket>("StaySupportTicket", StaySupportTicketSchema);
