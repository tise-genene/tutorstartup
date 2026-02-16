"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "../lib/supabase";
import type { 
  EmailNotification, 
  NotificationPreferences, 
  UpdateNotificationPreferencesPayload,
  NotificationType 
} from "../lib/types";

export function useNotifications(userId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const [notifications, setNotifications] = useState<EmailNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's notifications
  const fetchNotifications = useCallback(async (limit = 50) => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("email_notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      const formattedNotifications: EmailNotification[] = (data || []).map((n: any) => ({
        id: n.id,
        userId: n.user_id,
        type: n.type,
        subject: n.subject,
        bodyHtml: n.body_html,
        bodyText: n.body_text,
        recipientEmail: n.recipient_email,
        status: n.status,
        metadata: n.metadata,
        sentAt: n.sent_at,
        deliveredAt: n.delivered_at,
        openedAt: n.opened_at,
        errorMessage: n.error_message,
        retryCount: n.retry_count,
        scheduledFor: n.scheduled_for,
        createdAt: n.created_at,
        updatedAt: n.updated_at,
      }));

      setNotifications(formattedNotifications);

      // Count unread (not opened)
      const unread = formattedNotifications.filter(n => !n.openedAt).length;
      setUnreadCount(unread);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

  // Mark notification as opened
  const markAsOpened = useCallback(async (notificationId: string) => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from("email_notifications")
        .update({ opened_at: new Date().toISOString() })
        .eq("id", notificationId)
        .eq("user_id", userId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, openedAt: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      return true;
    } catch (e) {
      console.error("Error marking notification as opened:", e);
      return false;
    }
  }, [userId, supabase]);

  // Mark all as opened
  const markAllAsOpened = useCallback(async () => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from("email_notifications")
        .update({ opened_at: new Date().toISOString() })
        .eq("user_id", userId)
        .is("opened_at", null);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => ({ ...n, openedAt: n.openedAt || new Date().toISOString() }))
      );
      setUnreadCount(0);
      return true;
    } catch (e) {
      console.error("Error marking all notifications as opened:", e);
      return false;
    }
  }, [userId, supabase]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!userId) return;

    const subscription = supabase
      .channel("email_notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "email_notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as any;
          
          const notification: EmailNotification = {
            id: newNotification.id,
            userId: newNotification.user_id,
            type: newNotification.type,
            subject: newNotification.subject,
            bodyHtml: newNotification.body_html,
            bodyText: newNotification.body_text,
            recipientEmail: newNotification.recipient_email,
            status: newNotification.status,
            metadata: newNotification.metadata,
            sentAt: newNotification.sent_at,
            deliveredAt: newNotification.delivered_at,
            openedAt: newNotification.opened_at,
            errorMessage: newNotification.error_message,
            retryCount: newNotification.retry_count,
            scheduledFor: newNotification.scheduled_for,
            createdAt: newNotification.created_at,
            updatedAt: newNotification.updated_at,
          };

          setNotifications(prev => [notification, ...prev]);
          if (!notification.openedAt) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, supabase]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsOpened,
    markAllAsOpened,
  };
}

export function useNotificationPreferences(userId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's notification preferences
  const fetchPreferences = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

      if (data) {
        const prefs: NotificationPreferences = {
          id: data.id,
          userId: data.user_id,
          newMessageEmail: data.new_message_email,
          newProposalEmail: data.new_proposal_email,
          proposalAcceptedEmail: data.proposal_accepted_email,
          proposalDeclinedEmail: data.proposal_declined_email,
          interviewScheduledEmail: data.interview_scheduled_email,
          interviewReminderEmail: data.interview_reminder_email,
          interviewCancelledEmail: data.interview_cancelled_email,
          contractCreatedEmail: data.contract_created_email,
          paymentReceivedEmail: data.payment_received_email,
          lessonRequestEmail: data.lesson_request_email,
          marketingEmail: data.marketing_email,
          digestEmail: data.digest_email,
          digestFrequency: data.digest_frequency,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        setPreferences(prefs);
      } else {
        // Create default preferences if none exist
        await createDefaultPreferences();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

  // Create default preferences
  const createDefaultPreferences = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .insert({ user_id: userId })
        .select()
        .single();

      if (error) throw error;

      const prefs: NotificationPreferences = {
        id: data.id,
        userId: data.user_id,
        newMessageEmail: data.new_message_email,
        newProposalEmail: data.new_proposal_email,
        proposalAcceptedEmail: data.proposal_accepted_email,
        proposalDeclinedEmail: data.proposal_declined_email,
        interviewScheduledEmail: data.interview_scheduled_email,
        interviewReminderEmail: data.interview_reminder_email,
        interviewCancelledEmail: data.interview_cancelled_email,
        contractCreatedEmail: data.contract_created_email,
        paymentReceivedEmail: data.payment_received_email,
        lessonRequestEmail: data.lesson_request_email,
        marketingEmail: data.marketing_email,
        digestEmail: data.digest_email,
        digestFrequency: data.digest_frequency,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
      setPreferences(prefs);
    } catch (e) {
      console.error("Error creating default preferences:", e);
    }
  }, [userId, supabase]);

  // Update preferences
  const updatePreferences = useCallback(async (updates: UpdateNotificationPreferencesPayload) => {
    if (!userId || !preferences) return false;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .update({
          new_message_email: updates.newMessageEmail,
          new_proposal_email: updates.newProposalEmail,
          proposal_accepted_email: updates.proposalAcceptedEmail,
          proposal_declined_email: updates.proposalDeclinedEmail,
          interview_scheduled_email: updates.interviewScheduledEmail,
          interview_reminder_email: updates.interviewReminderEmail,
          interview_cancelled_email: updates.interviewCancelledEmail,
          contract_created_email: updates.contractCreatedEmail,
          payment_received_email: updates.paymentReceivedEmail,
          lesson_request_email: updates.lessonRequestEmail,
          marketing_email: updates.marketingEmail,
          digest_email: updates.digestEmail,
          digest_frequency: updates.digestFrequency,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;

      const prefs: NotificationPreferences = {
        id: data.id,
        userId: data.user_id,
        newMessageEmail: data.new_message_email,
        newProposalEmail: data.new_proposal_email,
        proposalAcceptedEmail: data.proposal_accepted_email,
        proposalDeclinedEmail: data.proposal_declined_email,
        interviewScheduledEmail: data.interview_scheduled_email,
        interviewReminderEmail: data.interview_reminder_email,
        interviewCancelledEmail: data.interview_cancelled_email,
        contractCreatedEmail: data.contract_created_email,
        paymentReceivedEmail: data.payment_received_email,
        lessonRequestEmail: data.lesson_request_email,
        marketingEmail: data.marketing_email,
        digestEmail: data.digest_email,
        digestFrequency: data.digest_frequency,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
      setPreferences(prefs);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId, preferences, supabase]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    loading,
    error,
    fetchPreferences,
    updatePreferences,
  };
}

// Helper function to get notification icon based on type
export function getNotificationIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    'NEW_MESSAGE': '💬',
    'NEW_PROPOSAL': '📝',
    'PROPOSAL_ACCEPTED': '✅',
    'PROPOSAL_DECLINED': '❌',
    'INTERVIEW_SCHEDULED': '📅',
    'INTERVIEW_REMINDER_24H': '⏰',
    'INTERVIEW_REMINDER_1H': '⏰',
    'INTERVIEW_CANCELLED': '🚫',
    'INTERVIEW_RESCHEDULED': '🔄',
    'CONTRACT_CREATED': '🤝',
    'SESSION_REMINDER': '📚',
    'PAYMENT_RECEIVED': '💰',
    'PAYMENT_SENT': '💸',
    'NEW_LESSON_REQUEST': '📖',
    'LESSON_REQUEST_ACCEPTED': '✅',
    'LESSON_REQUEST_DECLINED': '❌',
    'WELCOME': '👋',
    'PASSWORD_RESET': '🔐',
  };
  return icons[type] || '📧';
}

// Helper function to get notification color based on type
export function getNotificationColor(type: NotificationType): string {
  const colors: Record<NotificationType, string> = {
    'NEW_MESSAGE': 'bg-blue-500/10 text-blue-500',
    'NEW_PROPOSAL': 'bg-purple-500/10 text-purple-500',
    'PROPOSAL_ACCEPTED': 'bg-green-500/10 text-green-500',
    'PROPOSAL_DECLINED': 'bg-red-500/10 text-red-500',
    'INTERVIEW_SCHEDULED': 'bg-indigo-500/10 text-indigo-500',
    'INTERVIEW_REMINDER_24H': 'bg-yellow-500/10 text-yellow-500',
    'INTERVIEW_REMINDER_1H': 'bg-orange-500/10 text-orange-500',
    'INTERVIEW_CANCELLED': 'bg-red-500/10 text-red-500',
    'INTERVIEW_RESCHEDULED': 'bg-yellow-500/10 text-yellow-500',
    'CONTRACT_CREATED': 'bg-green-500/10 text-green-500',
    'SESSION_REMINDER': 'bg-blue-500/10 text-blue-500',
    'PAYMENT_RECEIVED': 'bg-green-500/10 text-green-500',
    'PAYMENT_SENT': 'bg-blue-500/10 text-blue-500',
    'NEW_LESSON_REQUEST': 'bg-purple-500/10 text-purple-500',
    'LESSON_REQUEST_ACCEPTED': 'bg-green-500/10 text-green-500',
    'LESSON_REQUEST_DECLINED': 'bg-red-500/10 text-red-500',
    'WELCOME': 'bg-blue-500/10 text-blue-500',
    'PASSWORD_RESET': 'bg-yellow-500/10 text-yellow-500',
  };
  return colors[type] || 'bg-gray-500/10 text-gray-500';
}
