import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IChatMessage extends Document {
  conversationId: Types.ObjectId;
  sender: Types.ObjectId; // User sending message
  receiver: Types.ObjectId; // User receiving message
  content: string;
  attachments?: Array<{
    url: string;
    type: string; // "image", "document", etc
  }>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatConversation extends Document {
  participants: [Types.ObjectId, Types.ObjectId]; // Buyer and Agent
  lastMessage?: string;
  lastMessageAt?: Date;
  lastMessageFrom?: Types.ObjectId;
  property?: Types.ObjectId; // Property being discussed
  unreadCount: { [key: string]: number }; // Track unread per user
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema({
  url: String,
  type: String, // "image", "file", etc
}, { _id: false });

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "ChatConversation", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    attachments: [AttachmentSchema],
    isRead: { type: Boolean, default: false },
    readAt: Date,
  },
  { timestamps: true }
);

ChatMessageSchema.index({ conversationId: 1, createdAt: -1 });
ChatMessageSchema.index({ sender: 1, receiver: 1 });
ChatMessageSchema.index({ isRead: 1 });

const ChatConversationSchema = new Schema<IChatConversation>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    lastMessage: String,
    lastMessageAt: Date,
    lastMessageFrom: { type: Schema.Types.ObjectId, ref: "User" },
    property: { type: Schema.Types.ObjectId, ref: "Property" },
    unreadCount: {
      type: Map,
      of: Number,
      default: new Map(),
    },
  },
  { timestamps: true }
);

ChatConversationSchema.index({ participants: 1 });
ChatConversationSchema.index({ lastMessageAt: -1 });
ChatConversationSchema.index({ property: 1 });

export const ChatMessage =
  (mongoose.models.ChatMessage as Model<IChatMessage>) ||
  mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);

export const ChatConversation =
  (mongoose.models.ChatConversation as Model<IChatConversation>) ||
  mongoose.model<IChatConversation>("ChatConversation", ChatConversationSchema);
