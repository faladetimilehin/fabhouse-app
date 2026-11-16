"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Loader2, BadgeCheck, ShieldOff, ShieldCheck } from "lucide-react";
import AdminNav from "../AdminNav";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  isSuspended: boolean;
  listingCount: number;
  createdAt: string;
}

const ROLE_STYLE: Record<string, string> = {
  buyer: "bg-navy/10 text-navy",
  agent: "bg-blue-50 text-blue-700",
  developer: "bg-purple-50 text-purple-700",
  admin: "bg-gold/20 text-gold-dark",
};

export default function AdminUsersClient({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setUsers(null);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (role) params.set("role", role);
    params.set("page", String(page));

    fetch(`/api/admin/users?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.users ?? []);
        setTotalPages(data.pagination?.totalPages ?? 1);
        setTotal(data.pagination?.total ?? 0);
      });
  }, [q, role, page]);

  useEffect(() => { load(); }, [load]);

  async function updateUser(id: string, patch: Record<string, any>, successMessage: string) {
    setBusyId(id);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setBusyId(null);

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Couldn't update user.");
      return;
    }

    toast.success(successMessage);
    load();
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-navy mb-1">Admin</h1>
      <AdminNav />

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder="Search name or email..."
          className="flex-1 min-w-[200px] border border-navy/15 rounded-md px-3 py-2 text-sm outline-none focus:border-gold"
        />
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1); }}
          className="border border-navy/15 rounded-md px-3 py-2 text-sm outline-none focus:border-gold"
        >
          <option value="">All roles</option>
          <option value="buyer">Buyers</option>
          <option value="agent">Agents</option>
          <option value="developer">Developers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <p className="text-navy/60 text-sm mb-4">{total} user{total === 1 ? "" : "s"}</p>

      {users === null ? (
        <div className="text-center py-16"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gold" /></div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-navy/10 text-navy/60">
          No users match.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-navy/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-navy/5 text-navy/60 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Listings</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u._id === currentUserId;
                const busy = busyId === u._id;
                return (
                  <tr key={u._id} className="border-t border-navy/10">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 font-medium text-navy">
                        {u.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-gold" />}
                        {u.name}
                        {u.isSuspended && (
                          <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded ml-1">Suspended</span>
                        )}
                      </div>
                      <p className="text-xs text-navy/40">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${ROLE_STYLE[u.role]}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-navy/70">
                      {u.listingCount > 0 ? (
                        <Link href={`/admin/listings?q=${encodeURIComponent(u.name)}`} className="hover:underline">
                          {u.listingCount}
                        </Link>
                      ) : (
                        0
                      )}
                    </td>
                    <td className="px-4 py-3 text-navy/50 text-xs">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 justify-end flex-wrap">
                        <button
                          disabled={busy}
                          onClick={() =>
                            updateUser(
                              u._id,
                              { isVerified: !u.isVerified },
                              u.isVerified ? "Verification removed." : "User verified."
                            )
                          }
                          className="text-xs font-medium text-navy/70 hover:text-navy disabled:opacity-50"
                        >
                          {u.isVerified ? "Unverify" : "Verify"}
                        </button>
                        {isSelf ? (
                          <span className="text-xs text-navy/30">(you)</span>
                        ) : (
                          <button
                            disabled={busy}
                            onClick={() =>
                              updateUser(
                                u._id,
                                { isSuspended: !u.isSuspended },
                                u.isSuspended ? "User unsuspended." : "User suspended."
                              )
                            }
                            className={`flex items-center gap-1 text-xs font-medium disabled:opacity-50 ${
                              u.isSuspended ? "text-green-700 hover:text-green-800" : "text-red-500 hover:text-red-700"
                            }`}
                          >
                            {u.isSuspended ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldOff className="w-3.5 h-3.5" />}
                            {u.isSuspended ? "Unsuspend" : "Suspend"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
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
