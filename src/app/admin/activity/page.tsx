"use client";

import { useAdminDashboard, useIsAdmin } from "../../../hooks/useAdmin";
import { AdminLayout } from "../_components/AdminLayout";

export default function AdminActivityPage() {
  const { isAdmin, loading: checkingAdmin } = useIsAdmin();
  const { activityLog, loading } = useAdminDashboard();

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
          <p className="text-[var(--muted)]">You don&apos;t have permission to access this page.</p>
        </div>
      </AdminLayout>
    );
  }

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'suspend_user': return '🚫';
      case 'moderate_content': return '🛡️';
      case 'approve_user': return '✅';
      case 'delete_content': return '🗑️';
      default: return '📝';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Activity Log</h1>
          <p className="text-[var(--muted)]">Track admin actions and system events</p>
        </div>

        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="divide-y divide-[var(--border)]">
            {activityLog.map((activity) => (
              <div key={activity.id} className="p-6 hover:bg-[var(--bg-elevated)] transition-colors">
                <div className="flex items-start gap-4">
                  <span className="text-2xl">{getActionIcon(activity.actionType)}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium capitalize">
                        {activity.actionType.replace(/_/g, ' ')}
                      </h3>
                      <span className="text-sm text-[var(--muted)]">
                        {new Date(activity.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--muted)] mb-2">
                      Target: {activity.targetType} {activity.targetId && `(${activity.targetId.slice(0, 8)}...)`}
                    </p>
                    {activity.details && Object.keys(activity.details).length > 0 && (
                      <div className="bg-[var(--bg-elevated)] rounded-lg p-3 mt-2">
                        <pre className="text-xs text-[var(--muted)] overflow-x-auto">
                          {JSON.stringify(activity.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {activityLog.length === 0 && (
            <div className="text-center py-16">
              <p className="text-[var(--muted)]">No activity recorded yet</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
