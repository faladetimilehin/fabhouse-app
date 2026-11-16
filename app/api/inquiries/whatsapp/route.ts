import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import Inquiry from "@/models/Inquiry";
import Property from "@/models/Property";
import User from "@/models/User";
import { buildWhatsAppLink, formatPropertyInquiryMessage, isValidNigerianPhone } from "@/lib/whatsapp";

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

    const inquiry = await Inquiry.findById(inquiryId);

    if (!inquiry) {
      return NextResponse.json(
        { error: "Inquiry not found" },
        { status: 404 }
      );
    }

    const property = await Property.findById(inquiry.property).select(
      "owner title price address"
    );
    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    // Get agent phone
    const agent = await User.findById(property.owner).select("phone");
    
    if (!agent?.phone || !isValidNigerianPhone(agent.phone)) {
      return NextResponse.json(
        { error: "Agent phone number not available or invalid" },
        { status: 400 }
      );
    }

    // Format message
    const propertyAddress =
      property.location.address ||
      `${property.location.city}, ${property.location.state}`;
    const message = formatPropertyInquiryMessage(
      property.title || propertyAddress,
      property.price,
      propertyAddress,
      inquiry.buyerName,
      inquiry.message,
      `${process.env.NEXTAUTH_URL}/listings/${property._id}`
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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { inquiryId, responseMessage } = body;

    if (!inquiryId || !responseMessage) {
      return NextResponse.json(
        { error: "Inquiry ID and response message required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const inquiry = await Inquiry.findById(inquiryId);

    if (!inquiry) {
      return NextResponse.json(
        { error: "Inquiry not found" },
        { status: 404 }
      );
    }

    const property = await Property.findById(inquiry.property).select(
      "title owner"
    );
    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    const isAdmin = (session.user as any).role === "admin";
    if (!isAdmin && property.owner.toString() !== (session.user as any).id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const agent = await User.findById(property.owner).select("name phone");
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Get buyer phone
    if (!isValidNigerianPhone(inquiry.buyerContact)) {
      return NextResponse.json(
        { error: "Buyer phone number not available or valid" },
        { status: 400 }
      );
    }

    // Format agent response message
    const message = `Hi ${inquiry.buyerName}! ${agent.name} replied to your inquiry about ${property.title}:\n\n${responseMessage}\n\nCall/WhatsApp: ${agent.phone || ""}`;

    // Build WhatsApp link
    const whatsappLink = buildWhatsAppLink(inquiry.buyerContact, message);

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
