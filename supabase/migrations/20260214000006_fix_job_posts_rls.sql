-- Migration: Fix job_posts RLS policies
-- Created: 2026-02-14
-- Description: Adds RLS policies for job_posts table

-- Enable RLS on job_posts if not already enabled
ALTER TABLE public.job_posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Job posts are viewable by owner" ON public.job_posts;
DROP POLICY IF EXISTS "Job posts are viewable by everyone when open" ON public.job_posts;
DROP POLICY IF EXISTS "Users can create their own job posts" ON public.job_posts;
DROP POLICY IF EXISTS "Users can update their own job posts" ON public.job_posts;
DROP POLICY IF EXISTS "Users can delete their own job posts" ON public.job_posts;

-- Policy: Users can view their own job posts
CREATE POLICY "Job posts are viewable by owner" 
  ON public.job_posts FOR SELECT 
  USING (parent_id = auth.uid());

-- Policy: Everyone can view OPEN job posts (for tutors to browse)
CREATE POLICY "Job posts are viewable by everyone when open" 
  ON public.job_posts FOR SELECT 
  USING (status = 'OPEN');

-- Policy: Users can create their own job posts
CREATE POLICY "Users can create their own job posts" 
  ON public.job_posts FOR INSERT 
  WITH CHECK (parent_id = auth.uid());

-- Policy: Users can update their own job posts
CREATE POLICY "Users can update their own job posts" 
  ON public.job_posts FOR UPDATE 
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

-- Policy: Users can delete their own job posts
CREATE POLICY "Users can delete their own job posts" 
  ON public.job_posts FOR DELETE 
  USING (parent_id = auth.uid());
