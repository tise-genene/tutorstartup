import { useState, useEffect, useCallback } from 'react';
import { createClient } from '../lib/supabase';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'tutor' | 'client' | 'admin';
  location?: string | null;
  isVerified: boolean;
  isAdmin: boolean;
  createdAt: string;
  jobsPosted: number;
  contractsAsTutor: number;
  contractsAsClient: number;
  reviewsGiven: number;
  reviewsReceived: number;
}

export interface AdminAnalytics {
  totalUsers: number;
  totalTutors: number;
  totalClients: number;
  newUsers30d: number;
  totalJobs: number;
  openJobs: number;
  totalProposals: number;
  activeContracts: number;
  completedContracts: number;
  totalReviews: number;
  messages24h: number;
  pendingModeration: number;
  failedEmails: number;
  calculatedAt: string;
}

export interface ModerationItem {
  id: string;
  contentType: string;
  contentId: string;
  contentPreview?: string | null;
  reportedBy?: string | null;
  reportReason?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  moderatorId?: string | null;
  moderationNotes?: string | null;
  createdAt: string;
  moderatedAt?: string | null;
  priority: number;
}

export interface ActivityLog {
  id: string;
  adminId?: string | null;
  actionType: string;
  targetType: string;
  targetId?: string | null;
  details?: Record<string, unknown>;
  createdAt: string;
}

export function useAdminDashboard() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [moderationQueue, setModerationQueue] = useState<ModerationItem[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchAnalytics = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('admin_analytics_summary')
        .select('*')
        .single();

      if (error) throw error;
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  }, [supabase]);

  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('admin_user_list')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, [supabase]);

  const fetchModerationQueue = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('moderation_queue')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setModerationQueue(data || []);
    } catch (err) {
      console.error('Failed to fetch moderation queue:', err);
    }
  }, [supabase]);

  const fetchActivityLog = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('admin_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivityLog(data || []);
    } catch (err) {
      console.error('Failed to fetch activity log:', err);
    }
  }, [supabase]);

  const resolveModeration = async (
    moderationId: string,
    resolution: 'approved' | 'rejected' | 'escalated',
    notes: string
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.rpc('resolve_moderation', {
        moderation_id: moderationId,
        admin_id: user?.id,
        resolution,
        notes,
      });

      if (error) throw error;
      
      await fetchModerationQueue();
      return true;
    } catch (err) {
      console.error('Failed to resolve moderation:', err);
      return false;
    }
  };

  const suspendUser = async (userId: string, reason: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.rpc('admin_suspend_user', {
        target_user_id: userId,
        admin_id: user?.id,
        reason,
      });

      if (error) throw error;
      
      await fetchUsers();
      return true;
    } catch (err) {
      console.error('Failed to suspend user:', err);
      return false;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchAnalytics(),
        fetchUsers(),
        fetchModerationQueue(),
        fetchActivityLog(),
      ]);
      setLoading(false);
    };

    loadData();
  }, [fetchAnalytics, fetchUsers, fetchModerationQueue, fetchActivityLog]);

  return {
    analytics,
    users,
    moderationQueue,
    activityLog,
    loading,
    error,
    refreshAnalytics: fetchAnalytics,
    refreshUsers: fetchUsers,
    refreshModeration: fetchModerationQueue,
    refreshActivityLog: fetchActivityLog,
    resolveModeration,
    suspendUser,
  };
}

export function useIsAdmin(): { isAdmin: boolean; loading: boolean } {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const supabase = createClient();
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (error || !data) {
          setIsAdmin(false);
        } else {
          setIsAdmin(data.is_admin || false);
        }
      } catch {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, []);

  return { isAdmin, loading };
}
