-- Create contract_messages table for contract chat/messaging
-- Created: 2026-02-18

CREATE TABLE IF NOT EXISTS public.contract_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  attachment_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contract_messages_contract_id ON contract_messages(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_messages_sender_id ON contract_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_contract_messages_created_at ON contract_messages(created_at DESC);

-- Enable RLS
ALTER TABLE contract_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view messages for their contracts"
ON contract_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM contracts c
    WHERE c.id = contract_id
    AND (c.parent_id = auth.uid() OR c.tutor_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages to their contracts"
ON contract_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM contracts c
    WHERE c.id = contract_id
    AND (c.parent_id = auth.uid() OR c.tutor_id = auth.uid())
  )
);

CREATE POLICY "Users can update read status"
ON contract_messages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM contracts c
    WHERE c.id = contract_id
    AND (c.parent_id = auth.uid() OR c.tutor_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM contracts c
    WHERE c.id = contract_id
    AND (c.parent_id = auth.uid() OR c.tutor_id = auth.uid())
  )
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_contract_message_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_contract_message_timestamp ON contract_messages;
CREATE TRIGGER update_contract_message_timestamp
  BEFORE UPDATE ON contract_messages
  FOR EACH ROW
  EXECUTE PROCEDURE update_contract_message_timestamp();
