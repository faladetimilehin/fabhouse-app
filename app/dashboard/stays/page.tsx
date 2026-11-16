export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import Property from "@/models/Property";
import StayManagementClient from "@/components/StayManagementClient";

export default async function StayManagementPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  await dbConnect();
  const listings = await Property.find({ owner: (session.user as any).id, purpose: "shortlet" }).select("title location.city").sort({ title: 1 }).lean();
  return <StayManagementClient listings={listings.map((listing: any) => ({
    _id: listing._id.toString(), title: listing.title, location: listing.location,
  }))} />;
}
