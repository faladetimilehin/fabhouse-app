"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { Send, Phone, MapPin, X, Paperclip } from "lucide-react";

interface Message {
  _id: string;
  sender: { name: string };
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface Conversation {
  _id: string;
  participants: Array<{ _id: string; name: string; email: string; image?: string }>;
  lastMessage?: string;
  lastMessageAt?: Date;
  property?: { address: string; price: number };
  unreadCount?: { [key: string]: number };
}

interface ChatUIProps {
  otherUserId: string;
  propertyId?: string;
  onClose?: () => void;
}

export default function ChatUI({
  otherUserId,
  propertyId,
  onClose,
}: ChatUIProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversation();
  }, [otherUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversation = async () => {
    try {
      const res = await fetch(`/api/chat`);
      if (res.ok) {
        const data = await res.json();
        const conv = data.conversations?.find((c: any) =>
          c.participants.some((p: any) => p._id === otherUserId)
        );
        setConversation(conv);
        setOtherUser(
          conv?.participants?.find((p: any) => p._id === otherUserId)
        );

        if (conv) {
          fetchMessages(conv._id);
        }
      }
    } catch (err) {
      console.error("Fetch conversation error:", err);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const res = await fetch(
        `/api/chat?conversationId=${conversationId}`
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Fetch messages error:", err);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const res = await fetch(`/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otherUserId,
          propertyId,
          content: newMessage,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setNewMessage("");

        if (!conversation) {
          setConversation({
            _id: data.conversationId,
            participants: [],
            lastMessage: newMessage,
          });
        }

        // Add message to UI
        setMessages([
          ...messages,
          {
            _id: data.message._id,
            sender: { name: (session?.user as any)?.name || "You" },
            content: newMessage,
            isRead: true,
            createdAt: new Date().toISOString(),
          },
        ]);

        toast.success("Message sent!");
      } else {
        toast.error("Failed to send message");
      }
    } catch (err) {
      console.error("Send message error:", err);
      toast.error("Error sending message");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-navy to-blue-600 text-white p-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{otherUser?.name || "Chat"}</h3>
          {conversation?.property && (
            <p className="text-xs text-blue-100 flex items-center gap-1 mt-1">
              <MapPin size={12} />
              {conversation.property.address}
            </p>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Phone size={32} className="mx-auto mb-2 opacity-50" />
            <p>Start a conversation</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender.name === (session?.user as any)?.name;
            return (
              <div
                key={msg._id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    isOwn
                      ? "bg-navy text-white rounded-br-none"
                      : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwn ? "text-blue-100" : "text-gray-500"
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="border-t border-gray-200 p-4 bg-white flex gap-2"
      >
        <button
          type="button"
          className="p-2 text-gray-600 hover:text-navy hover:bg-gray-100 rounded"
          title="Attach file"
        >
          <Paperclip size={20} />
        </button>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="p-2 bg-navy text-white rounded hover:bg-navy/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
