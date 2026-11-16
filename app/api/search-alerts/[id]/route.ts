import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import SearchAlert from "@/models/SearchAlert";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  await dbConnect();
  const alert = await SearchAlert.findById(params.id);
  if (!alert) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (alert.user.toString() !== (session.user as any).id) {
    return NextResponse.json({ error: "You don't have permission to delete this alert." }, { status: 403 });
  }

  await SearchAlert.findByIdAndDelete(params.id);
  return NextResponse.json({ success: true });
}
