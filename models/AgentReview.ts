import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IAgentReview extends Document {
  reviewer: Types.ObjectId; // User who wrote review (buyer)
  agent: Types.ObjectId; // Agent being reviewed
  property: Types.ObjectId; // Property associated with review (verified purchase)
  rating: number; // 1-5 stars
  categories: {
    communication: number; // 1-5
    responsiveness: number; // 1-5
    accuracy: number; // 1-5 (accuracy of listing description)
    professionalism: number; // 1-5
  };
  title: string;
  text: string;
  verifiedPurchase: boolean; // Only verified buyers can review
  helpful: number; // How many found helpful
  createdAt: Date;
  updatedAt: Date;
}

const AgentReviewSchema = new Schema<IAgentReview>(
  {
    reviewer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    agent: { type: Schema.Types.ObjectId, ref: "User", required: true },
    property: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    categories: {
      communication: { type: Number, min: 1, max: 5, default: 3 },
      responsiveness: { type: Number, min: 1, max: 5, default: 3 },
      accuracy: { type: Number, min: 1, max: 5, default: 3 },
      professionalism: { type: Number, min: 1, max: 5, default: 3 },
    },
    title: { type: String, required: true, trim: true },
    text: { type: String, required: true },
    verifiedPurchase: { type: Boolean, default: false },
    helpful: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes for quick lookups
AgentReviewSchema.index({ agent: 1, rating: -1 }); // Reviews by agent, sorted by rating
AgentReviewSchema.index({ agent: 1, createdAt: -1 }); // Recent reviews
AgentReviewSchema.index({ reviewer: 1, agent: 1 }, { unique: true }); // One review per reviewer per agent
AgentReviewSchema.index({ property: 1 }); // Reviews for specific property

export default (mongoose.models.AgentReview as Model<IAgentReview>) ||
  mongoose.model<IAgentReview>("AgentReview", AgentReviewSchema);
