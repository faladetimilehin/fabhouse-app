export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import Property from "@/models/Property";
import User from "@/models/User";
import Inquiry from "@/models/Inquiry";
import { getEffectivePlan } from "@/lib/billing";
import { BILLING_ENABLED } from "@/config/features";
import { Plus, MessageSquare } from "lucide-react";
import ListingRowActions from "./ListingRowActions";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  sold: "bg-navy/10 text-navy",
  rented: "bg-navy/10 text-navy",
  rejected: "bg-red-100 text-red-800",
  archived: "bg-gray-100 text-gray-600",
};

const PAGE_SIZE = 10;

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const role = (session.user as any).role;
  if (!["agent", "developer", "admin"].includes(role)) redirect("/");

  await dbConnect();
  const userId = (session.user as any).id;
  const dbUser = await User.findById(userId).lean();

  const page = Math.max(1, Number(pageParam ?? "1"));
  const totalListings = await Property.countDocuments({ owner: userId });
  const totalPages = Math.max(1, Math.ceil(totalListings / PAGE_SIZE));

  const listings = await Property.find({ owner: userId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .lean();

  // Inquiry counts per listing on this page, in one query rather than N.
  const listingIds = listings.map((l: any) => l._id);
  const inquiryCounts = await Inquiry.aggregate([
    { $match: { property: { $in: listingIds } } },
    { $group: { _id: "$property", count: { $sum: 1 } } },
  ]);
  const countByListing: Record<string, number> = {};
  inquiryCounts.forEach((c: any) => { countByListing[c._id.toString()] = c.count; });

  const plan = getEffectivePlan(dbUser as any);
  const activeCount = await Property.countDocuments({ owner: userId, status: { $in: ["pending", "active"] } });

  function pageHref(p: number) {
    return `/dashboard?page=${p}`;
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Your listings</h1>
          <p className="text-navy/60 text-sm mt-1">
            {activeCount} active {activeCount === 1 ? "listing" : "listings"}
            {BILLING_ENABLED && plan.maxActiveListings !== Infinity && (
              <> of {plan.maxActiveListings} on your {plan.label} plan</>
            )}
            {!BILLING_ENABLED && <span className="text-gold-dark font-medium"> — unlimited & free during launch</span>}
          </p>
        </div>
        <Link
          href="/dashboard/new"
          className="flex items-center gap-2 bg-navy text-white font-semibold px-4 py-2.5 rounded-md hover:bg-navy-light transition"
        >
          <Plus className="w-4 h-4" /> New listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-navy/10">
          <p className="text-navy/60">You haven't posted any listings yet.</p>
          <Link href="/dashboard/new" className="text-gold-dark font-semibold hover:underline mt-2 inline-block">
            Post your first property →
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-navy/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-navy/5 text-navy/60 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Inquiries</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((l: any) => {
                  const id = l._id.toString();
                  const inquiryCount = countByListing[id] ?? 0;
                  return (
                    <tr key={id} className="border-t border-navy/10">
                      <td className="px-4 py-3">
                        <Link href={`/listings/${id}`} className="font-medium text-navy hover:underline">
                          {l.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 capitalize text-navy/70">{l.type}</td>
                      <td className="px-4 py-3 text-navy/70">{l.currency} {l.price.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLE[l.status]}`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {inquiryCount > 0 ? (
                          <Link
                            href={`/dashboard/inquiries?property=${id}`}
                            className="flex items-center gap-1 text-navy hover:text-gold-dark font-medium"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> {inquiryCount}
                          </Link>
                        ) : (
                          <span className="text-navy/30">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <ListingRowActions id={id} title={l.title} status={l.status} purpose={l.purpose} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Link
                href={pageHref(Math.max(1, page - 1))}
                className={`px-3 py-2 rounded-md text-sm font-semibold border border-navy/15 ${
                  page === 1 ? "pointer-events-none opacity-40" : "hover:bg-navy hover:text-white transition"
                }`}
              >
                Previous
              </Link>
              <span className="text-sm text-navy/60 px-2">Page {page} of {totalPages}</span>
              <Link
                href={pageHref(Math.min(totalPages, page + 1))}
                className={`px-3 py-2 rounded-md text-sm font-semibold border border-navy/15 ${
                  page === totalPages ? "pointer-events-none opacity-40" : "hover:bg-navy hover:text-white transition"
                }`}
              >
                Next
              </Link>
            </div>
          )}

          <div className="mt-4 text-center">
            <Link href="/dashboard/inquiries" className="text-sm text-gold-dark font-semibold hover:underline">
              View all inquiries →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
