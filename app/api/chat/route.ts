import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { dbConnect } from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import { ChatConversation, ChatMessage } from "@/models/Chat";
import mongoose from "mongoose";

/**
 * GET - Fetch conversations or messages
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const userId = new mongoose.Types.ObjectId((session.user as any).id);

    const searchParams = req.nextUrl.searchParams;
    const conversationId = searchParams.get("conversationId");

    if (conversationId) {
      // Get messages in conversation
      const messages = await ChatMessage.find({
        conversationId: new mongoose.Types.ObjectId(conversationId),
      })
        .sort({ createdAt: 1 })
        .populate("sender", "name email");

      // Mark as read for current user
      await ChatMessage.updateMany(
        { conversationId: new mongoose.Types.ObjectId(conversationId), receiver: userId, isRead: false },
        { $set: { isRead: true, readAt: new Date() } }
      );

      return NextResponse.json({ messages });
    }

    // Get all conversations for user
    const conversations = await ChatConversation.find({
      participants: userId,
    })
      .sort({ lastMessageAt: -1 })
      .populate("participants", "name email role image")
      .populate("lastMessageFrom", "name")
      .populate("property", "address price");

    return NextResponse.json({ conversations });
  } catch (err) {
    console.error("Fetch chat error:", err);
    return NextResponse.json(
      { error: "Failed to fetch chat" },
      { status: 500 }
    );
  }
}

/**
 * POST - Send message or create conversation
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { otherUserId, propertyId, content, attachments } = body;

    if (!content) {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }

    await dbConnect();
    const senderId = new mongoose.Types.ObjectId((session.user as any).id);
    const receiverId = new mongoose.Types.ObjectId(otherUserId);

    // Find or create conversation
    let conversation = await ChatConversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await ChatConversation.create({
        participants: [senderId, receiverId],
        unreadCount: {},
      });
    }

    const message = await ChatMessage.create({
      conversationId: conversation._id,
      sender: senderId,
      receiver: receiverId,
      content,
      attachments,
      isRead: false,
    });

    // Update conversation
    await ChatConversation.findByIdAndUpdate(conversation._id, {
      lastMessage: content,
      lastMessageAt: new Date(),
      lastMessageFrom: senderId,
      property: propertyId ? new mongoose.Types.ObjectId(propertyId) : undefined,
    });

    return NextResponse.json(
      { success: true, message, conversationId: conversation._id },
      { status: 201 }
    );
  } catch (err) {
    console.error("Send message error:", err);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete message
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const messageId = searchParams.get("messageId");

    if (!messageId) {
      return NextResponse.json({ error: "messageId is required" }, { status: 400 });
    }

    await dbConnect();
    const userId = new mongoose.Types.ObjectId((session.user as any).id);
    const mid = new mongoose.Types.ObjectId(messageId);

    const message = await ChatMessage.findOne({ _id: mid, sender: userId });
    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    await ChatMessage.findByIdAndDelete(mid);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete message error:", err);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}
