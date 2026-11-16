import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { canPerform } from "@/lib/billing";
import Property from "@/models/Property";
import User from "@/models/User";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = z.object({ featured: z.boolean() }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Choose whether this listing should be featured." }, { status: 400 });

  await dbConnect();
  const { id } = await params;
  const property = await Property.findById(id);
  if (!property) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  const userId = (session.user as any).id;
  const isAdmin = (session.user as any).role === "admin";
  if (!isAdmin && property.owner.toString() !== userId) {
    return NextResponse.json({ error: "You don't have permission to feature this listing." }, { status: 403 });
  }
  if (parsed.data.featured && property.status !== "active") {
    return NextResponse.json({ error: "Only approved, active listings can be featured." }, { status: 400 });
  }

  if (parsed.data.featured && !property.isFeatured && !isAdmin) {
    const user = await User.findById(userId);
    const activeListingCount = await Property.countDocuments({ owner: userId, isFeatured: true, status: "active" });
    const gate = canPerform({ user, activeListingCount, action: "featureListing" });
    if (!gate.allowed) {
      return NextResponse.json(
        { error: gate.reason, upgradeSuggested: gate.upgradeSuggested },
        { status: 402 }
      );
    }
  }

  property.isFeatured = parsed.data.featured;
  await property.save();
  return NextResponse.json({ success: true, isFeatured: property.isFeatured });
}
