"use client";

import { useEffect, useState } from "react";
import { Copy, Plus, Trash2, Star, AlertCircle, Loader } from "lucide-react";
import toast from "react-hot-toast";

interface Template {
  _id: string;
  name: string;
  description?: string;
  bedrooms?: number;
  bathrooms?: number;
  type?: string;
  amenities?: string[];
  isDefault: boolean;
  usageCount: number;
}

interface ListingTemplatePickerProps {
  onSelectTemplate?: (template: Template) => void;
}

export default function ListingTemplatePicker({
  onSelectTemplate,
}: ListingTemplatePickerProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    bedrooms: "",
    bathrooms: "",
    type: "flat",
    amenities: "",
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/account/templates");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTemplates(data.templates);
    } catch {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!formData.name) {
      toast.error("Name is required");
      return;
    }

    try {
      const res = await fetch("/api/account/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
          bathrooms: formData.bathrooms
            ? parseInt(formData.bathrooms)
            : undefined,
          amenities: formData.amenities
            ? formData.amenities.split(",").map((a) => a.trim())
            : [],
        }),
      });

      if (!res.ok) throw new Error();
      await res.json();

      toast.success("Template created");
      setFormData({
        name: "",
        description: "",
        bedrooms: "",
        bathrooms: "",
        type: "flat",
        amenities: "",
      });
      setShowForm(false);
      fetchTemplates();
    } catch {
      toast.error("Failed to create template");
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Delete this template?")) return;

    try {
      const res = await fetch(`/api/account/templates?templateId=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      toast.success("Template deleted");
      fetchTemplates();
    } catch {
      toast.error("Failed to delete template");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch("/api/account/templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: id, isDefault: true }),
      });

      if (!res.ok) throw new Error();

      toast.success("Default template updated");
      fetchTemplates();
    } catch {
      toast.error("Failed to update template");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Listing Templates</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          New Template
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Create Template</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Template name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="text"
              placeholder="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="number"
              placeholder="Bedrooms"
              value={formData.bedrooms}
              onChange={(e) =>
                setFormData({ ...formData, bedrooms: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="number"
              placeholder="Bathrooms"
              value={formData.bathrooms}
              onChange={(e) =>
                setFormData({ ...formData, bathrooms: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="flat">Flat</option>
              <option value="house">House</option>
              <option value="land">Land</option>
              <option value="commercial">Commercial</option>
            </select>
            <input
              type="text"
              placeholder="Amenities (comma-separated)"
              value={formData.amenities}
              onChange={(e) =>
                setFormData({ ...formData, amenities: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleCreateTemplate}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Create
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Templates List */}
      {templates.length === 0 ? (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
          <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600 font-medium">No templates yet</p>
          <p className="text-gray-500 text-sm">Create one to speed up listing creation</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template._id}
              className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  {template.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {template.description}
                    </p>
                  )}
                </div>
                {template.isDefault && (
                  <Star className="text-yellow-500 flex-shrink-0" size={20} />
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4 text-sm text-gray-600">
                {template.bedrooms && (
                  <div>🛏️ {template.bedrooms} beds</div>
                )}
                {template.bathrooms && (
                  <div>🚿 {template.bathrooms} baths</div>
                )}
                {template.type && <div>🏠 {template.type}</div>}
                <div>#{template.usageCount} used</div>
              </div>

              {template.amenities && template.amenities.length > 0 && (
                <div className="mb-4 text-xs">
                  <p className="text-gray-600 font-medium mb-1">Amenities:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.amenities.slice(0, 3).map((amenity, idx) => (
                      <span
                        key={idx}
                        className="bg-blue-100 text-blue-700 px-2 py-1 rounded"
                      >
                        {amenity}
                      </span>
                    ))}
                    {template.amenities.length > 3 && (
                      <span className="text-gray-500">
                        +{template.amenities.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => onSelectTemplate?.(template)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                >
                  <Copy size={16} />
                  Use
                </button>
                <button
                  onClick={() => handleSetDefault(template._id)}
                  className={`px-3 py-2 text-sm rounded-lg transition ${
                    template.isDefault
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Star size={16} />
                </button>
                <button
                  onClick={() => handleDeleteTemplate(template._id)}
                  className="px-3 py-2 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
