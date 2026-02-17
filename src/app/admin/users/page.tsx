"use client";

import { useState } from "react";
import { useAdminDashboard, useIsAdmin, AdminUser } from "../../../hooks/useAdmin";
import { AdminLayout } from "../_components/AdminLayout";
import Link from "next/link";

export default function AdminUsersPage() {
  const { isAdmin, loading: checkingAdmin } = useIsAdmin();
  const { users, loading, refreshUsers, suspendUser } = useAdminDashboard();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [suspendingUser, setSuspendingUser] = useState<string | null>(null);

  const filteredUsers = users.filter((user: AdminUser) => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleSuspend = async (userId: string) => {
    if (!confirm("Are you sure you want to suspend this user?")) return;
    
    setSuspendingUser(userId);
    await suspendUser(userId, "Suspended by admin");
    setSuspendingUser(null);
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-[var(--muted)]">Manage platform users</p>
          </div>
          <button
            onClick={refreshUsers}
            className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--input)]"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--input)]"
          >
            <option value="all">All Roles</option>
            <option value="tutor">Tutors</option>
            <option value="client">Clients</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--bg-elevated)]">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[var(--muted)]">User</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[var(--muted)]">Role</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[var(--muted)]">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[var(--muted)]">Activity</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[var(--muted)]">Joined</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[var(--muted)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredUsers.map((user: AdminUser) => (
                  <tr key={user.id} className="hover:bg-[var(--bg-elevated)]">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium">{user.name || "Unnamed User"}</div>
                        <div className="text-sm text-[var(--muted)]">{user.email}</div>
                        {user.location && (
                          <div className="text-xs text-[var(--muted)]">📍 {user.location}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'tutor' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                      {user.isAdmin && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs bg-red-100 text-red-800">
                          ADMIN
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.isVerified ? (
                        <span className="inline-flex items-center text-green-600 text-sm">
                          ✅ Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-amber-600 text-sm">
                          ⏳ Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm space-y-1">
                        <div>Jobs: {user.jobsPosted}</div>
                        <div>Contracts: {user.contractsAsClient + user.contractsAsTutor}</div>
                        <div>Reviews: {user.reviewsGiven} given, {user.reviewsReceived} received</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--muted)]">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/tutors/${user.id}`}
                          target="_blank"
                          className="text-[var(--accent)] hover:underline text-sm"
                        >
                          View
                        </Link>
                        {!user.isAdmin && (
                          <button
                            onClick={() => handleSuspend(user.id)}
                            disabled={suspendingUser === user.id}
                            className="text-red-500 hover:text-red-700 text-sm disabled:opacity-50"
                          >
                            {suspendingUser === user.id ? "..." : "Suspend"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[var(--muted)]">No users found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
