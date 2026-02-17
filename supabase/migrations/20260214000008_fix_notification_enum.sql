-- Migration: Fix Notification Status Type Casting
-- Created: 2026-02-14
-- Description: Fixes enum type casting in notification functions

-- Recreate queue_notification function with proper type casting
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
    'PENDING'::"NotificationStatus"
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

-- Recreate mark_notification_sent with proper type casting
CREATE OR REPLACE FUNCTION public.mark_notification_sent(p_notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.email_notifications
  SET status = 'SENT'::"NotificationStatus",
      sent_at = NOW(),
      updated_at = NOW()
  WHERE id = p_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate mark_notification_failed with proper type casting
CREATE OR REPLACE FUNCTION public.mark_notification_failed(p_notification_id UUID, p_error_message TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.email_notifications
  SET status = 'FAILED'::"NotificationStatus",
      error_message = p_error_message,
      retry_count = retry_count + 1,
      updated_at = NOW()
  WHERE id = p_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.queue_notification(UUID, "NotificationType", TEXT, TEXT, TEXT, JSONB, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notification_sent(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notification_failed(UUID, TEXT) TO authenticated;
