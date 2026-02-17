-- Fix: Add NEW_JOB notification type and update trigger
-- Created: 2026-02-17

-- 1. Add NEW_JOB to the NotificationType enum
-- Note: PostgreSQL doesn't allow adding values to enums in some versions, 
-- so we need to handle this carefully
DO $$
BEGIN
  -- Check if NEW_JOB already exists in the enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'NEW_JOB' 
    AND enumtypid = '"NotificationType"'::regtype
  ) THEN
    -- Add NEW_JOB to the enum
    ALTER TYPE "NotificationType" ADD VALUE 'NEW_JOB';
  END IF;
END $$;

-- 2. Update the notify_tutors_on_new_job function to use NEW_JOB type
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
          'NEW_JOB'::"NotificationType",
          'New tutoring job available',
          '<p>A new job matching your expertise was posted by ' || COALESCE(v_parent_name, 'a client') || '</p><p><strong>' || NEW.title || '</strong></p><p>Click to view and apply.</p>',
          'New job: "' || NEW.title || '" posted by ' || COALESCE(v_parent_name, 'a client') || '. Apply now!',
          jsonb_build_object('job_post_id', NEW.id, 'parent_id', NEW.parent_id)
        );
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recreate the trigger to ensure it's properly bound
DROP TRIGGER IF EXISTS on_job_posted_notify_tutors ON public.job_posts;
CREATE TRIGGER on_job_posted_notify_tutors
  AFTER INSERT ON public.job_posts
  FOR EACH ROW 
  WHEN (NEW.status = 'OPEN')
  EXECUTE PROCEDURE public.notify_tutors_on_new_job();

-- 4. Grant execute permission
GRANT EXECUTE ON FUNCTION public.notify_tutors_on_new_job() TO authenticated;
