"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Download, ShieldAlert, Loader2, BadgeCheck, Upload } from "lucide-react";
import { MARKETS } from "@/config/markets";

interface AccountClientProps {
  name: string;
  email: string;
  role: string;
  countryCode: string;
  isVerified: boolean;
  verificationStatus: "none" | "pending" | "approved" | "rejected";
  verificationRejectedReason?: string;
  hasVerificationDocument: boolean;
  requiresPasswordForDelete: boolean;
}

export default function AccountClient({
  name,
  email,
  role,
  countryCode,
  isVerified,
  verificationStatus,
  verificationRejectedReason,
  hasVerificationDocument,
  requiresPasswordForDelete,
}: AccountClientProps) {
  const { update: updateSession } = useSession();
  const [exporting, setExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [hasUploadedDocument, setHasUploadedDocument] = useState(hasVerificationDocument);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [submittingDoc, setSubmittingDoc] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(verificationStatus);
  const [marketCode, setMarketCode] = useState(countryCode);
  const [savedMarketCode, setSavedMarketCode] = useState(countryCode);
  const [savingMarket, setSavingMarket] = useState(false);

  async function saveMarket() {
    setSavingMarket(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryCode: marketCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't update your market.");
        return;
      }
      setSavedMarketCode(data.countryCode);
      await updateSession();
      toast.success("Your market has been updated.");
    } catch {
      toast.error("Couldn't reach Fabhouse. Please try again.");
    } finally {
      setSavingMarket(false);
    }
  }

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
    if (requiresPasswordForDelete && !password) {
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
    if (!hasUploadedDocument) {
      toast.error("Upload a photo of your ID or CAC certificate first.");
      return;
    }

    setSubmittingDoc(true);
    const res = await fetch("/api/account/verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
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

  async function uploadVerificationDocument(file?: File) {
    if (!file) return;
    setUploadingDocument(true);
    try {
      const formData = new FormData();
      formData.append("document", file);
      const res = await fetch("/api/account/verification/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't securely upload this document.");
        return;
      }
      setHasUploadedDocument(true);
      toast.success("Document uploaded securely.");
    } catch {
      toast.error("Couldn't reach Fabhouse. Please try again.");
    } finally {
      setUploadingDocument(false);
    }
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
        <div className="mt-4 border-t border-navy/10 pt-4">
          <label htmlFor="account-market" className="text-sm font-medium text-navy">Your market</label>
          <div className="mt-1 flex flex-wrap gap-2">
            <select id="account-market" value={marketCode} onChange={(event) => setMarketCode(event.target.value)} className="min-w-48 border border-navy/15 rounded-md px-3 py-2 text-sm outline-none focus:border-gold">
              {MARKETS.map((market) => <option key={market.code} value={market.code}>{market.name}</option>)}
            </select>
            {marketCode !== savedMarketCode && (
              <button onClick={saveMarket} disabled={savingMarket} className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-50">
                {savingMarket ? "Saving..." : "Save market"}
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-navy/50">Used for local listing defaults and market-specific options.</p>
        </div>
      </div>

      {["agent", "developer"].includes(role) && (
        <div className="bg-white border border-navy/10 rounded-lg p-5 mb-6">
          <h2 className="font-semibold text-navy mb-1 flex items-center gap-2">
            <BadgeCheck className={`w-4 h-4 ${isVerified ? "text-gold" : "text-navy/30"}`} />
            Get verified
          </h2>

          {isVerified ? (
            <p className="text-sm text-green-700 bg-green-50 rounded-md px-3 py-2 mt-2">
              Your submitted identity document has been reviewed. This doesn't verify property ownership or guarantee each listing's accuracy.
            </p>
          ) : currentStatus === "pending" ? (
            <p className="text-sm text-navy/60 bg-navy/5 rounded-md px-3 py-2 mt-2">
              Your document is under review. We'll email you once it's checked.
            </p>
          ) : (
            <>
              <p className="text-sm text-navy/60 mb-3">
                Upload a photo of your government ID (agents) or CAC certificate (developers) to get the verified
                badge. This confirms the submitted identity document, not property ownership or the accuracy of every listing.
              </p>
              {currentStatus === "rejected" && verificationRejectedReason && (
                <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2 mb-3">
                  Previous submission wasn't approved: {verificationRejectedReason}
                </p>
              )}
              <label htmlFor="verification-document" className="block text-sm font-medium text-navy">Identity or business document</label>
              <input
                id="verification-document"
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                onChange={(event) => uploadVerificationDocument(event.target.files?.[0])}
                disabled={uploadingDocument}
                className="mt-2 block w-full text-sm text-navy/70 file:mr-3 file:rounded-md file:border-0 file:bg-navy file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-navy-light disabled:opacity-50"
              />
              <p className="mt-2 text-xs text-navy/50">JPG, PNG or PDF · up to 8 MB. Stored privately, visible to the review team, and deleted after the decision or 30 days if not submitted.</p>
              {hasUploadedDocument && <p className="mt-2 text-sm font-medium text-green-700">Document uploaded and ready to submit.</p>}
              <button
                onClick={submitVerification}
                disabled={submittingDoc || uploadingDocument || !hasUploadedDocument}
                className="mt-3 flex items-center gap-2 bg-navy text-white font-semibold px-4 py-2.5 rounded-md hover:bg-navy-light transition disabled:opacity-50"
              >
                {uploadingDocument ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} {uploadingDocument ? "Uploading securely..." : submittingDoc ? "Submitting..." : "Submit for review"}
              </button>
            </>
          )}
        </div>
      )}

      <div className="bg-white border border-navy/10 rounded-lg p-5 mb-6">
        <h2 className="font-semibold text-navy mb-1">Your data rights</h2>
        <p className="text-sm text-navy/60 mb-4">
          You can download a copy of the account data Fabhouse holds about you at any time.
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
          This permanently deletes your account, your listings and media, your submitted inquiries, saved searches,
          reviews, stay requests, and related support tickets. This can't be undone.
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
            {requiresPasswordForDelete ? (
              <div>
                <label className="text-sm font-medium text-navy">Confirm your password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full border border-navy/15 rounded-md px-3 py-2 text-sm outline-none focus:border-red-400"
                />
              </div>
            ) : (
              <p className="text-sm text-navy/60">Your active Google sign-in session confirms this request.</p>
            )}
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
