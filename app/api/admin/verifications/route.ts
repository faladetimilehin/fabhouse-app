import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  await dbConnect();
  const pending = await User.find({ verificationStatus: "pending" })
    .select("name email role verificationDocUrl createdAt")
    .sort({ createdAt: 1 })
    .lean();

  return NextResponse.json({ pending });
}
