"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Users, Home, MessageSquare, Clock, BadgeCheck, Activity } from "lucide-react";
import AdminNav from "./AdminNav";

interface Stats {
  totalUsers: number;
  usersByRole: Record<string, number>;
  totalListings: number;
  listingsByStatus: Record<string, number>;
  inquiriesThisWeek: number;
  pendingListings: number;
  pendingVerifications: number;
  adminActionsThisWeek: number;
}

function StatCard({ icon: Icon, label, value, href, accent }: { icon: any; label: string; value: number | string; href?: string; accent?: boolean }) {
  const content = (
    <div className={`bg-white border rounded-lg p-5 h-full ${accent ? "border-gold" : "border-navy/10"}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-5 h-5 ${accent ? "text-gold-dark" : "text-navy/40"}`} />
      </div>
      <p className="text-2xl font-bold text-navy">{value}</p>
      <p className="text-sm text-navy/60 mt-0.5">{label}</p>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

export default function AdminOverviewClient() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then(setStats);
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-navy mb-1">Admin</h1>
      <AdminNav />

      {stats === null ? (
        <div className="text-center py-16"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gold" /></div>
      ) : (
        <>
          <h2 className="text-lg font-semibold text-navy mb-4">Needs your attention</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
            <StatCard icon={Clock} label="Listings awaiting review" value={stats.pendingListings} href="/admin/pending" accent={stats.pendingListings > 0} />
            <StatCard icon={BadgeCheck} label="Verifications awaiting review" value={stats.pendingVerifications} href="/admin/verifications" accent={stats.pendingVerifications > 0} />
            <StatCard icon={Activity} label="Admin actions this week" value={stats.adminActionsThisWeek} href="/admin/audit-log" />
          </div>

          <h2 className="text-lg font-semibold text-navy mb-4">Platform at a glance</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
            <StatCard icon={Users} label="Total users" value={stats.totalUsers} href="/admin/users" />
            <StatCard icon={Home} label="Total listings" value={stats.totalListings} href="/admin/listings" />
            <StatCard icon={MessageSquare} label="Inquiries this week" value={stats.inquiriesThisWeek} />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-navy/10 rounded-lg p-5">
              <h3 className="font-semibold text-navy mb-3">Users by role</h3>
              <div className="space-y-2">
                {Object.entries(stats.usersByRole).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-navy/70">{role}</span>
                    <span className="font-semibold text-navy">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-navy/10 rounded-lg p-5">
              <h3 className="font-semibold text-navy mb-3">Listings by status</h3>
              <div className="space-y-2">
                {Object.entries(stats.listingsByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-navy/70">{status}</span>
                    <span className="font-semibold text-navy">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
