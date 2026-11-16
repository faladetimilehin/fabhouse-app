"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Bell, Mail, MessageSquare } from "lucide-react";

interface NotificationPreferences {
  emailOnInquiry: boolean;
  emailOnSavedPriceChange: boolean;
  emailOnSearchAlert: boolean;
  emailOnProductUpdates: boolean;
  emailOnMonthlyReport: boolean;
  inquiryNotification: "instant" | "daily" | "weekly" | "never";
  searchAlertFrequency: "daily" | "weekly" | "never";
  smsOnUrgentInquiry: boolean;
  phoneNumber?: string;
  pushEnabled: boolean;
}

export default function NotificationPreferencesClient() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/account/notification-preferences")
      .then((res) => res.json())
      .then((data) => {
        setPreferences({
          emailOnInquiry: data.emailOnInquiry ?? true,
          emailOnSavedPriceChange: data.emailOnSavedPriceChange ?? false,
          emailOnSearchAlert: data.emailOnSearchAlert ?? true,
          emailOnProductUpdates: data.emailOnProductUpdates ?? true,
          emailOnMonthlyReport: data.emailOnMonthlyReport ?? true,
          inquiryNotification: data.inquiryNotification ?? "instant",
          searchAlertFrequency: data.searchAlertFrequency ?? "daily",
          smsOnUrgentInquiry: data.smsOnUrgentInquiry ?? false,
          phoneNumber: data.phoneNumber ?? "",
          pushEnabled: data.pushEnabled ?? false,
        });
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load preferences");
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    if (!preferences) return;

    setSaving(true);
    try {
      const res = await fetch("/api/account/notification-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (!res.ok) throw new Error();

      toast.success("Preferences updated!");
    } catch (err) {
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !preferences) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Email Notifications */}
      <div className="bg-white border border-navy/10 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Mail className="w-5 h-5 text-gold" />
          <h3 className="text-lg font-bold text-navy">Email Notifications</h3>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.emailOnInquiry}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  emailOnInquiry: e.target.checked,
                })
              }
              className="w-4 h-4"
            />
            <span className="text-navy font-medium">
              New inquiry received
            </span>
          </label>

          {preferences.emailOnInquiry && (
            <div className="ml-7 p-3 bg-navy/5 rounded-lg">
              <label className="text-sm text-navy font-semibold block mb-2">
                Inquiry Notification Frequency
              </label>
              <select
                value={preferences.inquiryNotification}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    inquiryNotification: e.target.value as any,
                  })
                }
                className="w-full border border-navy/15 rounded-md px-3 py-2 outline-none focus:border-gold"
              >
                <option value="instant">Instant</option>
                <option value="daily">Daily digest</option>
                <option value="weekly">Weekly digest</option>
              </select>
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.emailOnSavedPriceChange}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  emailOnSavedPriceChange: e.target.checked,
                })
              }
              className="w-4 h-4"
            />
            <span className="text-navy font-medium">
              Price drops on saved listings
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.emailOnSearchAlert}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  emailOnSearchAlert: e.target.checked,
                })
              }
              className="w-4 h-4"
            />
            <span className="text-navy font-medium">
              New matches for saved searches
            </span>
          </label>

          {preferences.emailOnSearchAlert && (
            <div className="ml-7 p-3 bg-navy/5 rounded-lg">
              <label className="text-sm text-navy font-semibold block mb-2">
                Search Alert Frequency
              </label>
              <select
                value={preferences.searchAlertFrequency}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    searchAlertFrequency: e.target.value as any,
                  })
                }
                className="w-full border border-navy/15 rounded-md px-3 py-2 outline-none focus:border-gold"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.emailOnProductUpdates}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  emailOnProductUpdates: e.target.checked,
                })
              }
              className="w-4 h-4"
            />
            <span className="text-navy font-medium">
              New features and updates
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.emailOnMonthlyReport}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  emailOnMonthlyReport: e.target.checked,
                })
              }
              className="w-4 h-4"
            />
            <span className="text-navy font-medium">
              Monthly performance report (agents only)
            </span>
          </label>
        </div>
      </div>

      {/* SMS Notifications */}
      <div className="bg-white border border-navy/10 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="w-5 h-5 text-gold" />
          <h3 className="text-lg font-bold text-navy">SMS Notifications</h3>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={preferences.smsOnUrgentInquiry}
            onChange={(e) =>
              setPreferences({
                ...preferences,
                smsOnUrgentInquiry: e.target.checked,
              })
            }
            className="w-4 h-4"
          />
          <span className="text-navy font-medium">
            Urgent inquiry (high priority)
          </span>
        </label>

        {preferences.smsOnUrgentInquiry && (
          <div className="mt-4 p-3 bg-navy/5 rounded-lg">
            <label className="text-sm text-navy font-semibold block mb-2">
              Phone Number for SMS
            </label>
            <input
              type="tel"
              placeholder="+234"
              value={preferences.phoneNumber || ""}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  phoneNumber: e.target.value,
                })
              }
              className="w-full border border-navy/15 rounded-md px-3 py-2 outline-none focus:border-gold"
            />
            <p className="text-xs text-navy/60 mt-1">
              Enter your phone number with country code
            </p>
          </div>
        )}
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-navy text-white font-semibold py-3 rounded-lg hover:bg-navy-light transition disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Preferences"}
      </button>
    </div>
  );
}
