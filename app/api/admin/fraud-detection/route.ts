import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { dbConnect } from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import FraudFlag from "@/models/FraudFlag";
import Property from "@/models/Property";
import User from "@/models/User";
import mongoose from "mongoose";

/**
 * GET - Fetch fraud flags (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status") || "pending";
    const severity = searchParams.get("severity");

    const query: any = { status };
    if (severity) {
      query.severity = severity;
    }

    const flags = await FraudFlag.find(query)
      .sort({ createdAt: -1 })
      .populate("property", "address price owner")
      .populate("owner", "name email role")
      .populate("flaggedBy", "name email")
      .populate("resolvedBy", "name");

    // Get stats
    const stats = {
      pending: await FraudFlag.countDocuments({ status: "pending" }),
      investigating: await FraudFlag.countDocuments({
        status: "investigating",
      }),
      high: await FraudFlag.countDocuments({ severity: "high", status: "pending" }),
    };

    return NextResponse.json({ flags, stats });
  } catch (err) {
    console.error("Fetch fraud flags error:", err);
    return NextResponse.json(
      { error: "Failed to fetch fraud flags" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create fraud flag
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { propertyId, reason, description, evidence, severity } = body;

    if (!propertyId || !reason || !description) {
      return NextResponse.json(
        { error: "propertyId, reason, and description are required" },
        { status: 400 }
      );
    }

    await dbConnect();
    const userId = new mongoose.Types.ObjectId((session.user as any).id);
    const propId = new mongoose.Types.ObjectId(propertyId);

    // Get property owner
    const property = await Property.findById(propId);
    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    const flag = await FraudFlag.create({
      property: propId,
      owner: property.owner,
      flaggedBy: userId,
      reason,
      description,
      evidence: evidence || [],
      severity: severity || "medium",
    });

    return NextResponse.json(
      { success: true, flag },
      { status: 201 }
    );
  } catch (err) {
    console.error("Create fraud flag error:", err);
    return NextResponse.json(
      { error: "Failed to create fraud flag" },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update fraud flag status (admin only)
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { flagId, status, action, notes } = body;

    if (!flagId) {
      return NextResponse.json({ error: "flagId is required" }, { status: 400 });
    }

    await dbConnect();
    const userId = new mongoose.Types.ObjectId((session.user as any).id);

    const updateData: any = {
      status,
      action,
      notes,
    };

    if (status === "resolved" || status === "dismissed") {
      updateData.resolvedBy = userId;
      updateData.resolvedAt = new Date();

      // If action is "listing_removed", deactivate property
      if (action === "listing_removed") {
        const flag = await FraudFlag.findById(flagId);
        await Property.findByIdAndUpdate(flag.property, {
          isActive: false,
          deactivatedReason: "Fraud detected",
        });
      }

      // If action is "agent_suspended", mark agent as suspended
      if (action === "agent_suspended") {
        const flag = await FraudFlag.findById(flagId);
        await User.findByIdAndUpdate(flag.owner, {
          accountStatus: "suspended",
          suspensionReason: "Fraud investigation",
        });
      }
    }

    const updated = await FraudFlag.findByIdAndUpdate(flagId, updateData, {
      new: true,
    });

    return NextResponse.json({ success: true, flag: updated });
  } catch (err) {
    console.error("Update fraud flag error:", err);
    return NextResponse.json(
      { error: "Failed to update fraud flag" },
      { status: 500 }
    );
  }
}
