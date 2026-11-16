import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import escapeStringRegexp from "escape-string-regexp";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import Property from "@/models/Property";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = 20;

  const filter: Record<string, any> = {};
  if (status) filter.status = status;
  if (q) {
    const regex = new RegExp(escapeStringRegexp(q.trim()), "i");
    filter.$or = [{ title: regex }, { "location.city": regex }, { "location.state": regex }];
  }

  const total = await Property.countDocuments(filter);
  const properties = await Property.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .populate("owner", "name email isVerified")
    .lean();

  return NextResponse.json({
    properties,
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  });
}
