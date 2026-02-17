-- Migration: Complete RLS Policy Fix
-- Created: 2026-02-14
-- Description: Fixes ALL missing RLS policies across the entire database

-- ============================================
-- PROFILES TABLE
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- View: Everyone can see profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

-- Insert: Users can create their own profile
CREATE POLICY "Users can create their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Update: Users can only update their own
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- TUTOR_PROFILES TABLE
-- ============================================
ALTER TABLE public.tutor_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tutor profiles are viewable by everyone" ON public.tutor_profiles;
DROP POLICY IF EXISTS "Tutors can create their own profile" ON public.tutor_profiles;
DROP POLICY IF EXISTS "Tutors can update own profile" ON public.tutor_profiles;

-- View: Everyone can see tutor profiles
CREATE POLICY "Tutor profiles are viewable by everyone"
  ON public.tutor_profiles FOR SELECT USING (true);

-- Insert: Users can only create their own tutor profile
CREATE POLICY "Tutors can create their own profile"
  ON public.tutor_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Update: Users can only update their own tutor profile
CREATE POLICY "Tutors can update own profile"
  ON public.tutor_profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- JOB_POSTS TABLE
-- ============================================
ALTER TABLE public.job_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Job posts are viewable by owner" ON public.job_posts;
DROP POLICY IF EXISTS "Job posts are viewable by everyone when open" ON public.job_posts;
DROP POLICY IF EXISTS "Users can create their own job posts" ON public.job_posts;
DROP POLICY IF EXISTS "Users can update their own job posts" ON public.job_posts;
DROP POLICY IF EXISTS "Users can delete their own job posts" ON public.job_posts;

-- View: Users can see their own posts
CREATE POLICY "Job posts are viewable by owner"
  ON public.job_posts FOR SELECT
  USING (parent_id = auth.uid());

-- View: Everyone can see OPEN posts (for browsing)
CREATE POLICY "Job posts are viewable by everyone when open"
  ON public.job_posts FOR SELECT
  USING (status = 'OPEN');

-- Insert: Users can create their own posts
CREATE POLICY "Users can create their own job posts"
  ON public.job_posts FOR INSERT
  WITH CHECK (parent_id = auth.uid());

-- Update: Users can only update their own posts
CREATE POLICY "Users can update their own job posts"
  ON public.job_posts FOR UPDATE
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

-- Delete: Users can only delete their own posts
CREATE POLICY "Users can delete their own job posts"
  ON public.job_posts FOR DELETE
  USING (parent_id = auth.uid());

-- ============================================
-- PROPOSALS TABLE
-- ============================================
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Proposals are viewable by involved parties" ON public.proposals;
DROP POLICY IF EXISTS "Tutors can create proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can update their own proposals" ON public.proposals;

-- View: Only job owner and proposal submitter can see
CREATE POLICY "Proposals are viewable by involved parties"
  ON public.proposals FOR SELECT
  USING (
    tutor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.job_posts jp
      WHERE jp.id = job_post_id AND jp.parent_id = auth.uid()
    )
  );

-- Insert: Tutors can create proposals
CREATE POLICY "Tutors can create proposals"
  ON public.proposals FOR INSERT
  WITH CHECK (tutor_id = auth.uid());

-- Update: Only involved parties can update
CREATE POLICY "Users can update their own proposals"
  ON public.proposals FOR UPDATE
  USING (
    tutor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.job_posts jp
      WHERE jp.id = job_post_id AND jp.parent_id = auth.uid()
    )
  )
  WITH CHECK (
    tutor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.job_posts jp
      WHERE jp.id = job_post_id AND jp.parent_id = auth.uid()
    )
  );

-- ============================================
-- CONTRACTS TABLE
-- ============================================
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Contracts are viewable by involved parties" ON public.contracts;
DROP POLICY IF EXISTS "Users can create contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can update their own contracts" ON public.contracts;

-- View: Only parent and tutor can see
CREATE POLICY "Contracts are viewable by involved parties"
  ON public.contracts FOR SELECT
  USING (parent_id = auth.uid() OR tutor_id = auth.uid());

-- Insert: Allow (enforced by application logic)
CREATE POLICY "Users can create contracts"
  ON public.contracts FOR INSERT
  WITH CHECK (parent_id = auth.uid());

-- Update: Only involved parties
CREATE POLICY "Users can update their own contracts"
  ON public.contracts FOR UPDATE
  USING (parent_id = auth.uid() OR tutor_id = auth.uid())
  WITH CHECK (parent_id = auth.uid() OR tutor_id = auth.uid());

-- ============================================
-- SCHEDULED_SESSIONS TABLE
-- ============================================
ALTER TABLE public.scheduled_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sessions are viewable by contract parties" ON public.scheduled_sessions;
DROP POLICY IF EXISTS "Users can create sessions" ON public.scheduled_sessions;
DROP POLICY IF EXISTS "Users can update sessions" ON public.scheduled_sessions;

-- View: Only contract parties can see
CREATE POLICY "Sessions are viewable by contract parties"
  ON public.scheduled_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.id = contract_id
      AND (c.parent_id = auth.uid() OR c.tutor_id = auth.uid())
    )
  );

-- Insert: Contract parties can create
CREATE POLICY "Users can create sessions"
  ON public.scheduled_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.id = contract_id
      AND (c.parent_id = auth.uid() OR c.tutor_id = auth.uid())
    )
  );

-- Update: Contract parties can update
CREATE POLICY "Users can update sessions"
  ON public.scheduled_sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.id = contract_id
      AND (c.parent_id = auth.uid() OR c.tutor_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.id = contract_id
      AND (c.parent_id = auth.uid() OR c.tutor_id = auth.uid())
    )
  );

-- ============================================
-- REVIEWS TABLE
-- ============================================
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
DROP POLICY IF EXISTS "Users can view their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Reviewees can respond to reviews" ON public.reviews;

-- View: Public can see reviews
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  USING (is_public = true AND status = 'SUBMITTED');

-- View: Reviewer/reviewee can see their own
CREATE POLICY "Users can view their own reviews"
  ON public.reviews FOR SELECT
  USING (reviewer_id = auth.uid() OR reviewee_id = auth.uid());

-- Insert: Users can create reviews
CREATE POLICY "Users can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (reviewer_id = auth.uid());

-- Update: Reviewers can update their own
CREATE POLICY "Users can update their own reviews"
  ON public.reviews FOR UPDATE
  USING (reviewer_id = auth.uid())
  WITH CHECK (reviewer_id = auth.uid());

-- ============================================
-- INTERVIEWS TABLE
-- ============================================
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Interviews are viewable by involved parties" ON public.interviews;
DROP POLICY IF EXISTS "Users can create interviews" ON public.interviews;
DROP POLICY IF EXISTS "Users can update interviews" ON public.interviews;

-- View: Only parent and tutor can see
CREATE POLICY "Interviews are viewable by involved parties"
  ON public.interviews FOR SELECT
  USING (parent_id = auth.uid() OR tutor_id = auth.uid());

-- Insert: Clients can create
CREATE POLICY "Users can create interviews"
  ON public.interviews FOR INSERT
  WITH CHECK (parent_id = auth.uid());

-- Update: Involved parties can update
CREATE POLICY "Users can update interviews"
  ON public.interviews FOR UPDATE
  USING (parent_id = auth.uid() OR tutor_id = auth.uid())
  WITH CHECK (parent_id = auth.uid() OR tutor_id = auth.uid());

-- ============================================
-- CONVERSATIONS & MESSAGES TABLES
-- ============================================
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Conversations
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

CREATE POLICY "Users can view their conversations"
  ON public.conversations FOR SELECT
  USING (parent_id = auth.uid() OR tutor_id = auth.uid());

CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (parent_id = auth.uid() OR tutor_id = auth.uid());

-- Messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.parent_id = auth.uid() OR c.tutor_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- ============================================
-- EMAIL NOTIFICATIONS TABLE
-- ============================================
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.email_notifications;

CREATE POLICY "Users can view their own notifications"
  ON public.email_notifications FOR SELECT
  USING (user_id = auth.uid());

-- ============================================
-- NOTIFICATION PREFERENCES TABLE
-- ============================================
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can update their preferences" ON public.notification_preferences;

CREATE POLICY "Users can view their preferences"
  ON public.notification_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their preferences"
  ON public.notification_preferences FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- LESSON REQUESTS TABLE
-- ============================================
ALTER TABLE public.lesson_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their lesson requests" ON public.lesson_requests;
DROP POLICY IF EXISTS "Users can create lesson requests" ON public.lesson_requests;
DROP POLICY IF EXISTS "Tutors can update lesson requests" ON public.lesson_requests;

CREATE POLICY "Users can view their lesson requests"
  ON public.lesson_requests FOR SELECT
  USING (tutor_id = auth.uid() OR requester_id = auth.uid());

CREATE POLICY "Users can create lesson requests"
  ON public.lesson_requests FOR INSERT
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Tutors can update lesson requests"
  ON public.lesson_requests FOR UPDATE
  USING (tutor_id = auth.uid() OR requester_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid() OR requester_id = auth.uid());

-- ============================================
-- TUTOR_AVAILABILITY TABLE
-- ============================================
ALTER TABLE public.tutor_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view tutor availability" ON public.tutor_availability;
DROP POLICY IF EXISTS "Tutors can manage their availability" ON public.tutor_availability;

CREATE POLICY "Public can view tutor availability"
  ON public.tutor_availability FOR SELECT
  USING (true);

CREATE POLICY "Tutors can manage their availability"
  ON public.tutor_availability FOR ALL
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

-- ============================================
-- CONTRACT_MILESTONES TABLE
-- ============================================
ALTER TABLE public.contract_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Milestones are viewable by contract parties" ON public.contract_milestones;

CREATE POLICY "Milestones are viewable by contract parties"
  ON public.contract_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.id = contract_id
      AND (c.parent_id = auth.uid() OR c.tutor_id = auth.uid())
    )
  );

-- ============================================
-- REVIEW_VOTES TABLE
-- ============================================
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view review votes" ON public.review_votes;
DROP POLICY IF EXISTS "Users can vote on reviews" ON public.review_votes;

CREATE POLICY "Users can view review votes"
  ON public.review_votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.id = review_id
      AND (r.is_public = true OR r.reviewer_id = auth.uid() OR r.reviewee_id = auth.uid())
    )
  );

CREATE POLICY "Users can vote on reviews"
  ON public.review_votes FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- TUTOR_REVIEW_STATS TABLE
-- ============================================
ALTER TABLE public.tutor_review_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view tutor review stats" ON public.tutor_review_stats;

CREATE POLICY "Public can view tutor review stats"
  ON public.tutor_review_stats FOR SELECT
  USING (true);
