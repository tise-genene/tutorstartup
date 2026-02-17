"use client";

import { useState } from "react";
import { useAdminDashboard, useIsAdmin } from "../../../hooks/useAdmin";
import { AdminLayout } from "../_components/AdminLayout";

export default function AdminModerationPage() {
  const { isAdmin, loading: checkingAdmin } = useIsAdmin();
  const { moderationQueue, loading, resolveModeration } = useAdminDashboard();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [resolution, setResolution] = useState<'approved' | 'rejected' | 'escalated'>('approved');
  const [notes, setNotes] = useState("");
  const [resolving, setResolving] = useState(false);

  const pendingItems = moderationQueue.filter((item) => item.status === 'pending');
  const resolvedItems = moderationQueue.filter((item) => item.status !== 'pending');

  const handleResolve = async (itemId: string) => {
    setResolving(true);
    const success = await resolveModeration(itemId, resolution, notes);
    if (success) {
      setSelectedItem(null);
      setNotes("");
    }
    setResolving(false);
  };

  const getPriorityBadge = (priority: number) => {
    switch (priority) {
      case 2:
        return <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">Urgent</span>;
      case 1:
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full">High</span>;
      default:
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded-full">Normal</span>;
    }
  };

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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Content Moderation</h1>
          <p className="text-[var(--muted)]">Review and moderate reported content</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)]">
            <div className="text-2xl font-bold">{pendingItems.length}</div>
            <div className="text-sm text-[var(--muted)]">Pending Review</div>
          </div>
          <div className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)]">
            <div className="text-2xl font-bold">
              {resolvedItems.filter((i) => i.status === 'approved').length}
            </div>
            <div className="text-sm text-[var(--muted)]">Approved</div>
          </div>
          <div className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)]">
            <div className="text-2xl font-bold">
              {resolvedItems.filter((i) => i.status === 'rejected').length}
            </div>
            <div className="text-sm text-[var(--muted)]">Rejected</div>
          </div>
        </div>

        {/* Pending Items */}
        {pendingItems.length > 0 && (
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)]">
              <h2 className="font-semibold">Awaiting Review ({pendingItems.length})</h2>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {pendingItems.map((item) => (
                <div key={item.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium capitalize">{item.contentType}</span>
                        {getPriorityBadge(item.priority)}
                      </div>
                      <div className="text-xs text-[var(--muted)]">
                        Reported {new Date(item.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded">
                      {item.status}
                    </span>
                  </div>

                  <div className="bg-[var(--bg-elevated)] rounded-lg p-4 mb-4">
                    <p className="text-sm text-[var(--muted)] mb-1">Content Preview:</p>
                    <p className="text-sm">{item.contentPreview || "No preview available"}</p>
                  </div>

                  {item.reportReason && (
                    <div className="text-sm mb-4">
                      <span className="text-[var(--muted)]">Reason: </span>
                      <span>{item.reportReason}</span>
                    </div>
                  )}

                  {selectedItem === item.id ? (
                    <div className="space-y-4 bg-[var(--bg-elevated)] rounded-lg p-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Resolution</label>
                        <div className="flex gap-2">
                          {(['approved', 'rejected', 'escalated'] as const).map((status) => (
                            <button
                              key={status}
                              onClick={() => setResolution(status)}
                              className={`px-4 py-2 rounded-lg text-sm capitalize ${
                                resolution === status
                                  ? 'bg-[var(--accent)] text-white'
                                  : 'bg-[var(--input)] hover:bg-[var(--muted)]'
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Notes</label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Add moderation notes..."
                          className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--input)] resize-none"
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResolve(item.id)}
                          disabled={resolving}
                          className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg disabled:opacity-50"
                        >
                          {resolving ? "Processing..." : "Submit Resolution"}
                        </button>
                        <button
                          onClick={() => setSelectedItem(null)}
                          className="px-4 py-2 bg-[var(--input)] rounded-lg hover:bg-[var(--muted)]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedItem(item.id)}
                      className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm hover:opacity-90"
                    >
                      Review
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resolved Items */}
        {resolvedItems.length > 0 && (
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)]">
              <h2 className="font-semibold">Resolved Items ({resolvedItems.length})</h2>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {resolvedItems.slice(0, 10).map((item) => (
                <div key={item.id} className="p-6 opacity-60">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium capitalize">{item.contentType}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        item.status === 'approved' ? 'bg-green-100 text-green-800' :
                        item.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--muted)]">
                      {item.moderatedAt && new Date(item.moderatedAt).toLocaleString()}
                    </div>
                  </div>
                  <p className="text-sm truncate">{item.contentPreview}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {pendingItems.length === 0 && resolvedItems.length === 0 && (
          <div className="text-center py-16 bg-[var(--card)] rounded-xl border border-[var(--border)]">
            <div className="text-4xl mb-2">✅</div>
            <h3 className="font-semibold">All Caught Up!</h3>
            <p className="text-[var(--muted)]">No moderation items to review</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
