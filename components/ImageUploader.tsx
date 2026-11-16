"use client";

import { useState, useRef } from "react";
import { UploadCloud, X, Loader2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  listingId?: string; // pass when editing so we exclude self from duplicate check
}

export default function ImageUploader({ images, onChange, maxImages = 8, listingId }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  // map of url -> duplicate count (0 = clean)
  const [duplicateFlags, setDuplicateFlags] = useState<Record<string, number>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const configured = Boolean(cloudName && uploadPreset);

  async function checkDuplicate(url: string) {
    try {
      const res = await fetch("/api/properties/check-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: [url], excludeListingId: listingId }),
      });
      const data = await res.json();
      const match = data.imageDuplicates?.find((d: any) => d.url === url);
      if (match && match.existingCount > 0) {
        setDuplicateFlags((prev) => ({ ...prev, [url]: match.existingCount }));
        toast.error(
          `⚠️ This photo already appears in ${match.existingCount} other listing${match.existingCount > 1 ? "s" : ""}. Using the same photo as another agent may get your listing flagged.`,
          { duration: 6000 }
        );
      }
    } catch {
      // non-blocking — duplicate check failure never stops the upload
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    if (!configured) {
      toast.error("Image upload isn't set up yet — add Cloudinary credentials to .env.local.");
      return;
    }

    const remainingSlots = maxImages - images.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    if (filesToUpload.length < files.length) {
      toast.error(`Only ${maxImages} images allowed — uploading the first ${filesToUpload.length}.`);
    }

    setUploading(true);
    const uploaded: string[] = [];

    for (const file of filesToUpload) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset!);
        formData.append("folder", "fabhouse-listings");

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        uploaded.push(data.secure_url);
      } catch {
        toast.error(`Couldn't upload ${file.name}.`);
      }
    }

    setUploading(false);

    if (uploaded.length > 0) {
      const next = [...images, ...uploaded];
      onChange(next);
      toast.success(`${uploaded.length} photo${uploaded.length > 1 ? "s" : ""} uploaded.`);

      // Check each new upload for visual duplicates (fire-and-forget per image)
      uploaded.forEach((url) => checkDuplicate(url));
    }

    if (inputRef.current) inputRef.current.value = "";
  }

  function removeImage(url: string) {
    onChange(images.filter((img) => img !== url));
    setDuplicateFlags((prev) => {
      const next = { ...prev };
      delete next[url];
      return next;
    });
  }

  return (
    <div>
      {!configured && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-2">
          Image upload isn't configured yet. Add Cloudinary credentials to <code>.env.local</code>.
        </p>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
        {images.map((url) => (
          <div key={url} className="relative aspect-square rounded-md overflow-hidden group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="w-full h-full object-cover" />

            {/* Duplicate warning badge */}
            {duplicateFlags[url] > 0 && (
              <div className="absolute inset-0 bg-amber-900/60 flex flex-col items-center justify-center gap-1 p-1">
                <AlertTriangle className="w-5 h-5 text-amber-300" />
                <span className="text-amber-200 text-[10px] font-bold text-center leading-tight">
                  Used in {duplicateFlags[url]} other listing{duplicateFlags[url] > 1 ? "s" : ""}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={() => removeImage(url)}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition z-10"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="aspect-square border-2 border-dashed border-navy/20 rounded-md flex flex-col items-center justify-center gap-1 text-navy/50 hover:border-gold hover:text-gold transition disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
            <span className="text-xs">{uploading ? "Uploading..." : "Add photo"}</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <p className="text-xs text-navy/40">{images.length}/{maxImages} photos</p>
    </div>
  );
}
