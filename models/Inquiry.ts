import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IInquiry extends Document {
  property: Types.ObjectId;
  buyerName: string;
  buyerContact: string; // email or phone
  message: string;
  reply?: string;
  repliedAt?: Date;
  createdAt: Date;
}

const InquirySchema = new Schema<IInquiry>(
  {
    property: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    buyerName: { type: String, required: true },
    buyerContact: { type: String, required: true },
    message: { type: String, required: true },
    reply: { type: String },
    repliedAt: { type: Date },
  },
  { timestamps: true }
);

export default (mongoose.models.Inquiry as Model<IInquiry>) ||
  mongoose.model<IInquiry>("Inquiry", InquirySchema);
