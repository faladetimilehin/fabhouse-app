import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import SearchAlert from "@/models/SearchAlert";

const createSchema = z.object({
  label: z.string().min(2),
  criteria: z.object({
    q: z.string().optional(),
    type: z.string().optional(),
    purpose: z.string().optional(),
    state: z.string().optional(),
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
    priceCurrency: z.string().optional(),
  }),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  await dbConnect();
  const alerts = await SearchAlert.find({ user: (session.user as any).id }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ alerts });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (!session.user.email) {
    return NextResponse.json({ error: "Your account is missing an email address." }, { status: 400 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await dbConnect();

  const existingCount = await SearchAlert.countDocuments({ user: (session.user as any).id });
  if (existingCount >= 10) {
    return NextResponse.json({ error: "You can save up to 10 search alerts." }, { status: 400 });
  }

  const alert = await SearchAlert.create({
    user: (session.user as any).id,
    email: session.user.email,
    label: parsed.data.label,
    criteria: parsed.data.criteria,
  });

  return NextResponse.json({ alert }, { status: 201 });
}
