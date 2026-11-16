"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Play, Trash2, Star, Eye } from "lucide-react";

interface Video {
  _id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  views: number;
  isHighlight: boolean;
}

interface VideoListingDisplayProps {
  propertyId?: string;
  trending?: boolean;
  isOwner?: boolean;
}

export default function VideoListingDisplay({
  propertyId,
  trending = false,
  isOwner = false,
}: VideoListingDisplayProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    fetchVideos();
  }, [propertyId, trending]);

  const fetchVideos = async () => {
    try {
      let url = "/api/properties/video";
      if (trending) {
        url += "?trending=true";
      } else if (propertyId) {
        url += `?propertyId=${propertyId}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setVideos(data.videos || []);
      }
    } catch (err) {
      console.error("Fetch videos error:", err);
      toast.error("Failed to load videos");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (videoId: string) => {
    if (!confirm("Delete this video?")) return;

    try {
      const res = await fetch(
        `/api/properties/video?videoId=${videoId}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        setVideos(videos.filter((v) => v._id !== videoId));
        toast.success("Video deleted");
      } else {
        toast.error("Failed to delete video");
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Error deleting video");
    }
  };

  const handleToggleHighlight = async (videoId: string, isHighlight: boolean) => {
    try {
      const res = await fetch(`/api/properties/video`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          isHighlight: !isHighlight,
        }),
      });

      if (res.ok) {
        setVideos(
          videos.map((v) =>
            v._id === videoId ? { ...v, isHighlight: !isHighlight } : v
          )
        );
        toast.success(
          !isHighlight ? "Video highlighted!" : "Highlight removed"
        );
      }
    } catch (err) {
      console.error("Toggle highlight error:", err);
      toast.error("Error updating video");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-600">
        No videos {trending ? "yet" : "for this property"}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selected Video Player */}
      {selectedVideo && (
        <div className="bg-black rounded-lg overflow-hidden mb-6">
          <div className="relative bg-black pt-[56.25%]">
            <video
              key={selectedVideo._id}
              controls
              className="absolute inset-0 w-full h-full"
              poster={selectedVideo.thumbnailUrl}
            >
              <source src={selectedVideo.videoUrl} type="video/mp4" />
            </video>
          </div>

          <div className="bg-gray-900 p-4 text-white">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-lg">{selectedVideo.title}</h3>
                {selectedVideo.description && (
                  <p className="text-sm text-gray-400 mt-1">
                    {selectedVideo.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedVideo(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Eye size={16} />
                {selectedVideo.views} views
              </span>
              <span>{Math.floor(selectedVideo.duration / 60)}:
                {String(selectedVideo.duration % 60).padStart(2, "0")}</span>
            </div>
          </div>
        </div>
      )}

      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <div
            key={video._id}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Thumbnail */}
            <div
              className="relative bg-black h-40 cursor-pointer group"
              onClick={() => setSelectedVideo(video)}
            >
              {video.thumbnailUrl ? (
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <Play size={32} className="text-white" />
                </div>
              )}

              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                <div className="bg-red-600 rounded-full p-3">
                  <Play size={24} className="text-white fill-white" />
                </div>
              </div>

              {/* Highlight Badge */}
              {video.isHighlight && (
                <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                  <Star size={14} className="fill-current" />
                  Featured
                </div>
              )}

              {/* Duration */}
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {Math.floor(video.duration / 60)}:
                {String(video.duration % 60).padStart(2, "0")}
              </div>
            </div>

            {/* Info */}
            <div className="p-3">
              <h4 className="font-semibold text-navy line-clamp-2 mb-1">
                {video.title}
              </h4>
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {video.description}
              </p>

              <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                <Eye size={14} />
                {video.views} views
              </div>

              {isOwner && (
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handleToggleHighlight(video._id, video.isHighlight)
                    }
                    className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-colors ${
                      video.isHighlight
                        ? "bg-red-50 text-red-600 hover:bg-red-100"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <Star size={14} className="inline mr-1" />
                    {video.isHighlight ? "Unfeature" : "Feature"}
                  </button>
                  <button
                    onClick={() => handleDelete(video._id)}
                    className="px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
