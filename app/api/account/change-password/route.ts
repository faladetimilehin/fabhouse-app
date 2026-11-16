import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/[a-z]/, "Must contain lowercase")
    .regex(/[0-9]/, "Must contain a number"),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Password does not meet requirements." }, { status: 400 });
  }

  await dbConnect();
  const user = await User.findById((session.user as any).id);
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  if (user.passwordHash.startsWith("oauth:")) {
    return NextResponse.json({ error: "Google sign-in accounts don't have a password to change." }, { status: 400 });
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });

  user.passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await user.save();

  return NextResponse.json({ success: true });
}
