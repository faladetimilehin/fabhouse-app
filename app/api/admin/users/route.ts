import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import escapeStringRegexp from "escape-string-regexp";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import Property from "@/models/Property";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const role = searchParams.get("role");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = 20;

  const filter: Record<string, any> = {};
  if (role) filter.role = role;
  if (q) {
    const regex = new RegExp(escapeStringRegexp(q.trim()), "i");
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .select("-passwordHash -resetPasswordTokenHash")
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();

  // Listing counts per user, in one aggregation rather than N queries.
  const userIds = users.map((u: any) => u._id);
  const counts = await Property.aggregate([
    { $match: { owner: { $in: userIds } } },
    { $group: { _id: "$owner", count: { $sum: 1 } } },
  ]);
  const countByUser: Record<string, number> = {};
  counts.forEach((c: any) => { countByUser[c._id.toString()] = c.count; });

  const enriched = users.map((u: any) => ({
    ...u,
    _id: u._id.toString(),
    listingCount: countByUser[u._id.toString()] ?? 0,
  }));

  return NextResponse.json({
    users: enriched,
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  });
}
