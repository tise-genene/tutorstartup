"use client";

import { useAdminDashboard, useIsAdmin } from "../../hooks/useAdmin";
import { AdminLayout } from "./_components/AdminLayout";
import Link from "next/link";

function StatCard({ title, value, trend, icon }: { title: string; value: number; trend?: string; icon: string }) {
  return (
    <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--muted)] mb-1">{title}</p>
          <h3 className="text-3xl font-bold">{value.toLocaleString()}</h3>
          {trend && <p className="text-xs text-green-500 mt-1">{trend}</p>}
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}

function ModerationAlert({ count }: { count: number }) {
  if (count === 0) return null;
  
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-semibold text-amber-800">Content Awaiting Moderation</h3>
            <p className="text-sm text-amber-700">{count} items need your review</p>
          </div>
        </div>
        <Link
          href="/admin/moderation"
          className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
        >
          Review Now
        </Link>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { isAdmin, loading: checkingAdmin } = useIsAdmin();
  const { analytics, loading } = useAdminDashboard();

  if (checkingAdmin || loading) {
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
          <p className="text-[var(--muted)]">You don&apos;t have permission to access the admin panel.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Overview</h1>
          <p className="text-[var(--muted)]">Platform analytics and key metrics</p>
        </div>

        {analytics && analytics.pendingModeration > 0 && (
          <ModerationAlert count={analytics.pendingModeration} />
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Users" value={analytics?.totalUsers || 0} icon="👥" trend="+12% this month" />
          <StatCard title="Active Tutors" value={analytics?.totalTutors || 0} icon="🎓" />
          <StatCard title="Open Jobs" value={analytics?.openJobs || 0} icon="💼" />
          <StatCard title="Active Contracts" value={analytics?.activeContracts || 0} icon="📄" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Reviews" value={analytics?.totalReviews || 0} icon="⭐" />
          <StatCard title="Messages (24h)" value={analytics?.messages24h || 0} icon="💬" />
          <StatCard title="Completed Contracts" value={analytics?.completedContracts || 0} icon="✅" />
          <StatCard title="Failed Emails" value={analytics?.failedEmails || 0} icon="📧" />
        </div>

        {/* Recent Activity */}
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/admin/users"
              className="p-4 bg-[var(--bg-elevated)] rounded-lg hover:bg-[var(--muted)] transition-colors"
            >
              <span className="text-2xl mb-2 block">👥</span>
              <h3 className="font-medium">Manage Users</h3>
              <p className="text-sm text-[var(--muted)]">View and manage user accounts</p>
            </Link>
            
            <Link
              href="/admin/moderation"
              className="p-4 bg-[var(--bg-elevated)] rounded-lg hover:bg-[var(--muted)] transition-colors"
            >
              <span className="text-2xl mb-2 block">🛡️</span>
              <h3 className="font-medium">Content Moderation</h3>
              <p className="text-sm text-[var(--muted)]">Review reported content</p>
            </Link>
            
            <Link
              href="/admin/activity"
              className="p-4 bg-[var(--bg-elevated)] rounded-lg hover:bg-[var(--muted)] transition-colors"
            >
              <span className="text-2xl mb-2 block">📋</span>
              <h3 className="font-medium">Activity Log</h3>
              <p className="text-sm text-[var(--muted)]">View admin actions</p>
            </Link>
            
            <Link
              href="/admin/settings"
              className="p-4 bg-[var(--bg-elevated)] rounded-lg hover:bg-[var(--muted)] transition-colors"
            >
              <span className="text-2xl mb-2 block">⚙️</span>
              <h3 className="font-medium">Settings</h3>
              <p className="text-sm text-[var(--muted)]">Configure platform settings</p>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
