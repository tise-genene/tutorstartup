-- Fix Contract Flow to Match Upwork Model
-- Client sends offer → Tutor reviews → Tutor accepts/declines → Contract active

-- 1. Add PENDING_ACCEPTANCE to ContractStatus enum
-- Note: PostgreSQL doesn't allow modifying enums easily, so we need to recreate it
-- First, check current values and add if missing
DO $$
BEGIN
  -- Check if PENDING_ACCEPTANCE already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'PENDING_ACCEPTANCE' 
    AND enumtypid = '"ContractStatus"'::regtype
  ) THEN
    -- Add the new value
    ALTER TYPE "ContractStatus" ADD VALUE 'PENDING_ACCEPTANCE';
  END IF;
END $$;

-- 2. Create function for client to send contract offer
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

-- 3. Create function for tutor to accept contract offer
CREATE OR REPLACE FUNCTION accept_contract_offer(
  p_contract_id UUID,
  p_tutor_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_contract RECORD;
  v_job_title TEXT;
BEGIN
  -- Get contract details
  SELECT c.*, j.title
  INTO v_contract
  FROM contracts c
  JOIN job_posts j ON c.job_post_id = j.id
  WHERE c.id = p_contract_id;

  -- Validate
  IF v_contract IS NULL THEN
    RAISE EXCEPTION 'Contract not found';
  END IF;

  IF v_contract.tutor_id != p_tutor_id THEN
    RAISE EXCEPTION 'Only the invited tutor can accept this contract';
  END IF;

  IF v_contract.status != 'PENDING_ACCEPTANCE' THEN
    RAISE EXCEPTION 'Contract is not in pending acceptance state';
  END IF;

  -- Update contract to ACTIVE
  UPDATE contracts
  SET 
    status = 'ACTIVE',
    accepted_at = NOW(),
    updated_at = NOW()
  WHERE id = p_contract_id;

  -- Notify parent
  PERFORM queue_notification(
    v_contract.parent_id,
    'CONTRACT_ACCEPTED'::"NotificationType",
    'Contract accepted!',
    '<p>The tutor has accepted your contract offer for: <strong>' || COALESCE(v_contract.title, 'the tutoring job') || '</strong></p>' ||
    '<p>You can now proceed with payment.</p>',
    'Tutor accepted your contract! Proceed with payment.',
    jsonb_build_object(
      'contract_id', p_contract_id,
      'job_post_id', v_contract.job_post_id
    )
  );

  -- Close the job post
  UPDATE job_posts
  SET 
    status = 'CLOSED',
    closed_at = NOW(),
    updated_at = NOW()
  WHERE id = v_contract.job_post_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create function for tutor to decline contract offer
CREATE OR REPLACE FUNCTION decline_contract_offer(
  p_contract_id UUID,
  p_tutor_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_contract RECORD;
BEGIN
  -- Get contract details
  SELECT c.*, j.title
  INTO v_contract
  FROM contracts c
  JOIN job_posts j ON c.job_post_id = j.id
  WHERE c.id = p_contract_id;

  -- Validate
  IF v_contract IS NULL THEN
    RAISE EXCEPTION 'Contract not found';
  END IF;

  IF v_contract.tutor_id != p_tutor_id THEN
    RAISE EXCEPTION 'Only the invited tutor can decline this contract';
  END IF;

  IF v_contract.status != 'PENDING_ACCEPTANCE' THEN
    RAISE EXCEPTION 'Contract is not in pending acceptance state';
  END IF;

  -- Update contract to CANCELLED
  UPDATE contracts
  SET 
    status = 'CANCELLED',
    cancelled_at = NOW(),
    cancelled_by = p_tutor_id,
    cancellation_reason = COALESCE(p_reason, 'Tutor declined the offer'),
    updated_at = NOW()
  WHERE id = p_contract_id;

  -- Revert proposal status back to SUBMITTED
  UPDATE proposals
  SET status = 'SUBMITTED',
      updated_at = NOW()
  WHERE id = v_contract.proposal_id;

  -- Clear hired_tutor_id from job
  UPDATE job_posts
  SET hired_tutor_id = NULL,
      hired_at = NULL,
      updated_at = NOW()
  WHERE id = v_contract.job_post_id;

  -- Notify parent
  PERFORM queue_notification(
    v_contract.parent_id,
    'CONTRACT_DECLINED'::"NotificationType",
    'Contract declined',
    '<p>The tutor has declined your contract offer for: <strong>' || COALESCE(v_contract.title, 'the tutoring job') || '</strong></p>' ||
    COALESCE('<p>Reason: ' || p_reason || '</p>', '') ||
    '<p>You can review other proposals or send a new offer.</p>',
    'Tutor declined contract offer. Review other proposals.',
    jsonb_build_object(
      'contract_id', p_contract_id,
      'job_post_id', v_contract.job_post_id,
      'reason', p_reason
    )
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Add notification types for contract offer flow
DO $$
BEGIN
  -- Add CONTRACT_OFFER
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'CONTRACT_OFFER' 
    AND enumtypid = '"NotificationType"'::regtype
  ) THEN
    ALTER TYPE "NotificationType" ADD VALUE 'CONTRACT_OFFER';
  END IF;

  -- Add CONTRACT_OFFER_SENT
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'CONTRACT_OFFER_SENT' 
    AND enumtypid = '"NotificationType"'::regtype
  ) THEN
    ALTER TYPE "NotificationType" ADD VALUE 'CONTRACT_OFFER_SENT';
  END IF;

  -- Add CONTRACT_ACCEPTED
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'CONTRACT_ACCEPTED' 
    AND enumtypid = '"NotificationType"'::regtype
  ) THEN
    ALTER TYPE "NotificationType" ADD VALUE 'CONTRACT_ACCEPTED';
  END IF;

  -- Add CONTRACT_DECLINED
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'CONTRACT_DECLINED' 
    AND enumtypid = '"NotificationType"'::regtype
  ) THEN
    ALTER TYPE "NotificationType" ADD VALUE 'CONTRACT_DECLINED';
  END IF;
END $$;

-- 6. Add accepted_at column to contracts
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS description TEXT;

-- 7. Grant execute permissions
GRANT EXECUTE ON FUNCTION send_contract_offer(UUID, UUID, UUID, UUID, DECIMAL, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_contract_offer(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decline_contract_offer(UUID, UUID, TEXT) TO authenticated;

-- 8. Update can_user_review to check for ACTIVE or COMPLETED contracts
CREATE OR REPLACE FUNCTION can_user_review(p_contract_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_contract RECORD;
BEGIN
  -- Get contract details
  SELECT c.*, j.parent_id, j.hired_tutor_id
  INTO v_contract
  FROM contracts c
  JOIN job_posts j ON c.job_post_id = j.id
  WHERE c.id = p_contract_id;

  -- Check if contract exists and is ACTIVE or COMPLETED
  IF v_contract IS NULL OR v_contract.status NOT IN ('ACTIVE', 'COMPLETED') THEN
    RETURN FALSE;
  END IF;

  -- Check if user is either the parent or tutor
  IF p_user_id != v_contract.parent_id AND p_user_id != v_contract.hired_tutor_id THEN
    RETURN FALSE;
  END IF;

  -- Check if user already reviewed
  IF EXISTS (
    SELECT 1 FROM reviews 
    WHERE contract_id = p_contract_id 
    AND reviewer_id = p_user_id
  ) THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
