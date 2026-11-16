"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Upload, X, Play, Eye } from "lucide-react";

interface Hotspot {
  x: number;
  y: number;
  label: string;
  description?: string;
}

interface Photo {
  url: string;
  title?: string;
  hotspots?: Hotspot[];
}

interface VirtualTourViewerProps {
  propertyId: string;
  isOwner?: boolean;
}

export default function VirtualTourViewer({
  propertyId,
  isOwner = false,
}: VirtualTourViewerProps) {
  const [tour, setTour] = useState<any>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    fetchTour();
  }, [propertyId]);

  const fetchTour = async () => {
    try {
      const res = await fetch(
        `/api/properties/virtual-tour?propertyId=${propertyId}`
      );
      if (res.ok) {
        const data = await res.json();
        setTour(data.tour);
      } else {
        setTour(null);
      }
    } catch (err) {
      console.error("Fetch tour error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    // In a real app, upload to Cloudinary first
    const newPhotos = Array.from(files).map((file) => ({
      url: URL.createObjectURL(file),
      title: file.name,
    }));

    setPhotos([...photos, ...newPhotos]);
    toast.success(`${newPhotos.length} photos added`);
  };

  const handleSaveTour = async () => {
    if (photos.length === 0) {
      toast.error("Add at least one photo");
      return;
    }

    try {
      const res = tour
        ? await fetch(`/api/properties/virtual-tour`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tourId: tour._id,
              title: tour.title || "Virtual Tour",
              photos: photos.map((p) => ({
                url: p.url,
                title: p.title,
              })),
            }),
          })
        : await fetch(`/api/properties/virtual-tour`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              propertyId,
              title: "Virtual Tour",
              photos: photos.map((p) => ({
                url: p.url,
                title: p.title,
              })),
            }),
          });

      if (res.ok) {
        await fetchTour();
        setIsEditing(false);
        toast.success("Virtual tour saved!");
      } else {
        toast.error("Failed to save tour");
      }
    } catch (err) {
      console.error("Save tour error:", err);
      toast.error("Error saving tour");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96 bg-gray-100 rounded-lg">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!tour && !isOwner) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-600">
        No virtual tour available for this property
      </div>
    );
  }

  if (isEditing || !tour) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-navy">
          {tour ? "Edit Virtual Tour" : "Create Virtual Tour"}
        </h3>

        {/* Photo Gallery */}
        <div className="mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {photos.map((photo, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100"
                >
                  <X size={16} />
                </button>
              </div>
            ))}

            {/* Upload Box */}
            <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500">
              <Upload size={24} className="text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">Add photos</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleUploadPhotos}
                className="hidden"
              />
            </label>
          </div>

          <p className="text-sm text-gray-600 mt-2">
            {photos.length} photo{photos.length !== 1 ? "s" : ""} added
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleSaveTour}
            className="flex-1 bg-navy text-white py-2 rounded-lg hover:bg-navy/90"
          >
            Save Tour
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setPhotos([]);
            }}
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const currentPhoto = tour.photos[currentPhotoIndex];

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Main Image */}
      <div className="relative bg-black h-96 sm:h-96 lg:h-[500px] flex items-center justify-center">
        <img
          src={currentPhoto.url}
          alt={currentPhoto.title}
          className="w-full h-full object-cover"
        />

        {/* Hotspots */}
        {currentPhoto.hotspots?.map((hotspot: Hotspot, idx: number) => (
          <button
            key={idx}
            onClick={() => setSelectedHotspot(hotspot)}
            className="absolute w-6 h-6 bg-yellow-400 rounded-full border-2 border-white shadow-lg hover:scale-110 transition-transform"
            style={{
              left: `${hotspot.x}%`,
              top: `${hotspot.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <Play size={12} className="m-auto text-white" />
          </button>
        ))}

        {/* View Count */}
        <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm">
          <Eye size={16} />
          {tour.views}
        </div>
      </div>

      {/* Hotspot Info */}
      {selectedHotspot && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-4">
          <h4 className="font-semibold text-navy mb-1">{selectedHotspot.label}</h4>
          {selectedHotspot.description && (
            <p className="text-sm text-gray-700">{selectedHotspot.description}</p>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() =>
              setCurrentPhotoIndex((prev) =>
                prev === 0 ? tour.photos.length - 1 : prev - 1
              )
            }
            className="px-4 py-2 bg-navy text-white rounded hover:bg-navy/90"
          >
            ← Previous
          </button>

          <div className="flex-1">
            <div className="flex gap-2 overflow-x-auto">
              {tour.photos.map((photo: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPhotoIndex(idx)}
                  className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                    idx === currentPhotoIndex
                      ? "border-navy"
                      : "border-gray-300 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={photo.url}
                    alt={`Photo ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() =>
              setCurrentPhotoIndex((prev) =>
                prev === tour.photos.length - 1 ? 0 : prev + 1
              )
            }
            className="px-4 py-2 bg-navy text-white rounded hover:bg-navy/90"
          >
            Next →
          </button>
        </div>

        <p className="text-sm text-gray-600 text-center">
          Photo {currentPhotoIndex + 1} of {tour.photos.length}
        </p>
      </div>

      {/* Title & Info */}
      <div className="p-4">
        <h3 className="font-semibold text-navy mb-2">{tour.title}</h3>
        {tour.description && (
          <p className="text-sm text-gray-700">{tour.description}</p>
        )}

        {isOwner && (
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 bg-blue-50 text-blue-600 py-2 rounded hover:bg-blue-100"
            >
              Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
