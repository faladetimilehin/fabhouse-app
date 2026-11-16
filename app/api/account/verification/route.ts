import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";

const schema = z.object({ documentUrl: z.string().url() });

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (!["agent", "developer"].includes(role)) {
    return NextResponse.json({ error: "Only agents and developers can submit verification." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please upload a document first." }, { status: 400 });
  }

  await dbConnect();
  const user = await User.findByIdAndUpdate(
    (session.user as any).id,
    {
      verificationDocUrl: parsed.data.documentUrl,
      verificationStatus: "pending",
      verificationRejectedReason: undefined,
    },
    { new: true }
  );

  return NextResponse.json({ verificationStatus: user?.verificationStatus });
}
