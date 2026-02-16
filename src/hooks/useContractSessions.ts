"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "../lib/supabase";
import type { ScheduledSession } from "../lib/types";

export interface CreateSessionPayload {
  contractId: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingLink?: string;
  locationText?: string;
  notes?: string;
}

export interface UpdateSessionPayload {
  scheduledAt?: string;
  durationMinutes?: number;
  meetingLink?: string;
  locationText?: string;
  status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string;
  parentAttended?: boolean;
  tutorAttended?: boolean;
}

export function useContractSessions(contractId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const [sessions, setSessions] = useState<ScheduledSession[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<ScheduledSession[]>([]);
  const [pastSessions, setPastSessions] = useState<ScheduledSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all sessions for a contract
  const fetchSessions = useCallback(async () => {
    if (!contractId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("scheduled_sessions")
        .select("*")
        .eq("contract_id", contractId)
        .order("scheduled_at", { ascending: false });

      if (error) throw error;

      const formattedSessions: ScheduledSession[] = (data || []).map((s: any) => ({
        id: s.id,
        contractId: s.contract_id,
        scheduledAt: s.scheduled_at,
        durationMinutes: s.duration_minutes,
        meetingLink: s.meeting_link,
        locationText: s.location_text,
        status: s.status,
        notes: s.notes,
        parentAttended: s.parent_attended,
        tutorAttended: s.tutor_attended,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      }));

      setSessions(formattedSessions);

      // Split into upcoming and past
      const now = new Date().toISOString();
      setUpcomingSessions(formattedSessions.filter(s => 
        s.scheduledAt > now && s.status === 'SCHEDULED'
      ));
      setPastSessions(formattedSessions.filter(s => 
        s.scheduledAt <= now || s.status !== 'SCHEDULED'
      ));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [contractId, supabase]);

  // Create a new session
  const createSession = useCallback(async (payload: CreateSessionPayload) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("scheduled_sessions")
        .insert({
          contract_id: payload.contractId,
          scheduled_at: payload.scheduledAt,
          duration_minutes: payload.durationMinutes,
          meeting_link: payload.meetingLink || null,
          location_text: payload.locationText || null,
          notes: payload.notes || null,
          status: 'SCHEDULED',
        })
        .select()
        .single();

      if (error) throw error;

      const session: ScheduledSession = {
        id: data.id,
        contractId: data.contract_id,
        scheduledAt: data.scheduled_at,
        durationMinutes: data.duration_minutes,
        meetingLink: data.meeting_link,
        locationText: data.location_text,
        status: data.status,
        notes: data.notes,
        parentAttended: data.parent_attended,
        tutorAttended: data.tutor_attended,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setSessions(prev => [session, ...prev]);
      
      // Update upcoming sessions
      const now = new Date().toISOString();
      if (session.scheduledAt > now && session.status === 'SCHEDULED') {
        setUpcomingSessions(prev => [...prev, session].sort((a, b) => 
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
        ));
      }

      return session;
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Update a session
  const updateSession = useCallback(async (sessionId: string, payload: UpdateSessionPayload) => {
    try {
      const { data, error } = await supabase
        .from("scheduled_sessions")
        .update({
          scheduled_at: payload.scheduledAt,
          duration_minutes: payload.durationMinutes,
          meeting_link: payload.meetingLink,
          location_text: payload.locationText,
          status: payload.status,
          notes: payload.notes,
          parent_attended: payload.parentAttended,
          tutor_attended: payload.tutorAttended,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionId)
        .select()
        .single();

      if (error) throw error;

      const session: ScheduledSession = {
        id: data.id,
        contractId: data.contract_id,
        scheduledAt: data.scheduled_at,
        durationMinutes: data.duration_minutes,
        meetingLink: data.meeting_link,
        locationText: data.location_text,
        status: data.status,
        notes: data.notes,
        parentAttended: data.parent_attended,
        tutorAttended: data.tutor_attended,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setSessions(prev => prev.map(s => s.id === sessionId ? session : s));
      
      // Recalculate upcoming/past
      const now = new Date().toISOString();
      setUpcomingSessions(prev => 
        prev.map(s => s.id === sessionId ? session : s)
          .filter(s => s.scheduledAt > now && s.status === 'SCHEDULED')
      );
      setPastSessions(prev => 
        prev.map(s => s.id === sessionId ? session : s)
          .filter(s => s.scheduledAt <= now || s.status !== 'SCHEDULED')
      );

      return session;
    } catch (e) {
      setError((e as Error).message);
      return null;
    }
  }, [supabase]);

  // Cancel a session
  const cancelSession = useCallback(async (sessionId: string) => {
    return updateSession(sessionId, { status: 'CANCELLED' });
  }, [updateSession]);

  // Mark session as completed with attendance
  const completeSession = useCallback(async (
    sessionId: string, 
    parentAttended: boolean, 
    tutorAttended: boolean,
    notes?: string
  ) => {
    return updateSession(sessionId, {
      status: 'COMPLETED',
      parentAttended,
      tutorAttended,
      notes,
    });
  }, [updateSession]);

  // Mark as no-show
  const markNoShow = useCallback(async (sessionId: string) => {
    return updateSession(sessionId, { status: 'NO_SHOW' });
  }, [updateSession]);

  // Get session statistics
  const getStats = useCallback(() => {
    const total = sessions.length;
    const completed = sessions.filter(s => s.status === 'COMPLETED').length;
    const cancelled = sessions.filter(s => s.status === 'CANCELLED').length;
    const noShows = sessions.filter(s => s.status === 'NO_SHOW').length;
    const upcoming = upcomingSessions.length;
    
    const totalDuration = sessions
      .filter(s => s.status === 'COMPLETED')
      .reduce((sum, s) => sum + s.durationMinutes, 0);

    return {
      total,
      completed,
      cancelled,
      noShows,
      upcoming,
      totalHours: Math.round(totalDuration / 60 * 10) / 10,
    };
  }, [sessions, upcomingSessions]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    upcomingSessions,
    pastSessions,
    loading,
    error,
    fetchSessions,
    createSession,
    updateSession,
    cancelSession,
    completeSession,
    markNoShow,
    getStats,
  };
}

// Hook for getting all sessions across all contracts for a user
export function useUserSessions(userId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const [upcomingSessions, setUpcomingSessions] = useState<ScheduledSession[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUpcomingSessions = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const now = new Date().toISOString();
      
      // Get sessions where user is either parent or tutor
      const { data, error } = await supabase
        .from("scheduled_sessions")
        .select(`
          *,
          contracts!inner(
            parent_id,
            tutor_id,
            job_post:job_post_id(title)
          )
        `)
        .eq("status", "SCHEDULED")
        .gte("scheduled_at", now)
        .order("scheduled_at", { ascending: true })
        .limit(10);

      if (error) throw error;

      // Filter for user's contracts
      const userSessions = (data || []).filter((s: any) => 
        s.contracts.parent_id === userId || s.contracts.tutor_id === userId
      );

      const formattedSessions: ScheduledSession[] = userSessions.map((s: any) => ({
        id: s.id,
        contractId: s.contract_id,
        scheduledAt: s.scheduled_at,
        durationMinutes: s.duration_minutes,
        meetingLink: s.meeting_link,
        locationText: s.location_text,
        status: s.status,
        notes: s.notes,
        parentAttended: s.parent_attended,
        tutorAttended: s.tutor_attended,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      }));

      setUpcomingSessions(formattedSessions);
    } catch (e) {
      console.error("Error fetching upcoming sessions:", e);
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

  useEffect(() => {
    fetchUpcomingSessions();
  }, [fetchUpcomingSessions]);

  return {
    upcomingSessions,
    loading,
    fetchUpcomingSessions,
  };
}
