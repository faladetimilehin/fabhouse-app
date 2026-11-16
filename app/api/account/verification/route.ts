import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (!["agent", "developer"].includes(role)) {
    return NextResponse.json({ error: "Only agents and developers can submit verification." }, { status: 403 });
  }

  await dbConnect();
  const userId = (session.user as any).id;
  const user = await User.findById(userId).select("isSuspended verificationStatus verificationDocument.publicId");
  if (!user || user.isSuspended) return NextResponse.json({ error: "Active account required." }, { status: 403 });
  if (!user.verificationDocument?.publicId) {
    return NextResponse.json({ error: "Upload a document before submitting for review." }, { status: 400 });
  }
  if (user.verificationStatus === "pending" || user.verificationStatus === "approved") {
    return NextResponse.json({ error: "Your verification is already being reviewed or is complete." }, { status: 409 });
  }

  const submitted = await User.findOneAndUpdate(
    {
      _id: userId,
      isSuspended: { $ne: true },
      verificationStatus: { $nin: ["pending", "approved"] },
      "verificationDocument.publicId": user.verificationDocument.publicId,
    },
    { $set: { verificationStatus: "pending" }, $unset: { verificationRejectedReason: 1 } },
    { new: true }
  ).select("verificationStatus");
  if (!submitted) return NextResponse.json({ error: "Your document changed. Refresh and try again." }, { status: 409 });

  return NextResponse.json({ verificationStatus: submitted.verificationStatus });
}
