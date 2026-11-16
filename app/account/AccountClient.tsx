"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Download, ShieldAlert, Loader2, BadgeCheck, Upload } from "lucide-react";
import ImageUploader from "@/components/ImageUploader";

interface AccountClientProps {
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  verificationStatus: "none" | "pending" | "approved" | "rejected";
  verificationRejectedReason?: string;
}

export default function AccountClient({
  name,
  email,
  role,
  isVerified,
  verificationStatus,
  verificationRejectedReason,
}: AccountClientProps) {
  const [exporting, setExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [docImages, setDocImages] = useState<string[]>([]);
  const [submittingDoc, setSubmittingDoc] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(verificationStatus);

  async function handleExport() {
    setExporting(true);
    const res = await fetch("/api/account/export");
    setExporting(false);

    if (!res.ok) {
      toast.error("Couldn't export your data. Please try again.");
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fabhouse-my-data.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Your data has been downloaded.");
  }

  async function handleDelete() {
    if (!password) {
      toast.error("Enter your password to confirm.");
      return;
    }

    setDeleting(true);
    const res = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    setDeleting(false);

    if (!res.ok) {
      toast.error(data.error ?? "Couldn't delete your account.");
      return;
    }

    toast.success("Your account has been deleted.");
    await signOut({ callbackUrl: "/" });
  }

  async function submitVerification() {
    if (docImages.length === 0) {
      toast.error("Upload a photo of your ID or CAC certificate first.");
      return;
    }

    setSubmittingDoc(true);
    const res = await fetch("/api/account/verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentUrl: docImages[0] }),
    });
    const data = await res.json();
    setSubmittingDoc(false);

    if (!res.ok) {
      toast.error(data.error ?? "Couldn't submit for verification.");
      return;
    }

    setCurrentStatus("pending");
    toast.success("Submitted — we'll review it and email you.");
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-navy mb-1">Account settings</h1>
      <p className="text-navy/60 mb-8">Manage your Fabhouse account and personal data.</p>

      <div className="bg-white border border-navy/10 rounded-lg p-5 mb-6">
        <h2 className="font-semibold text-navy mb-3">Your details</h2>
        <p className="text-sm text-navy/70"><strong>Name:</strong> {name}</p>
        <p className="text-sm text-navy/70"><strong>Email:</strong> {email}</p>
        <p className="text-sm text-navy/70 capitalize"><strong>Role:</strong> {role}</p>
      </div>

      {["agent", "developer"].includes(role) && (
        <div className="bg-white border border-navy/10 rounded-lg p-5 mb-6">
          <h2 className="font-semibold text-navy mb-1 flex items-center gap-2">
            <BadgeCheck className={`w-4 h-4 ${isVerified ? "text-gold" : "text-navy/30"}`} />
            Get verified
          </h2>

          {isVerified ? (
            <p className="text-sm text-green-700 bg-green-50 rounded-md px-3 py-2 mt-2">
              You're verified — the badge shows on your listings and profile.
            </p>
          ) : currentStatus === "pending" ? (
            <p className="text-sm text-navy/60 bg-navy/5 rounded-md px-3 py-2 mt-2">
              Your document is under review. We'll email you once it's checked.
            </p>
          ) : (
            <>
              <p className="text-sm text-navy/60 mb-3">
                Upload a photo of your government ID (agents) or CAC certificate (developers) to get the verified
                badge, which builds trust with buyers who can't meet you in person.
              </p>
              {currentStatus === "rejected" && verificationRejectedReason && (
                <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2 mb-3">
                  Previous submission wasn't approved: {verificationRejectedReason}
                </p>
              )}
              <ImageUploader images={docImages} onChange={setDocImages} maxImages={1} />
              <button
                onClick={submitVerification}
                disabled={submittingDoc}
                className="mt-3 flex items-center gap-2 bg-navy text-white font-semibold px-4 py-2.5 rounded-md hover:bg-navy-light transition disabled:opacity-50"
              >
                <Upload className="w-4 h-4" /> {submittingDoc ? "Submitting..." : "Submit for verification"}
              </button>
            </>
          )}
        </div>
      )}

      <div className="bg-white border border-navy/10 rounded-lg p-5 mb-6">
        <h2 className="font-semibold text-navy mb-1">Your data rights</h2>
        <p className="text-sm text-navy/60 mb-4">
          Under NDPR, you can download a copy of everything we hold about you, any time.
          See our <Link href="/privacy" className="text-gold-dark hover:underline">Privacy Policy</Link> for details.
        </p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 bg-navy text-white font-semibold px-4 py-2.5 rounded-md hover:bg-navy-light transition disabled:opacity-50"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {exporting ? "Preparing download..." : "Download my data"}
        </button>
      </div>

      <div className="bg-white border border-red-200 rounded-lg p-5">
        <h2 className="font-semibold text-red-700 mb-1 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" /> Delete account
        </h2>
        <p className="text-sm text-navy/60 mb-4">
          This permanently deletes your account, your listings, their photos and videos, and any inquiries received
          on them. This can't be undone.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-sm font-semibold text-red-600 hover:text-red-800"
          >
            I want to delete my account
          </button>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-navy">Confirm your password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full border border-navy/15 rounded-md px-3 py-2 text-sm outline-none focus:border-red-400"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-md hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Permanently delete my account"}
              </button>
              <button
                onClick={() => { setShowDeleteConfirm(false); setPassword(""); }}
                className="text-sm font-medium text-navy/60 hover:text-navy px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
