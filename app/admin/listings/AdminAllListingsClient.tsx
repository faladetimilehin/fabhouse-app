"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import AdminNav from "../AdminNav";

interface AdminProperty {
  _id: string;
  title: string;
  type: string;
  price: number;
  currency: string;
  status: string;
  location: { city: string; state: string };
  owner?: { name: string; email: string; isVerified?: boolean };
}

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  sold: "bg-navy/10 text-navy",
  rented: "bg-navy/10 text-navy",
  rejected: "bg-red-100 text-red-800",
  archived: "bg-gray-100 text-gray-600",
};

export default function AdminAllListingsClient() {
  const [properties, setProperties] = useState<AdminProperty[] | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setProperties(null);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    params.set("page", String(page));

    fetch(`/api/admin/listings?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setProperties(data.properties ?? []);
        setTotalPages(data.pagination?.totalPages ?? 1);
        setTotal(data.pagination?.total ?? 0);
      });
  }, [q, status, page]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-navy mb-1">Admin</h1>
      <AdminNav />

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder="Search title or location..."
          className="flex-1 min-w-[200px] border border-navy/15 rounded-md px-3 py-2 text-sm outline-none focus:border-gold"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="border border-navy/15 rounded-md px-3 py-2 text-sm outline-none focus:border-gold"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="sold">Sold</option>
          <option value="rented">Rented</option>
          <option value="rejected">Rejected</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <p className="text-navy/60 text-sm mb-4">{total} listing{total === 1 ? "" : "s"}</p>

      {properties === null ? (
        <div className="text-center py-16"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gold" /></div>
      ) : properties.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-navy/10 text-navy/60">
          No listings match.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-navy/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-navy/5 text-navy/60 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => (
                <tr key={p._id} className="border-t border-navy/10">
                  <td className="px-4 py-3">
                    <Link href={`/listings/${p._id}`} className="font-medium text-navy hover:underline">
                      {p.title}
                    </Link>
                    <p className="text-xs text-navy/40">{p.location.city}, {p.location.state}</p>
                  </td>
                  <td className="px-4 py-3 text-navy/70">
                    {p.owner?.name ?? "Unknown"}
                    <p className="text-xs text-navy/40">{p.owner?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-navy/70">{p.currency} {p.price.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLE[p.status]}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-2 rounded-md text-sm font-semibold border border-navy/15 disabled:opacity-40 hover:bg-navy hover:text-white transition"
          >
            Previous
          </button>
          <span className="text-sm text-navy/60 px-2">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-2 rounded-md text-sm font-semibold border border-navy/15 disabled:opacity-40 hover:bg-navy hover:text-white transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
