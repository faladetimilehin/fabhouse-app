import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import { getPrivateVerificationDocumentUrl } from "@/lib/cloudinary";

export async function GET() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  await dbConnect();
  const pending = await User.find({ verificationStatus: "pending" })
    .select("name email role verificationDocUrl verificationDocument createdAt")
    .sort({ createdAt: 1 })
    .lean();

  const submissions = pending.map((user: any) => ({
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    documentUrl: user.verificationDocument?.publicId
      ? getPrivateVerificationDocumentUrl(user.verificationDocument, 300)
      : user.verificationDocUrl ?? null,
  }));

  return NextResponse.json({ pending: submissions });
}
