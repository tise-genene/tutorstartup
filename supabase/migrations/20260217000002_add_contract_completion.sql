-- Contract Completion System
-- Adds functionality to complete contracts and enable reviews

-- 1. Add completed_at, completed_by, and completion_reason columns to contracts if not exists
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS completion_reason TEXT;

-- 2. Create function to complete a contract
CREATE OR REPLACE FUNCTION complete_contract(
  p_contract_id UUID,
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_contract RECORD;
  v_other_party_id UUID;
BEGIN
  -- Get contract details
  SELECT c.*, j.parent_id, j.hired_tutor_id
  INTO v_contract
  FROM contracts c
  JOIN job_posts j ON c.job_post_id = j.id
  WHERE c.id = p_contract_id;

  -- Check if contract exists and is active
  IF v_contract IS NULL THEN
    RAISE EXCEPTION 'Contract not found';
  END IF;

  IF v_contract.status != 'ACTIVE' THEN
    RAISE EXCEPTION 'Contract must be ACTIVE to complete';
  END IF;

  -- Check if user is part of the contract
  IF p_user_id != v_contract.parent_id AND p_user_id != v_contract.hired_tutor_id THEN
    RAISE EXCEPTION 'Only contract parties can complete the contract';
  END IF;

  -- Determine other party for notification
  IF p_user_id = v_contract.parent_id THEN
    v_other_party_id := v_contract.hired_tutor_id;
  ELSE
    v_other_party_id := v_contract.parent_id;
  END IF;

  -- Update contract status
  UPDATE contracts
  SET 
    status = 'COMPLETED',
    completion_reason = p_reason,
    completed_at = NOW(),
    completed_by = p_user_id,
    updated_at = NOW()
  WHERE id = p_contract_id;

  -- Notify other party
  PERFORM queue_notification(
    v_other_party_id,
    'CONTRACT_COMPLETED'::"NotificationType",
    'Contract completed',
    '<p>The contract has been marked as completed.</p><p>You can now leave a review.</p>',
    'Contract completed. Leave a review now!',
    jsonb_build_object('contract_id', p_contract_id, 'completed_by', p_user_id)
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger to auto-complete job when contract is completed
CREATE OR REPLACE FUNCTION on_contract_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
    -- Update job post status to closed if it was open
    UPDATE job_posts
    SET 
      status = 'CLOSED',
      closed_at = NOW(),
      updated_at = NOW()
    WHERE id = NEW.job_post_id
    AND status = 'OPEN';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_contract_completed_trigger ON contracts;

-- Create trigger
CREATE TRIGGER on_contract_completed_trigger
  AFTER UPDATE ON contracts
  FOR EACH ROW
  WHEN (NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED')
  EXECUTE PROCEDURE on_contract_completed();

-- 4. Fix: Update hired_tutor_id when contract is created (in on_accept in UI)
-- This is handled in the UI, but let's create a function to ensure consistency
CREATE OR REPLACE FUNCTION update_job_hired_tutor(
  p_job_post_id UUID,
  p_tutor_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE job_posts
  SET 
    hired_tutor_id = p_tutor_id,
    hired_at = NOW(),
    updated_at = NOW()
  WHERE id = p_job_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION complete_contract(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_job_hired_tutor(UUID, UUID) TO authenticated;

-- 5. Add CONTRACT_COMPLETED to NotificationType enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'CONTRACT_COMPLETED' 
    AND enumtypid = '"NotificationType"'::regtype
  ) THEN
    ALTER TYPE "NotificationType" ADD VALUE 'CONTRACT_COMPLETED';
  END IF;
END $$;
