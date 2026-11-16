"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import toast from "react-hot-toast";

interface SaveListingButtonProps {
  propertyId: string;
  initiallySaved?: boolean;
  variant?: "icon" | "full";
}

export default function SaveListingButton({ propertyId, initiallySaved = false, variant = "icon" }: SaveListingButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [saved, setSaved] = useState(initiallySaved);
  const [loading, setLoading] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) {
      router.push("/login");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/account/saved-listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error("Couldn't update saved listings.");
      return;
    }

    setSaved(data.saved);
    toast.success(data.saved ? "Saved to your favorites." : "Removed from favorites.");
  }

  if (variant === "full") {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        className={`flex items-center justify-center gap-2 border font-semibold py-2.5 rounded-md transition disabled:opacity-50 ${
          saved ? "bg-red-50 border-red-200 text-red-600" : "border-navy text-navy hover:bg-navy hover:text-white"
        }`}
      >
        <Heart className={`w-4 h-4 ${saved ? "fill-red-500 text-red-500" : ""}`} />
        {saved ? "Saved" : "Save listing"}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={saved ? "Remove from favorites" : "Save to favorites"}
      className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-sm transition z-10"
    >
      <Heart className={`w-4 h-4 ${saved ? "fill-red-500 text-red-500" : "text-navy/60"}`} />
    </button>
  );
}
