-- Migration: Add Job Posting and Application Notifications
-- Created: 2026-02-14
-- Description: Adds notifications for job postings and proposal submissions

-- ============================================
-- 1. NOTIFY PARENT WHEN TUTOR APPLIES (Proposal Created)
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_parent_on_proposal()
RETURNS TRIGGER AS $$
DECLARE
  v_job_title TEXT;
  v_tutor_name TEXT;
  v_parent_id UUID;
BEGIN
  -- Get job details
  SELECT j.title, j.parent_id, p.name
  INTO v_job_title, v_parent_id, v_tutor_name
  FROM public.job_posts j
  JOIN public.profiles p ON NEW.tutor_id = p.id
  WHERE j.id = NEW.job_post_id;

  -- Notify parent that someone applied
  PERFORM public.queue_notification(
    v_parent_id,
    'NEW_PROPOSAL'::"NotificationType",
    'New application received',
    '<p><strong>' || v_tutor_name || '</strong> applied to your job "' || v_job_title || '"</p><p>Review their proposal and schedule an interview.</p>',
    v_tutor_name || ' applied to your job "' || v_job_title || '". Review their proposal.',
    jsonb_build_object('proposal_id', NEW.id, 'job_post_id', NEW.job_post_id, 'tutor_id', NEW.tutor_id)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for parent notification
DROP TRIGGER IF EXISTS on_proposal_created_notify_parent ON public.proposals;
CREATE TRIGGER on_proposal_created_notify_parent
  AFTER INSERT ON public.proposals
  FOR EACH ROW EXECUTE PROCEDURE public.notify_parent_on_proposal();

-- ============================================
-- 2. NOTIFY TUTORS WHEN NEW JOB IS POSTED
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_tutors_on_new_job()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_name TEXT;
  v_matching_tutors UUID[];
  v_tutor_id UUID;
BEGIN
  -- Get parent name
  SELECT name INTO v_parent_name
  FROM public.profiles
  WHERE id = NEW.parent_id;

  -- Find tutors who match the job subjects (if subjects specified)
  IF array_length(NEW.subjects, 1) > 0 THEN
    SELECT array_agg(tp.user_id)
    INTO v_matching_tutors
    FROM public.tutor_profiles tp
    WHERE tp.subjects && NEW.subjects; -- Overlap between arrays
  END IF;

  -- If no subject match or no subjects, notify all tutors (optional - can be limited)
  IF v_matching_tutors IS NULL OR array_length(v_matching_tutors, 1) = 0 THEN
    -- Get all tutor IDs (limit to prevent spam)
    SELECT array_agg(p.id)
    INTO v_matching_tutors
    FROM public.profiles p
    WHERE p.role = 'TUTOR'
    LIMIT 100; -- Limit to prevent too many notifications
  END IF;

  -- Notify each matching tutor
  IF v_matching_tutors IS NOT NULL THEN
    FOREACH v_tutor_id IN ARRAY v_matching_tutors
    LOOP
      -- Skip if it's the parent posting (shouldn't happen but safety check)
      IF v_tutor_id != NEW.parent_id THEN
        PERFORM public.queue_notification(
          v_tutor_id,
          'NEW_PROPOSAL'::"NotificationType", -- Using NEW_PROPOSAL or create NEW_JOB type
          'New tutoring job available',
          '<p>A new job matching your expertise was posted by ' || v_parent_name || '</p><p><strong>' || NEW.title || '</strong></p><p>Click to view and apply.</p>',
          'New job: "' || NEW.title || '" posted by ' || v_parent_name || '. Apply now!',
          jsonb_build_object('job_post_id', NEW.id, 'parent_id', NEW.parent_id)
        );
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for tutor notifications on new job
DROP TRIGGER IF EXISTS on_job_posted_notify_tutors ON public.job_posts;
CREATE TRIGGER on_job_posted_notify_tutors
  AFTER INSERT ON public.job_posts
  FOR EACH ROW 
  WHEN (NEW.status = 'OPEN')
  EXECUTE PROCEDURE public.notify_tutors_on_new_job();

-- ============================================
-- 3. NOTIFY TUTOR WHEN PROPOSAL IS ACCEPTED
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_tutor_on_proposal_accepted()
RETURNS TRIGGER AS $$
DECLARE
  v_job_title TEXT;
  v_parent_name TEXT;
  v_tutor_id UUID;
BEGIN
  -- Only notify if status changed to ACCEPTED
  IF NEW.status = 'ACCEPTED' AND OLD.status != 'ACCEPTED' THEN
    -- Get job and parent details
    SELECT j.title, j.parent_id, p.name, NEW.tutor_id
    INTO v_job_title, v_parent_id, v_parent_name, v_tutor_id
    FROM public.job_posts j
    JOIN public.profiles p ON j.parent_id = p.id
    WHERE j.id = NEW.job_post_id;

    -- Notify tutor they were hired
    PERFORM public.queue_notification(
      v_tutor_id,
      'PROPOSAL_ACCEPTED'::"NotificationType",
      'Congratulations! Your proposal was accepted',
      '<p>Your proposal for "' || v_job_title || '" was accepted by ' || v_parent_name || '</p><p>A contract has been created. Check your contracts page.</p>',
      'Great news! Your proposal for "' || v_job_title || '" was accepted. A contract has been created.',
      jsonb_build_object('proposal_id', NEW.id, 'job_post_id', NEW.job_post_id, 'contract_id', NEW.contract_id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for tutor notification on acceptance
DROP TRIGGER IF EXISTS on_proposal_accepted_notify_tutor ON public.proposals;
CREATE TRIGGER on_proposal_accepted_notify_tutor
  AFTER UPDATE ON public.proposals
  FOR EACH ROW 
  WHEN (NEW.status = 'ACCEPTED' AND OLD.status != 'ACCEPTED')
  EXECUTE PROCEDURE public.notify_tutor_on_proposal_accepted();

-- ============================================
-- 4. NOTIFY TUTOR WHEN PROPOSAL IS DECLINED
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_tutor_on_proposal_declined()
RETURNS TRIGGER AS $$
DECLARE
  v_job_title TEXT;
  v_parent_name TEXT;
BEGIN
  -- Only notify if status changed to DECLINED
  IF NEW.status = 'DECLINED' AND OLD.status != 'DECLINED' THEN
    -- Get job and parent details
    SELECT j.title, p.name
    INTO v_job_title, v_parent_name
    FROM public.job_posts j
    JOIN public.profiles p ON j.parent_id = p.id
    WHERE j.id = NEW.job_post_id;

    -- Notify tutor
    PERFORM public.queue_notification(
      NEW.tutor_id,
      'PROPOSAL_DECLINED'::"NotificationType",
      'Update on your proposal',
      '<p>Your proposal for "' || v_job_title || '" was not selected by ' || v_parent_name || '</p><p>Don\'t be discouraged! Keep applying to other jobs.</p>',
      'Your proposal for "' || v_job_title || '" was not selected. Keep applying!',
      jsonb_build_object('proposal_id', NEW.id, 'job_post_id', NEW.job_post_id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for tutor notification on decline
DROP TRIGGER IF EXISTS on_proposal_declined_notify_tutor ON public.proposals;
CREATE TRIGGER on_proposal_declined_notify_tutor
  AFTER UPDATE ON public.proposals
  FOR EACH ROW 
  WHEN (NEW.status = 'DECLINED' AND OLD.status != 'DECLINED')
  EXECUTE PROCEDURE public.notify_tutor_on_proposal_declined();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.notify_parent_on_proposal() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_tutors_on_new_job() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_tutor_on_proposal_accepted() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_tutor_on_proposal_declined() TO authenticated;
