import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import { MARKETS } from "@/config/markets";

const schema = z.object({
  countryCode: z.enum(MARKETS.map((market) => market.code) as [string, ...string[]]),
});

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a supported market." }, { status: 400 });

  await dbConnect();
  const user = await User.findById((session.user as any).id);
  if (!user || user.isSuspended) return NextResponse.json({ error: "Active account required." }, { status: 403 });
  if (user.planTier !== "free" && parsed.data.countryCode !== user.countryCode) {
    return NextResponse.json({ error: "Contact support to change the market on a paid account." }, { status: 409 });
  }

  user.countryCode = parsed.data.countryCode as typeof user.countryCode;
  await user.save();
  return NextResponse.json({ countryCode: user.countryCode });
}
