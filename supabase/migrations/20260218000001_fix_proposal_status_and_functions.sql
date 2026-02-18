-- Add SHORTLISTED to ProposalStatus enum if not exists
-- And add send_contract_offer function

-- 1. Add SHORTLISTED to ProposalStatus enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'SHORTLISTED' 
    AND enumtypid = '"ProposalStatus"'::regtype
  ) THEN
    ALTER TYPE "ProposalStatus" ADD VALUE 'SHORTLISTED';
  END IF;
END $$;

-- 2. Create send_contract_offer function if not exists
CREATE OR REPLACE FUNCTION send_contract_offer(
  p_job_post_id UUID,
  p_proposal_id UUID,
  p_parent_id UUID,
  p_tutor_id UUID,
  p_amount DECIMAL,
  p_currency TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_contract_id UUID;
  v_job_title TEXT;
BEGIN
  -- Get job title for notification
  SELECT title INTO v_job_title
  FROM job_posts
  WHERE id = p_job_post_id;

  -- Create contract in PENDING_ACCEPTANCE status
  INSERT INTO contracts (
    job_post_id,
    proposal_id,
    parent_id,
    tutor_id,
    amount,
    currency,
    status,
    description,
    created_at,
    updated_at
  ) VALUES (
    p_job_post_id,
    p_proposal_id,
    p_parent_id,
    p_tutor_id,
    p_amount,
    COALESCE(p_currency, 'ETB'),
    'PENDING_ACCEPTANCE',
    p_description,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_contract_id;

  -- Update proposal status
  UPDATE proposals
  SET status = 'ACCEPTED',
      updated_at = NOW()
  WHERE id = p_proposal_id;

  -- Update job post hired_tutor_id
  UPDATE job_posts
  SET hired_tutor_id = p_tutor_id,
      hired_at = NOW(),
      updated_at = NOW()
  WHERE id = p_job_post_id;

  -- Update other proposals to DECLINED
  UPDATE proposals
  SET status = 'DECLINED',
      updated_at = NOW()
  WHERE job_post_id = p_job_post_id
  AND id != p_proposal_id
  AND status NOT IN ('ACCEPTED', 'DECLINED');

  -- Notify tutor about contract offer
  PERFORM queue_notification(
    p_tutor_id,
    'CONTRACT_OFFER'::"NotificationType",
    'New contract offer',
    '<p>You have received a contract offer for: <strong>' || COALESCE(v_job_title, 'a tutoring job') || '</strong></p>' ||
    '<p>Amount: ' || p_amount || ' ' || COALESCE(p_currency, 'ETB') || '</p>' ||
    '<p>Review and accept or decline this offer.</p>',
    'New contract offer! Review and accept.',
    jsonb_build_object(
      'contract_id', v_contract_id,
      'job_post_id', p_job_post_id,
      'parent_id', p_parent_id,
      'amount', p_amount,
      'currency', p_currency
    )
  );

  -- Notify parent that offer was sent
  PERFORM queue_notification(
    p_parent_id,
    'CONTRACT_OFFER_SENT'::"NotificationType",
    'Contract offer sent',
    '<p>Your contract offer has been sent to the tutor.</p>' ||
    '<p>Waiting for their response.</p>',
    'Contract offer sent. Waiting for tutor response.',
    jsonb_build_object(
      'contract_id', v_contract_id,
      'job_post_id', p_job_post_id,
      'tutor_id', p_tutor_id
    )
  );

  RETURN v_contract_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION send_contract_offer(UUID, UUID, UUID, UUID, DECIMAL, TEXT, TEXT) TO authenticated;

-- 3. Add notification types if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'CONTRACT_OFFER' 
    AND enumtypid = '"NotificationType"'::regtype
  ) THEN
    ALTER TYPE "NotificationType" ADD VALUE 'CONTRACT_OFFER';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'CONTRACT_OFFER_SENT' 
    AND enumtypid = '"NotificationType"'::regtype
  ) THEN
    ALTER TYPE "NotificationType" ADD VALUE 'CONTRACT_OFFER_SENT';
  END IF;
END $$;
