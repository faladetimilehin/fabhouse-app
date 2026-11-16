export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import Property from "@/models/Property";
import PropertyCard from "@/components/PropertyCard";
import ReviewsDisplay from "@/components/ReviewsDisplay";
import { BadgeCheck, Phone, Mail, Building2 } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  await dbConnect();
  let agent: any;
  try {
    agent = await User.findById(id).select("name role").lean();
  } catch {
    return { title: "Agent not found | Fabhouse" };
  }
  if (!agent) return { title: "Agent not found | Fabhouse" };

  return {
    title: `${agent.name} | Fabhouse Agent Profile`,
    description: `View listings from ${agent.name} on Fabhouse.`,
  };
}

export default async function AgentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await dbConnect();

  let agent: any;
  try {
    agent = await User.findById(id).select("name role isVerified phone email createdAt").lean();
  } catch {
    notFound();
  }
  if (!agent || !["agent", "developer"].includes(agent.role)) notFound();

  const listings = await Property.find({ owner: id, status: "active" })
    .sort({ isFeatured: -1, createdAt: -1 })
    .lean();

  const soldCount = await Property.countDocuments({ owner: id, status: { $in: ["sold", "rented"] } });
  const memberSince = new Date(agent.createdAt).toLocaleDateString("en-GB", { year: "numeric", month: "long" });

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="bg-white border border-navy/10 rounded-lg p-6 mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-navy">{agent.name}</h1>
              {agent.isVerified && (
                <span className="flex items-center gap-1 bg-gold/20 text-gold-dark text-xs font-bold px-2 py-1 rounded-full">
                  <BadgeCheck className="w-3.5 h-3.5" /> Verified
                </span>
              )}
            </div>
            <p className="text-navy/60 text-sm capitalize mt-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> {agent.role} on Fabhouse since {memberSince}
            </p>
          </div>

          <div className="flex flex-col gap-2 text-sm">
            {agent.phone && (
              <a href={`tel:${agent.phone}`} className="flex items-center gap-1.5 text-navy hover:text-gold-dark">
                <Phone className="w-4 h-4" /> {agent.phone}
              </a>
            )}
            <a href={`mailto:${agent.email}`} className="flex items-center gap-1.5 text-navy hover:text-gold-dark">
              <Mail className="w-4 h-4" /> {agent.email}
            </a>
          </div>
        </div>

        <div className="flex gap-6 mt-4 pt-4 border-t border-navy/10 text-sm text-navy/60">
          <span><strong className="text-navy">{listings.length}</strong> active listings</span>
          <span><strong className="text-navy">{soldCount}</strong> sold / rented</span>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-navy mb-4">Active listings from {agent.name}</h2>

      {listings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-navy/10 text-navy/60">
          No active listings right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((l: any) => (
            <PropertyCard
              key={l._id.toString()}
              property={{ ...l, _id: l._id.toString(), owner: { name: agent.name, isVerified: agent.isVerified } }}
            />
          ))}
        </div>
      )}

      {/* Reviews Section */}
      <div className="mt-12 bg-white rounded-lg border border-navy/10 p-6">
        <h2 className="text-lg font-semibold text-navy mb-6">Agent Reviews & Ratings</h2>
        <ReviewsDisplay agentId={id} />
      </div>
    </div>
  );
}
