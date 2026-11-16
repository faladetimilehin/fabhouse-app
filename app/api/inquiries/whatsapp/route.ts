import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Inquiry from "@/models/Inquiry";
import Property from "@/models/Property";
import User from "@/models/User";
import { buildWhatsAppLink, formatPropertyInquiryMessage, isValidNigerianPhone } from "@/lib/whatsapp";
import mongoose from "mongoose";

/**
 * Send inquiry to agent via WhatsApp link
 * Returns a WhatsApp deep link that user can click
 */
export async function GET(req: NextRequest) {
  try {
    const inquiryId = req.nextUrl.searchParams.get("inquiryId");

    if (!inquiryId) {
      return NextResponse.json(
        { error: "Inquiry ID required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const inquiry = await Inquiry.findById(inquiryId).populate([
      { path: "property", select: "address price title owner" },
      { path: "buyer", select: "name phone email" },
    ]);

    if (!inquiry) {
      return NextResponse.json(
        { error: "Inquiry not found" },
        { status: 404 }
      );
    }

    // Get agent phone
    const agent = await User.findById(inquiry.property.owner).select("phone");
    
    if (!agent?.phone || !isValidNigerianPhone(agent.phone)) {
      return NextResponse.json(
        { error: "Agent phone number not available or invalid" },
        { status: 400 }
      );
    }

    // Format message
    const message = formatPropertyInquiryMessage(
      inquiry.property.title || inquiry.property.address,
      inquiry.property.price,
      inquiry.property.address,
      inquiry.buyer.name,
      inquiry.message,
      `${process.env.NEXTAUTH_URL}/listings/${inquiry.property._id}`
    );

    // Build WhatsApp link
    const whatsappLink = buildWhatsAppLink(agent.phone, message);

    return NextResponse.json({
      whatsappLink,
      message,
      agentName: agent.name,
      agentPhone: agent.phone,
    });
  } catch (err) {
    console.error("Get WhatsApp link error:", err);
    return NextResponse.json(
      { error: "Failed to generate WhatsApp link" },
      { status: 500 }
    );
  }
}

/**
 * Notify buyer about agent response via WhatsApp
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { inquiryId, responseMessage } = body;

    if (!inquiryId || !responseMessage) {
      return NextResponse.json(
        { error: "Inquiry ID and response message required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const inquiry = await Inquiry.findById(inquiryId).populate([
      { path: "property", select: "title" },
      { path: "buyer", select: "name phone" },
      { path: "agent", select: "name phone" },
    ]);

    if (!inquiry) {
      return NextResponse.json(
        { error: "Inquiry not found" },
        { status: 404 }
      );
    }

    // Get buyer phone
    if (!inquiry.buyer.phone || !isValidNigerianPhone(inquiry.buyer.phone)) {
      return NextResponse.json(
        { error: "Buyer phone number not available or valid" },
        { status: 400 }
      );
    }

    // Format agent response message
    const message = `Hi ${inquiry.buyer.name}! ${inquiry.agent.name} replied to your inquiry:\n\n${responseMessage}\n\nCall/WhatsApp: ${inquiry.agent.phone}`;

    // Build WhatsApp link
    const whatsappLink = buildWhatsAppLink(inquiry.buyer.phone, message);

    return NextResponse.json({
      success: true,
      whatsappLink,
      message,
    });
  } catch (err) {
    console.error("Send WhatsApp response error:", err);
    return NextResponse.json(
      { error: "Failed to send WhatsApp message" },
      { status: 500 }
    );
  }
}
