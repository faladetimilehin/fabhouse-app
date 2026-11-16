"use client";

import { useState, useRef } from "react";
import { Video, X, Loader2, Film } from "lucide-react";
import toast from "react-hot-toast";

interface VideoUploaderProps {
  videos: string[];
  onChange: (videos: string[]) => void;
  maxVideos?: number;
  maxSizeMb?: number;
}

/**
 * Uploads video walkthroughs directly to Cloudinary from the browser,
 * same unsigned-upload pattern as ImageUploader but pointed at Cloudinary's
 * video endpoint. Reuses the same cloud name / upload preset — no extra
 * setup needed beyond what ImageUploader already requires.
 */
export default function VideoUploader({ videos, onChange, maxVideos = 3, maxSizeMb = 100 }: VideoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const configured = Boolean(cloudName && uploadPreset);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    if (!configured) {
      toast.error("Video upload isn't set up yet — see components/ImageUploader.tsx for the Cloudinary setup (same credentials work for both).");
      return;
    }

    const remainingSlots = maxVideos - videos.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    if (filesToUpload.length < files.length) {
      toast.error(`Only ${maxVideos} videos allowed — uploading the first ${filesToUpload.length}.`);
    }

    const oversized = filesToUpload.filter((f) => f.size > maxSizeMb * 1024 * 1024);
    if (oversized.length > 0) {
      toast.error(`${oversized.map((f) => f.name).join(", ")} is over the ${maxSizeMb}MB limit and won't be uploaded.`);
    }
    const validFiles = filesToUpload.filter((f) => f.size <= maxSizeMb * 1024 * 1024);

    setUploading(true);
    const uploaded: string[] = [];

    for (const file of validFiles) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset!);
        formData.append("folder", "fabhouse-listings/videos");

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        uploaded.push(data.secure_url);
      } catch (err) {
        console.error(err);
        toast.error(`Couldn't upload ${file.name}.`);
      }
    }

    setUploading(false);
    if (uploaded.length > 0) {
      onChange([...videos, ...uploaded]);
      toast.success(`${uploaded.length} video(s) uploaded.`);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeVideo(url: string) {
    onChange(videos.filter((v) => v !== url));
  }

  return (
    <div>
      {!configured && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-2">
          Video upload isn't configured yet. It uses the same Cloudinary credentials as photo upload — see the
          setup notice above, or <code>components/ImageUploader.tsx</code>.
        </p>
      )}

      <div className="space-y-2 mb-3">
        {videos.map((url) => (
          <div key={url} className="relative bg-navy/5 rounded-md overflow-hidden group">
            <video src={url} controls className="w-full max-h-48" />
            <button
              type="button"
              onClick={() => removeVideo(url)}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {videos.length < maxVideos && (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-navy/20 rounded-md flex items-center justify-center gap-2 text-navy/50 hover:border-gold hover:text-gold transition disabled:opacity-50 py-4"
        >
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Video className="w-5 h-5" />}
          <span className="text-sm">{uploading ? "Uploading video..." : "Add a walkthrough video"}</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <p className="text-xs text-navy/40 mt-1 flex items-center gap-1">
        <Film className="w-3 h-3" /> {videos.length}/{maxVideos} videos · up to {maxSizeMb}MB each
      </p>
    </div>
  );
}
