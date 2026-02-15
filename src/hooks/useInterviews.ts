"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "../lib/supabase";
import type { 
  Interview, 
  CreateInterviewPayload, 
  UpdateInterviewPayload,
  AvailableTimeSlot,
  TutorAvailability,
  CreateAvailabilityPayload
} from "../lib/types";

export function useInterviews(userId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<Interview[]>([]);
  const [pastInterviews, setPastInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all interviews for a user
  const fetchInterviews = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("interviews")
        .select(`
          *,
          parent:parent_id(id, name, avatar_url, role),
          tutor:tutor_id(id, name, avatar_url, role),
          job_post:job_post_id(id, title),
          proposal:proposal_id(id, status)
        `)
        .or(`parent_id.eq.${userId},tutor_id.eq.${userId}`)
        .order("scheduled_at", { ascending: false });

      if (error) throw error;

      const formattedInterviews: Interview[] = (data || []).map((i: any) => ({
        id: i.id,
        proposalId: i.proposal_id,
        jobPostId: i.job_post_id,
        parentId: i.parent_id,
        tutorId: i.tutor_id,
        scheduledAt: i.scheduled_at,
        durationMinutes: i.duration_minutes,
        meetingLink: i.meeting_link,
        meetingProvider: i.meeting_provider,
        status: i.status,
        notes: i.notes,
        clientNotes: i.client_notes,
        tutorNotes: i.tutor_notes,
        rating: i.rating,
        feedback: i.feedback,
        reminderSentAt: i.reminder_sent_at,
        createdAt: i.created_at,
        updatedAt: i.updated_at,
        parent: i.parent,
        tutor: i.tutor,
        jobPost: i.job_post,
        proposal: i.proposal,
      }));

      setInterviews(formattedInterviews);

      // Split into upcoming and past
      const now = new Date().toISOString();
      setUpcomingInterviews(formattedInterviews.filter(i => i.scheduledAt > now && i.status === 'SCHEDULED'));
      setPastInterviews(formattedInterviews.filter(i => i.scheduledAt <= now || i.status !== 'SCHEDULED'));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

  // Create a new interview
  const createInterview = useCallback(async (payload: CreateInterviewPayload) => {
    if (!userId) return null;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("interviews")
        .insert({
          proposal_id: payload.proposalId,
          job_post_id: payload.jobPostId,
          parent_id: userId,
          tutor_id: payload.tutorId,
          scheduled_at: payload.scheduledAt,
          duration_minutes: payload.durationMinutes || 30,
          meeting_link: payload.meetingLink || null,
          meeting_provider: payload.meetingProvider || 'manual',
          notes: payload.notes || null,
        })
        .select(`
          *,
          parent:parent_id(id, name, avatar_url, role),
          tutor:tutor_id(id, name, avatar_url, role),
          job_post:job_post_id(id, title),
          proposal:proposal_id(id, status)
        `)
        .single();

      if (error) throw error;

      const interview: Interview = {
        id: data.id,
        proposalId: data.proposal_id,
        jobPostId: data.job_post_id,
        parentId: data.parent_id,
        tutorId: data.tutor_id,
        scheduledAt: data.scheduled_at,
        durationMinutes: data.duration_minutes,
        meetingLink: data.meeting_link,
        meetingProvider: data.meeting_provider,
        status: data.status,
        notes: data.notes,
        clientNotes: data.client_notes,
        tutorNotes: data.tutor_notes,
        rating: data.rating,
        feedback: data.feedback,
        reminderSentAt: data.reminder_sent_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        parent: data.parent,
        tutor: data.tutor,
        jobPost: data.job_post,
        proposal: data.proposal,
      };

      setInterviews(prev => [interview, ...prev]);
      return interview;
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

  // Update an interview
  const updateInterview = useCallback(async (interviewId: string, payload: UpdateInterviewPayload) => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from("interviews")
        .update({
          scheduled_at: payload.scheduledAt,
          duration_minutes: payload.durationMinutes,
          meeting_link: payload.meetingLink,
          meeting_provider: payload.meetingProvider,
          status: payload.status,
          notes: payload.notes,
          client_notes: payload.clientNotes,
          tutor_notes: payload.tutorNotes,
          rating: payload.rating,
          feedback: payload.feedback,
          updated_at: new Date().toISOString(),
        })
        .eq("id", interviewId)
        .select(`
          *,
          parent:parent_id(id, name, avatar_url, role),
          tutor:tutor_id(id, name, avatar_url, role),
          job_post:job_post_id(id, title),
          proposal:proposal_id(id, status)
        `)
        .single();

      if (error) throw error;

      const interview: Interview = {
        id: data.id,
        proposalId: data.proposal_id,
        jobPostId: data.job_post_id,
        parentId: data.parent_id,
        tutorId: data.tutor_id,
        scheduledAt: data.scheduled_at,
        durationMinutes: data.duration_minutes,
        meetingLink: data.meeting_link,
        meetingProvider: data.meeting_provider,
        status: data.status,
        notes: data.notes,
        clientNotes: data.client_notes,
        tutorNotes: data.tutor_notes,
        rating: data.rating,
        feedback: data.feedback,
        reminderSentAt: data.reminder_sent_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        parent: data.parent,
        tutor: data.tutor,
        jobPost: data.job_post,
        proposal: data.proposal,
      };

      setInterviews(prev => 
        prev.map(i => i.id === interviewId ? interview : i)
      );
      return interview;
    } catch (e) {
      setError((e as Error).message);
      return null;
    }
  }, [userId, supabase]);

  // Cancel an interview
  const cancelInterview = useCallback(async (interviewId: string) => {
    return updateInterview(interviewId, { status: 'CANCELLED' });
  }, [updateInterview]);

  // Complete an interview with feedback
  const completeInterview = useCallback(async (interviewId: string, rating: number, feedback: string) => {
    return updateInterview(interviewId, { 
      status: 'COMPLETED', 
      rating, 
      feedback 
    });
  }, [updateInterview]);

  // Get interview by proposal ID
  const getInterviewByProposal = useCallback(async (proposalId: string) => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from("interviews")
        .select(`
          *,
          parent:parent_id(id, name, avatar_url, role),
          tutor:tutor_id(id, name, avatar_url, role),
          job_post:job_post_id(id, title),
          proposal:proposal_id(id, status)
        `)
        .eq("proposal_id", proposalId)
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const interview: Interview = {
        id: data.id,
        proposalId: data.proposal_id,
        jobPostId: data.job_post_id,
        parentId: data.parent_id,
        tutorId: data.tutor_id,
        scheduledAt: data.scheduled_at,
        durationMinutes: data.duration_minutes,
        meetingLink: data.meeting_link,
        meetingProvider: data.meeting_provider,
        status: data.status,
        notes: data.notes,
        clientNotes: data.client_notes,
        tutorNotes: data.tutor_notes,
        rating: data.rating,
        feedback: data.feedback,
        reminderSentAt: data.reminder_sent_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        parent: data.parent,
        tutor: data.tutor,
        jobPost: data.job_post,
        proposal: data.proposal,
      };

      return interview;
    } catch (e) {
      console.error("Error fetching interview:", e);
      return null;
    }
  }, [userId, supabase]);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  return {
    interviews,
    upcomingInterviews,
    pastInterviews,
    loading,
    error,
    fetchInterviews,
    createInterview,
    updateInterview,
    cancelInterview,
    completeInterview,
    getInterviewByProposal,
  };
}

export function useTutorAvailability(tutorId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const [availability, setAvailability] = useState<TutorAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch tutor's availability
  const fetchAvailability = useCallback(async () => {
    if (!tutorId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("tutor_availability")
        .select("*")
        .eq("tutor_id", tutorId)
        .eq("is_blocked", false)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) throw error;

      const formattedAvailability: TutorAvailability[] = (data || []).map((a: any) => ({
        id: a.id,
        tutorId: a.tutor_id,
        dayOfWeek: a.day_of_week,
        startTime: a.start_time,
        endTime: a.end_time,
        isRecurring: a.is_recurring,
        specificDate: a.specific_date,
        timezone: a.timezone,
        isBlocked: a.is_blocked,
        notes: a.notes,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
      }));

      setAvailability(formattedAvailability);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [tutorId, supabase]);

  // Get available time slots for a specific date
  const getAvailableSlots = useCallback(async (date: string, durationMinutes: number = 30) => {
    if (!tutorId) return [];

    try {
      const { data, error } = await supabase.rpc("get_tutor_available_slots", {
        p_tutor_id: tutorId,
        p_date: date,
        p_duration_minutes: durationMinutes,
      });

      if (error) throw error;

      return (data || []) as AvailableTimeSlot[];
    } catch (e) {
      console.error("Error fetching available slots:", e);
      return [];
    }
  }, [tutorId, supabase]);

  // Check if a specific time is available
  const isTimeAvailable = useCallback(async (scheduledAt: string, durationMinutes: number = 30) => {
    if (!tutorId) return false;

    try {
      const { data, error } = await supabase.rpc("is_tutor_available", {
        p_tutor_id: tutorId,
        p_scheduled_at: scheduledAt,
        p_duration_minutes: durationMinutes,
      });

      if (error) throw error;

      return data as boolean;
    } catch (e) {
      console.error("Error checking availability:", e);
      return false;
    }
  }, [tutorId, supabase]);

  // Add availability slot (for tutors)
  const addAvailability = useCallback(async (payload: CreateAvailabilityPayload) => {
    if (!tutorId) return null;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("tutor_availability")
        .insert({
          tutor_id: tutorId,
          day_of_week: payload.dayOfWeek,
          start_time: payload.startTime,
          end_time: payload.endTime,
          is_recurring: payload.isRecurring ?? true,
          specific_date: payload.specificDate || null,
          timezone: payload.timezone || 'Africa/Addis_Ababa',
          notes: payload.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      const availability: TutorAvailability = {
        id: data.id,
        tutorId: data.tutor_id,
        dayOfWeek: data.day_of_week,
        startTime: data.start_time,
        endTime: data.end_time,
        isRecurring: data.is_recurring,
        specificDate: data.specific_date,
        timezone: data.timezone,
        isBlocked: data.is_blocked,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setAvailability(prev => [...prev, availability].sort((a, b) => a.dayOfWeek - b.dayOfWeek));
      return availability;
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [tutorId, supabase]);

  // Remove availability slot
  const removeAvailability = useCallback(async (availabilityId: string) => {
    if (!tutorId) return false;

    try {
      const { error } = await supabase
        .from("tutor_availability")
        .delete()
        .eq("id", availabilityId)
        .eq("tutor_id", tutorId);

      if (error) throw error;

      setAvailability(prev => prev.filter(a => a.id !== availabilityId));
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  }, [tutorId, supabase]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  return {
    availability,
    loading,
    error,
    fetchAvailability,
    getAvailableSlots,
    isTimeAvailable,
    addAvailability,
    removeAvailability,
  };
}
