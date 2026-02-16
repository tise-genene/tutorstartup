-- Migration: Session Notification Triggers
-- Created: 2026-02-14
-- Description: Adds triggers for session-related notifications

-- 1. Function to notify on new session scheduled
CREATE OR REPLACE FUNCTION public.notify_on_session_scheduled()
RETURNS TRIGGER AS $$
DECLARE
  v_contract RECORD;
  v_tutor_name TEXT;
  v_parent_name TEXT;
  v_job_title TEXT;
BEGIN
  -- Get contract details
  SELECT 
    c.parent_id, 
    c.tutor_id,
    j.title as job_title,
    p.name as parent_name,
    t.name as tutor_name
  INTO v_contract
  FROM public.contracts c
  JOIN public.job_posts j ON c.job_post_id = j.id
  JOIN public.profiles p ON c.parent_id = p.id
  JOIN public.profiles t ON c.tutor_id = t.id
  WHERE c.id = NEW.contract_id;

  -- Notify parent
  PERFORM public.queue_notification(
    v_contract.parent_id,
    'SESSION_REMINDER'::"NotificationType",
    'New tutoring session scheduled',
    '<p>A new tutoring session has been scheduled for "' || v_contract.job_title || '"</p><p>Date: ' || NEW.scheduled_at::TEXT || '</p>',
    'A new tutoring session has been scheduled for "' || v_contract.job_title || '" on ' || NEW.scheduled_at::TEXT,
    jsonb_build_object('session_id', NEW.id, 'contract_id', NEW.contract_id)
  );

  -- Notify tutor
  PERFORM public.queue_notification(
    v_contract.tutor_id,
    'SESSION_REMINDER'::"NotificationType",
    'New tutoring session scheduled',
    '<p>A new tutoring session has been scheduled for "' || v_contract.job_title || '"</p><p>Date: ' || NEW.scheduled_at::TEXT || '</p>',
    'A new tutoring session has been scheduled for "' || v_contract.job_title || '" on ' || NEW.scheduled_at::TEXT,
    jsonb_build_object('session_id', NEW.id, 'contract_id', NEW.contract_id)
  );

  -- Schedule 24-hour reminder if session is more than 24 hours away
  IF NEW.scheduled_at > NOW() + INTERVAL '24 hours' THEN
    PERFORM public.queue_notification(
      v_contract.parent_id,
      'SESSION_REMINDER'::"NotificationType",
      'Reminder: Tutoring session in 24 hours',
      '<p>Reminder: You have a tutoring session tomorrow for "' || v_contract.job_title || '"</p>',
      'Reminder: You have a tutoring session tomorrow for "' || v_contract.job_title || '"',
      jsonb_build_object('session_id', NEW.id, 'contract_id', NEW.contract_id),
      NEW.scheduled_at - INTERVAL '24 hours'
    );

    PERFORM public.queue_notification(
      v_contract.tutor_id,
      'SESSION_REMINDER'::"NotificationType",
      'Reminder: Tutoring session in 24 hours',
      '<p>Reminder: You have a tutoring session tomorrow for "' || v_contract.job_title || '"</p>',
      'Reminder: You have a tutoring session tomorrow for "' || v_contract.job_title || '"',
      jsonb_build_object('session_id', NEW.id, 'contract_id', NEW.contract_id),
      NEW.scheduled_at - INTERVAL '24 hours'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_session_scheduled_notification
  AFTER INSERT ON public.scheduled_sessions
  FOR EACH ROW EXECUTE PROCEDURE public.notify_on_session_scheduled();

-- 2. Function to notify on session cancelled
CREATE OR REPLACE FUNCTION public.notify_on_session_cancelled()
RETURNS TRIGGER AS $$
DECLARE
  v_contract RECORD;
BEGIN
  -- Only notify if status changed to CANCELLED
  IF NEW.status = 'CANCELLED' AND OLD.status != 'CANCELLED' THEN
    -- Get contract details
    SELECT 
      c.parent_id, 
      c.tutor_id,
      j.title as job_title
    INTO v_contract
    FROM public.contracts c
    JOIN public.job_posts j ON c.job_post_id = j.id
    WHERE c.id = NEW.contract_id;

    -- Notify parent
    PERFORM public.queue_notification(
      v_contract.parent_id,
      'SESSION_REMINDER'::"NotificationType",
      'Tutoring session cancelled',
      '<p>A tutoring session for "' || v_contract.job_title || '" has been cancelled.</p>',
      'A tutoring session for "' || v_contract.job_title || '" has been cancelled.',
      jsonb_build_object('session_id', NEW.id, 'contract_id', NEW.contract_id)
    );

    -- Notify tutor
    PERFORM public.queue_notification(
      v_contract.tutor_id,
      'SESSION_REMINDER'::"NotificationType",
      'Tutoring session cancelled',
      '<p>A tutoring session for "' || v_contract.job_title || '" has been cancelled.</p>',
      'A tutoring session for "' || v_contract.job_title || '" has been cancelled.',
      jsonb_build_object('session_id', NEW.id, 'contract_id', NEW.contract_id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_session_cancelled_notification
  AFTER UPDATE ON public.scheduled_sessions
  FOR EACH ROW 
  WHEN (NEW.status = 'CANCELLED' AND OLD.status != 'CANCELLED')
  EXECUTE PROCEDURE public.notify_on_session_cancelled();

-- 3. Function to create daily session reminders
CREATE OR REPLACE FUNCTION public.create_session_reminders()
RETURNS VOID AS $$
DECLARE
  v_session RECORD;
  v_contract RECORD;
BEGIN
  -- Find sessions happening tomorrow that haven't had reminders sent
  FOR v_session IN
    SELECT s.id, s.contract_id, s.scheduled_at, j.title as job_title
    FROM public.scheduled_sessions s
    JOIN public.contracts c ON s.contract_id = c.id
    JOIN public.job_posts j ON c.job_post_id = j.id
    WHERE s.status = 'SCHEDULED'
    AND s.scheduled_at > NOW() + INTERVAL '23 hours'
    AND s.scheduled_at <= NOW() + INTERVAL '25 hours'
    AND NOT EXISTS (
      SELECT 1 FROM public.email_notifications en
      WHERE en.metadata->>'session_id' = s.id::TEXT
      AND en.type = 'SESSION_REMINDER'
      AND en.scheduled_for = s.scheduled_at - INTERVAL '24 hours'
    )
  LOOP
    -- Get contract details
    SELECT parent_id, tutor_id INTO v_contract
    FROM public.contracts
    WHERE id = v_session.contract_id;

    -- Schedule reminder for parent
    PERFORM public.queue_notification(
      v_contract.parent_id,
      'SESSION_REMINDER'::"NotificationType",
      'Reminder: Tutoring session tomorrow',
      '<p>You have a tutoring session tomorrow for "' || v_session.job_title || '"</p>',
      'You have a tutoring session tomorrow for "' || v_session.job_title || '"',
      jsonb_build_object('session_id', v_session.id, 'contract_id', v_session.contract_id),
      v_session.scheduled_at - INTERVAL '24 hours'
    );

    -- Schedule reminder for tutor
    PERFORM public.queue_notification(
      v_contract.tutor_id,
      'SESSION_REMINDER'::"NotificationType",
      'Reminder: Tutoring session tomorrow',
      '<p>You have a tutoring session tomorrow for "' || v_session.job_title || '"</p>',
      'You have a tutoring session tomorrow for "' || v_session.job_title || '"',
      jsonb_build_object('session_id', v_session.id, 'contract_id', v_session.contract_id),
      v_session.scheduled_at - INTERVAL '24 hours'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_session_reminders() TO authenticated;
