-- Migration: Interview Scheduling System
-- Created: 2026-02-14
-- Description: Adds interview scheduling and tutor availability tables

-- 1. Create interview status enum
CREATE TYPE "InterviewStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED');

-- 2. Create interviews table
CREATE TABLE public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  job_post_id UUID NOT NULL REFERENCES public.job_posts(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  meeting_link TEXT,
  meeting_provider TEXT DEFAULT 'manual', -- 'zoom', 'google_meet', 'teams', 'manual'
  status "InterviewStatus" DEFAULT 'SCHEDULED',
  notes TEXT,
  client_notes TEXT,
  tutor_notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  reminder_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create tutor availability table (recurring weekly schedule)
CREATE TABLE public.tutor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_recurring BOOLEAN DEFAULT TRUE,
  specific_date DATE,
  timezone TEXT DEFAULT 'Africa/Addis_Ababa',
  is_blocked BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create scheduled sessions table (for booked tutoring sessions)
CREATE TABLE public.scheduled_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  meeting_link TEXT,
  location_text TEXT,
  status TEXT DEFAULT 'SCHEDULED', -- SCHEDULED, COMPLETED, CANCELLED, NO_SHOW
  notes TEXT,
  parent_attended BOOLEAN,
  tutor_attended BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create indexes for performance
CREATE INDEX idx_interviews_proposal_id ON public.interviews(proposal_id);
CREATE INDEX idx_interviews_job_post_id ON public.interviews(job_post_id);
CREATE INDEX idx_interviews_parent_id ON public.interviews(parent_id);
CREATE INDEX idx_interviews_tutor_id ON public.interviews(tutor_id);
CREATE INDEX idx_interviews_scheduled_at ON public.interviews(scheduled_at);
CREATE INDEX idx_interviews_status ON public.interviews(status);
CREATE INDEX idx_tutor_availability_tutor_id ON public.tutor_availability(tutor_id);
CREATE INDEX idx_tutor_availability_day_of_week ON public.tutor_availability(day_of_week);
CREATE INDEX idx_scheduled_sessions_contract_id ON public.scheduled_sessions(contract_id);
CREATE INDEX idx_scheduled_sessions_scheduled_at ON public.scheduled_sessions(scheduled_at);

-- 6. Enable Row Level Security
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_sessions ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for Interviews

-- Users can view interviews they're part of
CREATE POLICY "Users can view their interviews" 
  ON public.interviews FOR SELECT 
  USING (auth.uid() = parent_id OR auth.uid() = tutor_id);

-- Only clients can create interviews
CREATE POLICY "Clients can create interviews" 
  ON public.interviews FOR INSERT 
  WITH CHECK (
    auth.uid() = parent_id AND
    EXISTS (
      SELECT 1 FROM public.proposals p
      JOIN public.job_posts j ON p.job_post_id = j.id
      WHERE p.id = proposal_id
      AND j.parent_id = auth.uid()
    )
  );

-- Users can update interviews they're part of
CREATE POLICY "Users can update their interviews" 
  ON public.interviews FOR UPDATE 
  USING (auth.uid() = parent_id OR auth.uid() = tutor_id);

-- 8. RLS Policies for Tutor Availability

-- Anyone can view tutor availability
CREATE POLICY "Public can view tutor availability" 
  ON public.tutor_availability FOR SELECT 
  USING (true);

-- Only tutors can manage their availability
CREATE POLICY "Tutors can manage their availability" 
  ON public.tutor_availability FOR ALL 
  USING (auth.uid() = tutor_id)
  WITH CHECK (auth.uid() = tutor_id);

-- 9. RLS Policies for Scheduled Sessions

-- Users can view sessions they're part of
CREATE POLICY "Users can view their sessions" 
  ON public.scheduled_sessions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.id = contract_id
      AND (c.parent_id = auth.uid() OR c.tutor_id = auth.uid())
    )
  );

-- Users can update sessions they're part of
CREATE POLICY "Users can update their sessions" 
  ON public.scheduled_sessions FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.id = contract_id
      AND (c.parent_id = auth.uid() OR c.tutor_id = auth.uid())
    )
  );

-- 10. Function to check if a time slot is available for a tutor
CREATE OR REPLACE FUNCTION public.is_tutor_available(
  p_tutor_id UUID,
  p_scheduled_at TIMESTAMPTZ,
  p_duration_minutes INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_day_of_week INTEGER;
  v_time TIME;
  v_available BOOLEAN;
BEGIN
  -- Extract day of week and time from scheduled_at
  v_day_of_week := EXTRACT(DOW FROM p_scheduled_at);
  v_time := p_scheduled_at::TIME;
  
  -- Check if tutor has availability for this day/time
  SELECT EXISTS (
    SELECT 1 FROM public.tutor_availability
    WHERE tutor_id = p_tutor_id
    AND day_of_week = v_day_of_week
    AND is_blocked = FALSE
    AND start_time <= v_time
    AND end_time >= (v_time + (p_duration_minutes || ' minutes')::INTERVAL)
  ) INTO v_available;
  
  -- Also check for conflicts with existing interviews
  IF v_available THEN
    SELECT NOT EXISTS (
      SELECT 1 FROM public.interviews
      WHERE tutor_id = p_tutor_id
      AND status IN ('SCHEDULED', 'COMPLETED')
      AND (
        (scheduled_at <= p_scheduled_at AND scheduled_at + (duration_minutes || ' minutes')::INTERVAL > p_scheduled_at)
        OR
        (scheduled_at < p_scheduled_at + (p_duration_minutes || ' minutes')::INTERVAL AND scheduled_at >= p_scheduled_at)
      )
    ) INTO v_available;
  END IF;
  
  RETURN v_available;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_tutor_available(UUID, TIMESTAMPTZ, INTEGER) TO authenticated;

-- 11. Function to get tutor's available time slots for a date
CREATE OR REPLACE FUNCTION public.get_tutor_available_slots(
  p_tutor_id UUID,
  p_date DATE,
  p_duration_minutes INTEGER DEFAULT 30
)
RETURNS TABLE (
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN
) AS $$
DECLARE
  v_day_of_week INTEGER;
BEGIN
  v_day_of_week := EXTRACT(DOW FROM p_date);
  
  RETURN QUERY
  WITH availability_slots AS (
    SELECT 
      ta.start_time as slot_start,
      ta.end_time as slot_end
    FROM public.tutor_availability ta
    WHERE ta.tutor_id = p_tutor_id
    AND ta.day_of_week = v_day_of_week
    AND ta.is_blocked = FALSE
  ),
  booked_slots AS (
    SELECT 
      i.scheduled_at::TIME as booked_start,
      (i.scheduled_at + (i.duration_minutes || ' minutes')::INTERVAL)::TIME as booked_end
    FROM public.interviews i
    WHERE i.tutor_id = p_tutor_id
    AND i.status IN ('SCHEDULED')
    AND i.scheduled_at::DATE = p_date
  )
  SELECT 
    a.slot_start,
    a.slot_end,
    NOT EXISTS (
      SELECT 1 FROM booked_slots b
      WHERE b.booked_start < a.slot_end
      AND b.booked_end > a.slot_start
    ) as is_available
  FROM availability_slots a;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_tutor_available_slots(UUID, DATE, INTEGER) TO authenticated;
