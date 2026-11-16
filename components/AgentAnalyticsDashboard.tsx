"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Eye, MessageSquare, Home, AlertCircle, Loader } from "lucide-react";
import toast from "react-hot-toast";

interface Analytics {
  summary: {
    totalListings: number;
    activeListings: number;
    totalInquiries: number;
    thisMonthInquiries: number;
    lastMonthInquiries: number;
    totalViews: number;
    viewsLastMonth: number;
    conversionRate: string;
    sold: number;
    rented: number;
    featured: number;
  };
  pricing: {
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
  };
  breakdown: {
    byType: Record<string, number>;
    byPurpose: Record<string, number>;
    byStatus: Record<string, number>;
  };
}

export default function AgentAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/admin/analytics/agent");
      if (!res.ok) {
        toast.error("Failed to load analytics");
        return;
      }
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
      toast.error("Error loading analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 flex items-center gap-4">
          <AlertCircle className="text-yellow-600 flex-shrink-0" size={24} />
          <div>
            <h2 className="font-semibold text-yellow-900">No analytics data</h2>
            <p className="text-yellow-800 text-sm">Create some listings to see analytics</p>
          </div>
        </div>
      </div>
    );
  }

  const { summary, pricing, breakdown } = analytics;

  // Data for charts
  const typeData = Object.entries(breakdown.byType).map(([key, value]) => ({
    name: key,
    value,
  }));

  const purposeData = Object.entries(breakdown.byPurpose).map(([key, value]) => ({
    name: key === "sale" ? "For Sale" : "For Rent",
    value,
  }));

  const statusData = Object.entries(breakdown.byStatus).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value,
  }));

  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  const StatCard = ({
    icon: Icon,
    label,
    value,
    subtext,
    color,
  }: {
    icon: any;
    label: string;
    value: string | number;
    subtext?: string;
    color: string;
  }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtext && <p className="text-gray-500 text-sm mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Home}
          label="Active Listings"
          value={summary.activeListings}
          subtext={`of ${summary.totalListings} total`}
          color="bg-blue-500"
        />
        <StatCard
          icon={MessageSquare}
          label="Inquiries (30d)"
          value={summary.lastMonthInquiries}
          subtext={`${summary.conversionRate} conversion rate`}
          color="bg-green-500"
        />
        <StatCard
          icon={Eye}
          label="Views (30d)"
          value={summary.viewsLastMonth}
          subtext={`${(summary.viewsLastMonth / Math.max(summary.lastMonthInquiries, 1)).toFixed(1)} views per inquiry`}
          color="bg-yellow-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Featured"
          value={summary.featured}
          subtext={`Boost visibility`}
          color="bg-purple-500"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-gray-600 text-sm font-medium mb-4">Status Breakdown</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-blue-600">{summary.activeListings}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Sold</p>
              <p className="text-2xl font-bold text-green-600">{summary.sold}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Rented</p>
              <p className="text-2xl font-bold text-orange-600">{summary.rented}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-gray-600 text-sm font-medium mb-4">Price Range</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Minimum</p>
              <p className="text-2xl font-bold text-gray-900">
                ₦{(pricing.minPrice / 1000000).toFixed(1)}M
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Average</p>
              <p className="text-2xl font-bold text-gray-900">
                ₦{(pricing.avgPrice / 1000000).toFixed(1)}M
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Maximum</p>
              <p className="text-2xl font-bold text-gray-900">
                ₦{(pricing.maxPrice / 1000000).toFixed(1)}M
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-gray-600 text-sm font-medium mb-4">Engagement</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Total Inquiries</p>
              <p className="text-2xl font-bold text-blue-600">{summary.totalInquiries}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-purple-600">{summary.totalViews}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg per listing</p>
              <p className="text-2xl font-bold text-gray-900">
                {(summary.totalViews / Math.max(summary.totalListings, 1)).toFixed(0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Property Type Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-gray-900 font-semibold mb-4">Listings by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name} (${entry.value})`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Purpose Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-gray-900 font-semibold mb-4">Sale vs Rent</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={purposeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-gray-900 font-semibold mb-4">Listings by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Inquiry Trend */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-gray-900 font-semibold mb-4">Recent Inquiries</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={[
                { name: "This Month", inquiries: summary.thisMonthInquiries },
                { name: "Last Month", inquiries: summary.lastMonthInquiries },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="inquiries"
                stroke="#f59e0b"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
