"use client";

import { useState, useRef } from "react";
import { Upload, Download, AlertCircle, CheckCircle, Loader } from "lucide-react";
import toast from "react-hot-toast";
import { generateCSVTemplate } from "@/lib/csvParser";

interface UploadResult {
  success: boolean;
  created: number;
  errors: { row: number; error: string }[];
  properties: { id: string; address: string; price: number }[];
}

export default function BulkUploadClient() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        toast.error("Please select a CSV file");
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/properties/bulk-create", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Upload failed");
        setResult(data);
        return;
      }

      toast.success(`Submitted ${data.created} listings for review`);
      setResult(data);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      toast.error("Upload failed");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csv = generateCSVTemplate();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "property-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-navy mb-8">Bulk Upload Properties</h1>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="font-semibold text-blue-900 mb-4">How to use</h2>
        <ol className="space-y-2 text-blue-800 list-decimal list-inside">
          <li>Download the CSV template</li>
          <li>Fill in your property details</li>
          <li>Upload the file to create all listings at once</li>
        </ol>
      </div>

      {/* Template Download */}
      <button
        onClick={downloadTemplate}
        className="flex items-center gap-2 mb-8 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
      >
        <Download size={18} />
        Download CSV Template
      </button>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center mb-8">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />

        {file ? (
          <div>
            <CheckCircle className="mx-auto mb-4 text-green-600" size={48} />
            <p className="text-lg font-semibold text-green-600">{file.name}</p>
            <p className="text-sm text-gray-600">{(file.size / 1024).toFixed(2)} KB</p>
          </div>
        ) : (
          <div>
            <Upload className="mx-auto mb-4 text-gray-400" size={48} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 font-semibold hover:underline mb-2"
            >
              Click to select file
            </button>
            <p className="text-gray-500">or drag and drop</p>
          </div>
        )}
      </div>

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader className="animate-spin" size={20} />
            Uploading...
          </>
        ) : (
          <>
            <Upload size={20} />
            Upload & Create Listings
          </>
        )}
      </button>

      {/* Results */}
      {result && (
        <div className="mt-8">
          {result.success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="font-semibold text-green-900 mb-2">
                    Submitted {result.created} listings for review
                  </h3>
                  <div className="space-y-2 text-sm text-green-800">
                    {result.properties.slice(0, 5).map((prop) => (
                      <div key={prop.id}>
                        ✓ {prop.address} - ₦{prop.price.toLocaleString()}
                      </div>
                    ))}
                    {result.properties.length > 5 && (
                      <div className="text-gray-600">
                        +{result.properties.length - 5} more
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {result.errors && result.errors.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-4">
              <div className="flex items-start gap-4">
                <AlertCircle className="text-yellow-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="font-semibold text-yellow-900 mb-2">
                    {result.errors.length} rows with errors
                  </h3>
                  <div className="space-y-1 text-sm text-yellow-800 max-h-48 overflow-y-auto">
                    {result.errors.map((err, idx) => (
                      <div key={idx}>
                        Row {err.row}: {err.error}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CSV Format Info */}
      <div className="mt-12 bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Required Columns</h3>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <strong>Required:</strong>
            <ul className="mt-2 space-y-1">
              <li>• address</li>
              <li>• price</li>
              <li>• bedrooms</li>
              <li>• bathrooms</li>
              <li>• type</li>
              <li>• purpose</li>
            </ul>
          </div>
          <div>
            <strong>Optional:</strong>
            <ul className="mt-2 space-y-1">
              <li>• description</li>
              <li>• state</li>
              <li>• lga</li>
              <li>• images (comma-separated URLs)</li>
              <li>• amenities (comma-separated)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
