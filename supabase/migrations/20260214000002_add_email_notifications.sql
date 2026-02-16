-- Migration: Email Notification System
-- Created: 2026-02-14
-- Description: Adds email notifications and user preferences tables

-- 1. Create notification type enum
CREATE TYPE "NotificationType" AS ENUM (
  'NEW_MESSAGE',
  'NEW_PROPOSAL',
  'PROPOSAL_ACCEPTED',
  'PROPOSAL_DECLINED',
  'INTERVIEW_SCHEDULED',
  'INTERVIEW_REMINDER_24H',
  'INTERVIEW_REMINDER_1H',
  'INTERVIEW_CANCELLED',
  'INTERVIEW_RESCHEDULED',
  'CONTRACT_CREATED',
  'SESSION_REMINDER',
  'PAYMENT_RECEIVED',
  'PAYMENT_SENT',
  'NEW_LESSON_REQUEST',
  'LESSON_REQUEST_ACCEPTED',
  'LESSON_REQUEST_DECLINED',
  'WELCOME',
  'PASSWORD_RESET'
);

-- 2. Create notification status enum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'DELIVERED', 'OPENED');

-- 3. Create email notifications table
CREATE TABLE public.email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type "NotificationType" NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,
  recipient_email TEXT NOT NULL,
  status "NotificationStatus" DEFAULT 'PENDING',
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create user notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  new_message_email BOOLEAN DEFAULT TRUE,
  new_proposal_email BOOLEAN DEFAULT TRUE,
  proposal_accepted_email BOOLEAN DEFAULT TRUE,
  proposal_declined_email BOOLEAN DEFAULT TRUE,
  interview_scheduled_email BOOLEAN DEFAULT TRUE,
  interview_reminder_email BOOLEAN DEFAULT TRUE,
  interview_cancelled_email BOOLEAN DEFAULT TRUE,
  contract_created_email BOOLEAN DEFAULT TRUE,
  payment_received_email BOOLEAN DEFAULT TRUE,
  lesson_request_email BOOLEAN DEFAULT TRUE,
  marketing_email BOOLEAN DEFAULT FALSE,
  digest_email BOOLEAN DEFAULT FALSE, -- Daily digest instead of instant
  digest_frequency TEXT DEFAULT 'daily', -- 'daily', 'weekly', 'never'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 5. Create notification queue table (for processing scheduled notifications)
CREATE TABLE public.notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES public.email_notifications(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  priority INTEGER DEFAULT 5, -- 1 = highest, 10 = lowest
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create indexes for performance
CREATE INDEX idx_email_notifications_user_id ON public.email_notifications(user_id);
CREATE INDEX idx_email_notifications_type ON public.email_notifications(type);
CREATE INDEX idx_email_notifications_status ON public.email_notifications(status);
CREATE INDEX idx_email_notifications_scheduled_for ON public.email_notifications(scheduled_for);
CREATE INDEX idx_email_notifications_created_at ON public.email_notifications(created_at DESC);
CREATE INDEX idx_notification_preferences_user_id ON public.notification_preferences(user_id);
CREATE INDEX idx_notification_queue_scheduled_for ON public.notification_queue(scheduled_for);
CREATE INDEX idx_notification_queue_status ON public.notification_queue(status);

-- 7. Enable Row Level Security
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for email_notifications

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" 
  ON public.email_notifications FOR SELECT 
  USING (auth.uid() = user_id);

-- System can insert notifications (service role only, via edge functions)
CREATE POLICY "Service can insert notifications" 
  ON public.email_notifications FOR INSERT 
  WITH CHECK (true); -- Edge functions will handle this

-- Users can update their own notifications (mark as read, etc.)
CREATE POLICY "Users can update their own notifications" 
  ON public.email_notifications FOR UPDATE 
  USING (auth.uid() = user_id);

-- 9. RLS Policies for notification_preferences

-- Users can view their own preferences
CREATE POLICY "Users can view their own preferences" 
  ON public.notification_preferences FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can create their own preferences
CREATE POLICY "Users can create their own preferences" 
  ON public.notification_preferences FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update their own preferences" 
  ON public.notification_preferences FOR UPDATE 
  USING (auth.uid() = user_id);

-- 10. Function to create default notification preferences on user signup
CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Trigger to create preferences when profile is created
CREATE TRIGGER on_profile_created_preferences
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.create_default_notification_preferences();

-- 12. Function to queue a notification for sending
CREATE OR REPLACE FUNCTION public.queue_notification(
  p_user_id UUID,
  p_type "NotificationType",
  p_subject TEXT,
  p_body_html TEXT,
  p_body_text TEXT,
  p_metadata JSONB DEFAULT '{}',
  p_scheduled_for TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_user_email TEXT;
BEGIN
  -- Get user's email
  SELECT email INTO v_user_email
  FROM public.profiles
  WHERE id = p_user_id;

  -- Check if user wants this type of notification
  IF NOT EXISTS (
    SELECT 1 FROM public.notification_preferences
    WHERE user_id = p_user_id
    AND CASE p_type
      WHEN 'NEW_MESSAGE' THEN new_message_email
      WHEN 'NEW_PROPOSAL' THEN new_proposal_email
      WHEN 'PROPOSAL_ACCEPTED' THEN proposal_accepted_email
      WHEN 'PROPOSAL_DECLINED' THEN proposal_declined_email
      WHEN 'INTERVIEW_SCHEDULED' THEN interview_scheduled_email
      WHEN 'INTERVIEW_REMINDER_24H' THEN interview_reminder_email
      WHEN 'INTERVIEW_REMINDER_1H' THEN interview_reminder_email
      WHEN 'INTERVIEW_CANCELLED' THEN interview_cancelled_email
      WHEN 'CONTRACT_CREATED' THEN contract_created_email
      WHEN 'PAYMENT_RECEIVED' THEN payment_received_email
      WHEN 'NEW_LESSON_REQUEST' THEN lesson_request_email
      ELSE TRUE
    END = TRUE
  ) THEN
    RETURN NULL; -- User has disabled this notification type
  END IF;

  -- Create notification
  INSERT INTO public.email_notifications (
    user_id,
    type,
    subject,
    body_html,
    body_text,
    recipient_email,
    metadata,
    scheduled_for,
    status
  ) VALUES (
    p_user_id,
    p_type,
    p_subject,
    p_body_html,
    p_body_text,
    v_user_email,
    p_metadata,
    COALESCE(p_scheduled_for, NOW()),
    CASE WHEN p_scheduled_for IS NULL THEN 'PENDING' ELSE 'PENDING' END
  )
  RETURNING id INTO v_notification_id;

  -- Add to queue if scheduled for future
  IF p_scheduled_for IS NOT NULL AND p_scheduled_for > NOW() THEN
    INSERT INTO public.notification_queue (notification_id, scheduled_for, priority)
    VALUES (v_notification_id, p_scheduled_for, 
      CASE p_type
        WHEN 'INTERVIEW_REMINDER_1H' THEN 1
        WHEN 'INTERVIEW_REMINDER_24H' THEN 2
        ELSE 5
      END
    );
  END IF;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.queue_notification(UUID, "NotificationType", TEXT, TEXT, TEXT, JSONB, TIMESTAMPTZ) TO authenticated;

-- 13. Function to mark notification as sent
CREATE OR REPLACE FUNCTION public.mark_notification_sent(p_notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.email_notifications
  SET status = 'SENT',
      sent_at = NOW(),
      updated_at = NOW()
  WHERE id = p_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.mark_notification_sent(UUID) TO authenticated;

-- 14. Function to mark notification as failed
CREATE OR REPLACE FUNCTION public.mark_notification_failed(p_notification_id UUID, p_error_message TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.email_notifications
  SET status = 'FAILED',
      error_message = p_error_message,
      retry_count = retry_count + 1,
      updated_at = NOW()
  WHERE id = p_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.mark_notification_failed(UUID, TEXT) TO authenticated;

-- 15. Function to create interview reminder notifications
CREATE OR REPLACE FUNCTION public.create_interview_reminders()
RETURNS VOID AS $$
DECLARE
  v_interview RECORD;
  v_notification_id UUID;
BEGIN
  -- 24-hour reminders
  FOR v_interview IN
    SELECT i.id, i.parent_id, i.tutor_id, i.scheduled_at, p.name as tutor_name, pr.name as parent_name
    FROM public.interviews i
    JOIN public.profiles p ON i.tutor_id = p.id
    JOIN public.profiles pr ON i.parent_id = pr.id
    WHERE i.status = 'SCHEDULED'
    AND i.scheduled_at > NOW() + INTERVAL '23 hours'
    AND i.scheduled_at <= NOW() + INTERVAL '25 hours'
    AND NOT EXISTS (
      SELECT 1 FROM public.email_notifications en
      WHERE en.metadata->>'interview_id' = i.id::TEXT
      AND en.type = 'INTERVIEW_REMINDER_24H'
    )
  LOOP
    -- Notify parent
    PERFORM public.queue_notification(
      v_interview.parent_id,
      'INTERVIEW_REMINDER_24H'::"NotificationType",
      'Reminder: Interview in 24 hours',
      '<p>Your interview with ' || v_interview.tutor_name || ' is scheduled for tomorrow.</p>',
      'Your interview with ' || v_interview.tutor_name || ' is scheduled for tomorrow.',
      jsonb_build_object('interview_id', v_interview.id)
    );

    -- Notify tutor
    PERFORM public.queue_notification(
      v_interview.tutor_id,
      'INTERVIEW_REMINDER_24H'::"NotificationType",
      'Reminder: Interview in 24 hours',
      '<p>You have an interview with ' || v_interview.parent_name || ' scheduled for tomorrow.</p>',
      'You have an interview with ' || v_interview.parent_name || ' scheduled for tomorrow.',
      jsonb_build_object('interview_id', v_interview.id)
    );
  END LOOP;

  -- 1-hour reminders
  FOR v_interview IN
    SELECT i.id, i.parent_id, i.tutor_id, i.scheduled_at, p.name as tutor_name, pr.name as parent_name
    FROM public.interviews i
    JOIN public.profiles p ON i.tutor_id = p.id
    JOIN public.profiles pr ON i.parent_id = pr.id
    WHERE i.status = 'SCHEDULED'
    AND i.scheduled_at > NOW() + INTERVAL '55 minutes'
    AND i.scheduled_at <= NOW() + INTERVAL '65 minutes'
    AND NOT EXISTS (
      SELECT 1 FROM public.email_notifications en
      WHERE en.metadata->>'interview_id' = i.id::TEXT
      AND en.type = 'INTERVIEW_REMINDER_1H'
    )
  LOOP
    -- Notify parent
    PERFORM public.queue_notification(
      v_interview.parent_id,
      'INTERVIEW_REMINDER_1H'::"NotificationType",
      'Reminder: Interview in 1 hour',
      '<p>Your interview with ' || v_interview.tutor_name || ' starts in 1 hour.</p>',
      'Your interview with ' || v_interview.tutor_name || ' starts in 1 hour.',
      jsonb_build_object('interview_id', v_interview.id)
    );

    -- Notify tutor
    PERFORM public.queue_notification(
      v_interview.tutor_id,
      'INTERVIEW_REMINDER_1H'::"NotificationType",
      'Reminder: Interview in 1 hour',
      '<p>You have an interview with ' || v_interview.parent_name || ' starting in 1 hour.</p>',
      'You have an interview with ' || v_interview.parent_name || ' starting in 1 hour.',
      jsonb_build_object('interview_id', v_interview.id)
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_interview_reminders() TO authenticated;

-- 16. Add trigger for new proposals to notify tutors
CREATE OR REPLACE FUNCTION public.notify_on_new_proposal()
RETURNS TRIGGER AS $$
DECLARE
  v_job_title TEXT;
  v_parent_name TEXT;
  v_parent_id UUID;
BEGIN
  -- Get job details
  SELECT j.title, p.name, j.parent_id
  INTO v_job_title, v_parent_name, v_parent_id
  FROM public.job_posts j
  JOIN public.profiles p ON j.parent_id = p.id
  WHERE j.id = NEW.job_post_id;

  -- Notify tutor
  PERFORM public.queue_notification(
    NEW.tutor_id,
    'NEW_PROPOSAL'::"NotificationType",
    'New proposal submitted',
    '<p>You submitted a proposal for "' || v_job_title || '"</p>',
    'You submitted a proposal for "' || v_job_title || '"',
    jsonb_build_object('proposal_id', NEW.id, 'job_post_id', NEW.job_post_id)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_proposal_created_notification
  AFTER INSERT ON public.proposals
  FOR EACH ROW EXECUTE PROCEDURE public.notify_on_new_proposal();

-- 17. Add trigger for new messages to notify recipient
CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS TRIGGER AS $$
DECLARE
  v_sender_name TEXT;
  v_conversation_id UUID;
  v_parent_id UUID;
  v_tutor_id UUID;
BEGIN
  -- Get conversation and sender details
  SELECT c.id, c.parent_id, c.tutor_id, p.name
  INTO v_conversation_id, v_parent_id, v_tutor_id, v_sender_name
  FROM public.conversations c
  JOIN public.profiles p ON NEW.sender_id = p.id
  WHERE c.id = NEW.conversation_id;

  -- Determine recipient (the other person)
  IF NEW.sender_id = v_parent_id THEN
    -- Message from parent to tutor
    PERFORM public.queue_notification(
      v_tutor_id,
      'NEW_MESSAGE'::"NotificationType",
      'New message from ' || v_sender_name,
      '<p>You have a new message from ' || v_sender_name || '</p>',
      'You have a new message from ' || v_sender_name,
      jsonb_build_object('conversation_id', v_conversation_id, 'message_id', NEW.id)
    );
  ELSE
    -- Message from tutor to parent
    PERFORM public.queue_notification(
      v_parent_id,
      'NEW_MESSAGE'::"NotificationType",
      'New message from ' || v_sender_name,
      '<p>You have a new message from ' || v_sender_name || '</p>',
      'You have a new message from ' || v_sender_name,
      jsonb_build_object('conversation_id', v_conversation_id, 'message_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_message_created_notification
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE PROCEDURE public.notify_on_new_message();

-- 18. Add trigger for interview scheduling
CREATE OR REPLACE FUNCTION public.notify_on_interview_scheduled()
RETURNS TRIGGER AS $$
DECLARE
  v_tutor_name TEXT;
  v_parent_name TEXT;
  v_job_title TEXT;
BEGIN
  -- Get details
  SELECT p.name, pr.name, j.title
  INTO v_tutor_name, v_parent_name, v_job_title
  FROM public.profiles p
  JOIN public.profiles pr ON NEW.parent_id = pr.id
  JOIN public.job_posts j ON NEW.job_post_id = j.id
  WHERE p.id = NEW.tutor_id;

  -- Notify tutor
  PERFORM public.queue_notification(
    NEW.tutor_id,
    'INTERVIEW_SCHEDULED'::"NotificationType",
    'Interview scheduled',
    '<p>An interview has been scheduled with ' || v_parent_name || ' for "' || v_job_title || '"</p>',
    'An interview has been scheduled with ' || v_parent_name || ' for "' || v_job_title || '"',
    jsonb_build_object('interview_id', NEW.id)
  );

  -- Schedule 24-hour reminder
  PERFORM public.queue_notification(
    NEW.parent_id,
    'INTERVIEW_REMINDER_24H'::"NotificationType",
    'Reminder: Interview in 24 hours',
    '<p>Your interview with ' || v_tutor_name || ' is scheduled for tomorrow.</p>',
    'Your interview with ' || v_tutor_name || ' is scheduled for tomorrow.',
    jsonb_build_object('interview_id', NEW.id),
    NEW.scheduled_at - INTERVAL '24 hours'
  );

  -- Schedule 1-hour reminder
  PERFORM public.queue_notification(
    NEW.parent_id,
    'INTERVIEW_REMINDER_1H'::"NotificationType",
    'Reminder: Interview in 1 hour',
    '<p>Your interview with ' || v_tutor_name || ' starts in 1 hour.</p>',
    'Your interview with ' || v_tutor_name || ' starts in 1 hour.',
    jsonb_build_object('interview_id', NEW.id),
    NEW.scheduled_at - INTERVAL '1 hour'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_interview_created_notification
  AFTER INSERT ON public.interviews
  FOR EACH ROW EXECUTE PROCEDURE public.notify_on_interview_scheduled();

-- 19. Add trigger for contract creation
CREATE OR REPLACE FUNCTION public.notify_on_contract_created()
RETURNS TRIGGER AS $$
DECLARE
  v_tutor_name TEXT;
  v_parent_name TEXT;
  v_job_title TEXT;
BEGIN
  -- Get details
  SELECT p.name, pr.name, j.title
  INTO v_tutor_name, v_parent_name, v_job_title
  FROM public.profiles p
  JOIN public.profiles pr ON NEW.parent_id = pr.id
  JOIN public.job_posts j ON NEW.job_post_id = j.id
  WHERE p.id = NEW.tutor_id;

  -- Notify tutor (hired!)
  PERFORM public.queue_notification(
    NEW.tutor_id,
    'CONTRACT_CREATED'::"NotificationType",
    'Congratulations! You have been hired',
    '<p>You have been hired by ' || v_parent_name || ' for ' || v_job_title || '</p>',
    'You have been hired by ' || v_parent_name || ' for ' || v_job_title,
    jsonb_build_object('contract_id', NEW.id)
  );

  -- Notify parent
  PERFORM public.queue_notification(
    NEW.parent_id,
    'CONTRACT_CREATED'::"NotificationType",
    'Contract created with ' || v_tutor_name,
    '<p>You have hired ' || v_tutor_name || ' for ' || v_job_title || '</p>',
    'You have hired ' || v_tutor_name || ' for ' || v_job_title,
    jsonb_build_object('contract_id', NEW.id)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_contract_created_notification
  AFTER INSERT ON public.contracts
  FOR EACH ROW EXECUTE PROCEDURE public.notify_on_contract_created();
