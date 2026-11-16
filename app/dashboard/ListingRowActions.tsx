"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Pencil, Trash2 } from "lucide-react";

interface ListingRowActionsProps {
  id: string;
  title: string;
  status: string;
  purpose: string; // "sale" | "rent" | "shortlet"
}

const OWNER_MANAGEABLE_STATUSES = ["active", "sold", "rented", "archived"];

export default function ListingRowActions({ id, title, status, purpose }: ListingRowActionsProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const completedLabel = purpose === "rent" ? "Rented" : "Sold";
  const completedValue = purpose === "rent" ? "rented" : "sold";
  const canManageStatus = OWNER_MANAGEABLE_STATUSES.includes(status);

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    setDeleting(true);
    const res = await fetch(`/api/properties/${id}`, { method: "DELETE" });
    setDeleting(false);

    if (!res.ok) {
      toast.error("Couldn't delete listing.");
      setConfirming(false);
      return;
    }

    toast.success(`"${title}" deleted.`);
    router.refresh();
  }

  async function handleStatusChange(newStatus: string) {
    if (newStatus === status) return;
    setUpdatingStatus(true);

    const res = await fetch(`/api/properties/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    setUpdatingStatus(false);

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Couldn't update status.");
      return;
    }

    toast.success(`Marked as ${newStatus}.`);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3 justify-end flex-wrap">
      {canManageStatus && (
        <select
          value={status}
          disabled={updatingStatus}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="text-xs border border-navy/15 rounded-md px-2 py-1 outline-none focus:border-gold disabled:opacity-50"
        >
          <option value="active">Active</option>
          <option value={completedValue}>{completedLabel}</option>
          <option value="archived">Withdrawn</option>
        </select>
      )}
      <Link
        href={`/dashboard/edit/${id}`}
        className="flex items-center gap-1 text-navy/70 hover:text-navy text-sm font-medium"
      >
        <Pencil className="w-3.5 h-3.5" /> Edit
      </Link>
      <button
        onClick={handleDelete}
        disabled={deleting}
        onBlur={() => setConfirming(false)}
        className={`flex items-center gap-1 text-sm font-medium disabled:opacity-50 ${
          confirming ? "text-red-700" : "text-red-500 hover:text-red-700"
        }`}
      >
        <Trash2 className="w-3.5 h-3.5" /> {confirming ? "Confirm delete?" : "Delete"}
      </button>
    </div>
  );
}
