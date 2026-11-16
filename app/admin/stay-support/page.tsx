export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import StaySupportClient from "./StaySupportClient";

export default async function StaySupportPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if ((session.user as any).role !== "admin") redirect("/");
  return <StaySupportClient />;
}
