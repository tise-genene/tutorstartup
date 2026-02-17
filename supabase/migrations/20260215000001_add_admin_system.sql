-- Admin Dashboard System
-- Creates tables, views, and functions for admin management

-- 1. Add is_admin column to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 2. Create admin activity log
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL, -- 'user', 'job', 'proposal', 'review', 'contract', 'message'
  target_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for activity log queries
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_target ON admin_activity_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at DESC);

-- 3. Create content moderation queue
CREATE TABLE IF NOT EXISTS moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL, -- 'profile', 'job', 'proposal', 'message', 'review'
  content_id UUID NOT NULL,
  content_preview TEXT,
  reported_by UUID REFERENCES profiles(id),
  report_reason TEXT,
  status TEXT DEFAULT 'pending'::TEXT, -- 'pending', 'approved', 'rejected', 'escalated'
  moderator_id UUID REFERENCES profiles(id),
  moderation_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  moderated_at TIMESTAMP WITH TIME ZONE,
  priority INTEGER DEFAULT 0 -- 0=normal, 1=high, 2=urgent
);

CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_priority ON moderation_queue(priority DESC, created_at);

-- 4. Create admin analytics view
CREATE OR REPLACE VIEW admin_analytics_summary AS
SELECT
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM profiles WHERE role = 'TUTOR') as total_tutors,
  (SELECT COUNT(*) FROM profiles WHERE role = 'PARENT') as total_clients,
  (SELECT COUNT(*) FROM profiles WHERE created_at > NOW() - INTERVAL '30 days') as new_users_30d,
  (SELECT COUNT(*) FROM job_posts) as total_jobs,
  (SELECT COUNT(*) FROM job_posts WHERE status = 'OPEN') as open_jobs,
  (SELECT COUNT(*) FROM proposals) as total_proposals,
  (SELECT COUNT(*) FROM contracts WHERE status = 'ACTIVE') as active_contracts,
  (SELECT COUNT(*) FROM contracts WHERE status = 'COMPLETED') as completed_contracts,
  (SELECT COUNT(*) FROM reviews) as total_reviews,
  (SELECT COUNT(*) FROM messages WHERE created_at > NOW() - INTERVAL '24 hours') as messages_24h,
  (SELECT COUNT(*) FROM moderation_queue WHERE status = 'pending') as pending_moderation,
   (SELECT COUNT(*) FROM email_notifications WHERE status = 'FAILED') as failed_emails,
  NOW() as calculated_at;

-- 5. Create admin user management view
CREATE OR REPLACE VIEW admin_user_list AS
SELECT
  p.id,
  p.name,
  p.email,
  p.role,
  tp.location,
  p.is_verified,
  p.is_admin,
  p.created_at,
   (SELECT COUNT(*) FROM job_posts WHERE parent_id = p.id) as jobs_posted,
  (SELECT COUNT(*) FROM contracts c 
   JOIN proposals prop ON c.proposal_id = prop.id 
   JOIN tutor_profiles tp ON prop.tutor_id = tp.id 
   WHERE tp.user_id = p.id) as contracts_as_tutor,
   (SELECT COUNT(*) FROM contracts c 
   JOIN proposals prop ON c.proposal_id = prop.id 
   JOIN job_posts jp ON prop.job_post_id = jp.id 
   WHERE jp.parent_id = p.id) as contracts_as_client,
  (SELECT COUNT(*) FROM reviews WHERE reviewer_id = p.id) as reviews_given,
   (SELECT COUNT(*) FROM reviews r 
   JOIN contracts c ON r.contract_id = c.id 
   JOIN proposals p2 ON c.proposal_id = p2.id 
   JOIN tutor_profiles tp2 ON p2.tutor_id = tp2.id 
   WHERE tp2.user_id = p.id) as reviews_received
FROM profiles p
LEFT JOIN tutor_profiles tp ON tp.user_id = p.id;

-- 6. Create function to suspend/unsuspend user
CREATE OR REPLACE FUNCTION admin_suspend_user(target_user_id UUID, admin_id UUID, reason TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Log the action
  INSERT INTO admin_activity_log (admin_id, action_type, target_type, target_id, details)
  VALUES (admin_id, 'suspend_user', 'user', target_user_id, jsonb_build_object('reason', reason));
  
  -- Update user status (you'd need to add a 'status' column to profiles)
  -- For now, we'll just log it
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to resolve moderation item
CREATE OR REPLACE FUNCTION resolve_moderation(
  moderation_id UUID,
  admin_id UUID,
  resolution TEXT, -- 'approved', 'rejected', 'escalated'
  notes TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE moderation_queue
  SET 
    status = resolution::TEXT,
    moderator_id = admin_id,
    moderation_notes = notes,
    moderated_at = NOW()
  WHERE id = moderation_id;
  
  -- Log the action
  INSERT INTO admin_activity_log (admin_id, action_type, target_type, target_id, details)
  VALUES (
    admin_id, 
    'moderate_content', 
    (SELECT content_type FROM moderation_queue WHERE id = moderation_id),
    (SELECT content_id FROM moderation_queue WHERE id = moderation_id),
    jsonb_build_object('resolution', resolution, 'notes', notes)
  );
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. RLS Policies for admin tables
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can read activity log"
ON admin_activity_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  )
);

CREATE POLICY "Only admins can insert activity log"
ON admin_activity_log
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  )
);

CREATE POLICY "Only admins can read moderation queue"
ON moderation_queue
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  )
);

CREATE POLICY "Users can see their own reports"
ON moderation_queue
FOR SELECT
TO authenticated
USING (reported_by = auth.uid());

CREATE POLICY "Users can create reports"
ON moderation_queue
FOR INSERT
TO authenticated
WITH CHECK (reported_by = auth.uid());

CREATE POLICY "Only admins can update moderation queue"
ON moderation_queue
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  )
);

-- 9. Trigger to auto-create moderation entry for reported content
CREATE OR REPLACE FUNCTION auto_create_moderation_entry()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO moderation_queue (content_type, content_id, content_preview, reported_by, report_reason)
  VALUES (
    TG_TABLE_NAME,
    NEW.id,
    LEFT(COALESCE(NEW.message, NEW.bio, NEW.description, ''), 200),
    auth.uid(),
    'Auto-flagged: Potential policy violation'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Seed first admin user (replace with actual admin email)
-- Uncomment and modify when ready:
-- UPDATE profiles 
-- SET is_admin = true 
-- WHERE email = 'admin@example.com';
