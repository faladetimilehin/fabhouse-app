export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import AccountClient from "./AccountClient";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  await dbConnect();
  const user = await User.findById((session.user as any).id)
    .select("countryCode passwordHash verificationStatus isVerified verificationRejectedReason verificationDocument.publicId")
    .lean();

  return (
    <AccountClient
      name={session.user.name ?? ""}
      email={session.user.email ?? ""}
      role={(session.user as any).role}
      countryCode={(user as any)?.countryCode ?? "NG"}
      isVerified={(user as any)?.isVerified ?? false}
      verificationStatus={(user as any)?.verificationStatus ?? "none"}
      verificationRejectedReason={(user as any)?.verificationRejectedReason}
      hasVerificationDocument={Boolean((user as any)?.verificationDocument?.publicId)}
      requiresPasswordForDelete={!String((user as any)?.passwordHash ?? "").startsWith("oauth:google:")}
    />
  );
}
