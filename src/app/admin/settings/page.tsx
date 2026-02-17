"use client";

import { useState } from "react";
import { useIsAdmin } from "../../../hooks/useAdmin";
import { AdminLayout } from "../_components/AdminLayout";

export default function AdminSettingsPage() {
  const { isAdmin, loading: checkingAdmin } = useIsAdmin();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (checkingAdmin) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLayout>
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-[var(--muted)]">You don&apos;t have permission to access this page.</p>
        </div>
      </AdminLayout>
    );
  }

  const handleSave = () => {
    setSaving(true);
    // Simulate saving
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 500);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Settings</h1>
          <p className="text-[var(--muted)]">Configure platform settings</p>
        </div>

        {/* General Settings */}
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
          <h2 className="text-lg font-semibold mb-6">General Settings</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Platform Name</label>
              <input
                type="text"
                defaultValue="Tutor Startup"
                className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--input)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Support Email</label>
              <input
                type="email"
                defaultValue="support@tutorstartup.com"
                className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--input)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Maintenance Mode</label>
              <select className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--input)]">
                <option value="off">Off</option>
                <option value="on">On</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
          <h2 className="text-lg font-semibold mb-6">Email Notifications</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">New User Registration</p>
                <p className="text-sm text-[var(--muted)]">Send email to admins when new users register</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Content Reports</p>
                <p className="text-sm text-[var(--muted)]">Send email for new moderation reports</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Failed Payments</p>
                <p className="text-sm text-[var(--muted)]">Alert admins about payment failures</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
          <h2 className="text-lg font-semibold mb-6">Security</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Require Email Verification</p>
                <p className="text-sm text-[var(--muted)]">Users must verify email before using platform</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-[var(--muted)]">Require 2FA for admin accounts</p>
              </div>
              <input type="checkbox" className="w-5 h-5" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Session Timeout (hours)</label>
              <input
                type="number"
                defaultValue="24"
                min="1"
                max="168"
                className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--input)]"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-[var(--accent)] text-white rounded-lg font-medium disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          {saved && (
            <span className="text-green-600">✓ Saved successfully</span>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
