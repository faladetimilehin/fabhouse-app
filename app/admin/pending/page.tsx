export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import Property from "@/models/Property";
import AdminListingRow from "../AdminListingRow";
import AdminNav from "../AdminNav";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "admin") redirect("/");

  await dbConnect();
  const pending = await Property.find({ status: "pending" })
    .sort({ createdAt: 1 })
    .populate("owner", "name email isVerified")
    .lean();

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-navy mb-1">Admin</h1>
      <AdminNav />

      <h2 className="text-lg font-semibold text-navy mb-1">Listings awaiting review</h2>
      <p className="text-navy/60 mb-6">{pending.length} pending</p>

      {pending.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-navy/10 text-navy/60">
          Nothing to review right now.
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((p: any) => (
            <AdminListingRow
              key={p._id.toString()}
              property={{
                _id: p._id.toString(),
                title: p.title,
                type: p.type,
                price: p.price,
                currency: p.currency,
                location: p.location,
                ownerName: p.owner?.name ?? "Unknown",
                ownerEmail: p.owner?.email ?? "",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
