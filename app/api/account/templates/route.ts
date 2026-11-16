import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { dbConnect } from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import ListingTemplate from "@/models/ListingTemplate";
import mongoose from "mongoose";

/**
 * GET - Fetch user's listing templates
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const userId = new mongoose.Types.ObjectId((session.user as any).id);

    const templates = await ListingTemplate.find({ owner: userId }).sort({
      isDefault: -1,
      updatedAt: -1,
    });

    return NextResponse.json({ templates });
  } catch (err) {
    console.error("Fetch templates error:", err);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create new template
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, bedrooms, bathrooms, type, amenities, description_template, isDefault } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    await dbConnect();
    const userId = new mongoose.Types.ObjectId((session.user as any).id);

    // If setting as default, unset previous default
    if (isDefault) {
      await ListingTemplate.updateMany(
        { owner: userId, isDefault: true },
        { isDefault: false }
      );
    }

    const template = await ListingTemplate.create({
      owner: userId,
      name,
      description,
      bedrooms,
      bathrooms,
      type,
      amenities,
      description_template,
      isDefault: isDefault || false,
    });

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (err) {
    console.error("Create template error:", err);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update template
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { templateId, name, description, bedrooms, bathrooms, type, amenities, description_template, isDefault } = body;

    if (!templateId) {
      return NextResponse.json({ error: "templateId is required" }, { status: 400 });
    }

    await dbConnect();
    const userId = new mongoose.Types.ObjectId((session.user as any).id);
    const temId = new mongoose.Types.ObjectId(templateId);

    // Verify ownership
    const template = await ListingTemplate.findOne({ _id: temId, owner: userId });
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // If setting as default, unset previous default
    if (isDefault) {
      await ListingTemplate.updateMany(
        { owner: userId, _id: { $ne: temId }, isDefault: true },
        { isDefault: false }
      );
    }

    const updated = await ListingTemplate.findByIdAndUpdate(
      temId,
      {
        name,
        description,
        bedrooms,
        bathrooms,
        type,
        amenities,
        description_template,
        isDefault,
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      template: updated,
    });
  } catch (err) {
    console.error("Update template error:", err);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete template
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const templateId = searchParams.get("templateId");

    if (!templateId) {
      return NextResponse.json({ error: "templateId is required" }, { status: 400 });
    }

    await dbConnect();
    const userId = new mongoose.Types.ObjectId((session.user as any).id);
    const temId = new mongoose.Types.ObjectId(templateId);

    // Verify ownership
    const template = await ListingTemplate.findOne({ _id: temId, owner: userId });
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    await ListingTemplate.findByIdAndDelete(temId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete template error:", err);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
