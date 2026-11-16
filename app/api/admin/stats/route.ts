import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import Property from "@/models/Property";
import Inquiry from "@/models/Inquiry";
import AuditLog from "@/models/AuditLog";

export async function GET() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  await dbConnect();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    usersByRole,
    totalListings,
    listingsByStatus,
    inquiriesThisWeek,
    pendingListings,
    pendingVerifications,
    recentAuditEntries,
  ] = await Promise.all([
    User.countDocuments({}),
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    Property.countDocuments({}),
    Property.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Inquiry.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    Property.countDocuments({ status: "pending" }),
    User.countDocuments({ verificationStatus: "pending" }),
    AuditLog.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
  ]);

  const roleMap: Record<string, number> = {};
  usersByRole.forEach((r: any) => { roleMap[r._id] = r.count; });

  const statusMap: Record<string, number> = {};
  listingsByStatus.forEach((s: any) => { statusMap[s._id] = s.count; });

  return NextResponse.json({
    totalUsers,
    usersByRole: roleMap,
    totalListings,
    listingsByStatus: statusMap,
    inquiriesThisWeek,
    pendingListings,
    pendingVerifications,
    adminActionsThisWeek: recentAuditEntries,
  });
}
