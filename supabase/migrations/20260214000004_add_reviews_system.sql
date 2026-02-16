-- Migration: Reviews & Ratings System
-- Created: 2026-02-14
-- Description: Adds review and rating tables for post-contract feedback

-- 1. Create review status enum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'SUBMITTED', 'EDITED', 'HIDDEN');

-- 2. Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  job_post_id UUID NOT NULL REFERENCES public.job_posts(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Rating (1-5 stars)
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  expertise_rating INTEGER CHECK (expertise_rating >= 1 AND expertise_rating <= 5),
  
  -- Review content
  title TEXT,
  content TEXT NOT NULL,
  would_recommend BOOLEAN,
  
  -- Metadata
  status "ReviewStatus" DEFAULT 'SUBMITTED',
  is_public BOOLEAN DEFAULT TRUE,
  helpful_count INTEGER DEFAULT 0,
  reported_count INTEGER DEFAULT 0,
  
  -- Response from reviewee (optional)
  response_content TEXT,
  responded_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Each user can only review once per contract
  UNIQUE(contract_id, reviewer_id)
);

-- 3. Create review helpfulness votes table (to track if reviews were helpful)
CREATE TABLE public.review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL, -- true = helpful, false = not helpful
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- 4. Create tutor review statistics materialized view (for performance)
CREATE TABLE public.tutor_review_stats (
  tutor_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_reviews INTEGER DEFAULT 0,
  average_rating DECIMAL(2,1) DEFAULT 0,
  average_professionalism DECIMAL(2,1) DEFAULT 0,
  average_communication DECIMAL(2,1) DEFAULT 0,
  average_punctuality DECIMAL(2,1) DEFAULT 0,
  average_expertise DECIMAL(2,1) DEFAULT 0,
  five_star_count INTEGER DEFAULT 0,
  four_star_count INTEGER DEFAULT 0,
  three_star_count INTEGER DEFAULT 0,
  two_star_count INTEGER DEFAULT 0,
  one_star_count INTEGER DEFAULT 0,
  would_recommend_count INTEGER DEFAULT 0,
  would_recommend_percentage DECIMAL(5,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create indexes for performance
CREATE INDEX idx_reviews_contract_id ON public.reviews(contract_id);
CREATE INDEX idx_reviews_job_post_id ON public.reviews(job_post_id);
CREATE INDEX idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewee_id ON public.reviews(reviewee_id);
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX idx_reviews_status ON public.reviews(status);
CREATE INDEX idx_reviews_overall_rating ON public.reviews(overall_rating);
CREATE INDEX idx_review_votes_review_id ON public.review_votes(review_id);
CREATE INDEX idx_review_votes_user_id ON public.review_votes(user_id);

-- 6. Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_review_stats ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for reviews

-- Anyone can view public reviews
CREATE POLICY "Public can view public reviews" 
  ON public.reviews FOR SELECT 
  USING (is_public = TRUE AND status = 'SUBMITTED');

-- Users can view their own reviews (even if not public)
CREATE POLICY "Users can view their own reviews" 
  ON public.reviews FOR SELECT 
  USING (reviewer_id = auth.uid() OR reviewee_id = auth.uid());

-- Only the reviewer can create a review
CREATE POLICY "Reviewers can create reviews" 
  ON public.reviews FOR INSERT 
  WITH CHECK (reviewer_id = auth.uid());

-- Only the reviewer can update their own review
CREATE POLICY "Reviewers can update their own reviews" 
  ON public.reviews FOR UPDATE 
  USING (reviewer_id = auth.uid());

-- Only the reviewer can delete their own review
CREATE POLICY "Reviewers can delete their own reviews" 
  ON public.reviews FOR DELETE 
  USING (reviewer_id = auth.uid());

-- 8. RLS Policies for review_votes

-- Users can view votes on reviews they can see
CREATE POLICY "Users can view review votes" 
  ON public.review_votes FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.reviews r 
    WHERE r.id = review_id 
    AND (r.is_public = TRUE OR r.reviewer_id = auth.uid() OR r.reviewee_id = auth.uid())
  ));

-- Users can vote on reviews
CREATE POLICY "Users can vote on reviews" 
  ON public.review_votes FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Users can change their vote
CREATE POLICY "Users can update their votes" 
  ON public.review_votes FOR UPDATE 
  USING (user_id = auth.uid());

-- Users can remove their vote
CREATE POLICY "Users can delete their votes" 
  ON public.review_votes FOR DELETE 
  USING (user_id = auth.uid());

-- 9. RLS Policies for tutor_review_stats

-- Anyone can view tutor stats
CREATE POLICY "Public can view tutor review stats" 
  ON public.tutor_review_stats FOR SELECT 
  USING (true);

-- 10. Function to update tutor review stats
CREATE OR REPLACE FUNCTION public.update_tutor_review_stats(p_tutor_id UUID)
RETURNS VOID AS $$
DECLARE
  v_stats RECORD;
BEGIN
  -- Calculate stats
  SELECT 
    COUNT(*) as total_reviews,
    ROUND(AVG(overall_rating), 1) as average_rating,
    ROUND(AVG(professionalism_rating), 1) as average_professionalism,
    ROUND(AVG(communication_rating), 1) as average_communication,
    ROUND(AVG(punctuality_rating), 1) as average_punctuality,
    ROUND(AVG(expertise_rating), 1) as average_expertise,
    COUNT(*) FILTER (WHERE overall_rating = 5) as five_star_count,
    COUNT(*) FILTER (WHERE overall_rating = 4) as four_star_count,
    COUNT(*) FILTER (WHERE overall_rating = 3) as three_star_count,
    COUNT(*) FILTER (WHERE overall_rating = 2) as two_star_count,
    COUNT(*) FILTER (WHERE overall_rating = 1) as one_star_count,
    COUNT(*) FILTER (WHERE would_recommend = TRUE) as would_recommend_count
  INTO v_stats
  FROM public.reviews
  WHERE reviewee_id = p_tutor_id
  AND status = 'SUBMITTED'
  AND is_public = TRUE;

  -- Insert or update stats
  INSERT INTO public.tutor_review_stats (
    tutor_id,
    total_reviews,
    average_rating,
    average_professionalism,
    average_communication,
    average_punctuality,
    average_expertise,
    five_star_count,
    four_star_count,
    three_star_count,
    two_star_count,
    one_star_count,
    would_recommend_count,
    would_recommend_percentage,
    updated_at
  ) VALUES (
    p_tutor_id,
    v_stats.total_reviews,
    v_stats.average_rating,
    v_stats.average_professionalism,
    v_stats.average_communication,
    v_stats.average_punctuality,
    v_stats.average_expertise,
    v_stats.five_star_count,
    v_stats.four_star_count,
    v_stats.three_star_count,
    v_stats.two_star_count,
    v_stats.one_star_count,
    v_stats.would_recommend_count,
    CASE 
      WHEN v_stats.total_reviews > 0 
      THEN ROUND((v_stats.would_recommend_count::DECIMAL / v_stats.total_reviews) * 100, 2)
      ELSE 0
    END,
    NOW()
  )
  ON CONFLICT (tutor_id) DO UPDATE SET
    total_reviews = EXCLUDED.total_reviews,
    average_rating = EXCLUDED.average_rating,
    average_professionalism = EXCLUDED.average_professionalism,
    average_communication = EXCLUDED.average_communication,
    average_punctuality = EXCLUDED.average_punctuality,
    average_expertise = EXCLUDED.average_expertise,
    five_star_count = EXCLUDED.five_star_count,
    four_star_count = EXCLUDED.four_star_count,
    three_star_count = EXCLUDED.three_star_count,
    two_star_count = EXCLUDED.two_star_count,
    one_star_count = EXCLUDED.one_star_count,
    would_recommend_count = EXCLUDED.would_recommend_count,
    would_recommend_percentage = EXCLUDED.would_recommend_percentage,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_tutor_review_stats(UUID) TO authenticated;

-- 11. Trigger to update stats when a review is created
CREATE OR REPLACE FUNCTION public.on_review_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.update_tutor_review_stats(NEW.reviewee_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_created_trigger
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE PROCEDURE public.on_review_created();

-- 12. Trigger to update stats when a review is updated
CREATE OR REPLACE FUNCTION public.on_review_updated()
RETURNS TRIGGER AS $$
BEGIN
  -- Update old reviewee stats if reviewee changed
  IF OLD.reviewee_id != NEW.reviewee_id THEN
    PERFORM public.update_tutor_review_stats(OLD.reviewee_id);
  END IF;
  -- Update new reviewee stats
  PERFORM public.update_tutor_review_stats(NEW.reviewee_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_updated_trigger
  AFTER UPDATE ON public.reviews
  FOR EACH ROW EXECUTE PROCEDURE public.on_review_updated();

-- 13. Trigger to update stats when a review is deleted
CREATE OR REPLACE FUNCTION public.on_review_deleted()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.update_tutor_review_stats(OLD.reviewee_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_deleted_trigger
  AFTER DELETE ON public.reviews
  FOR EACH ROW EXECUTE PROCEDURE public.on_review_deleted();

-- 14. Function to check if user can review (must have completed contract)
CREATE OR REPLACE FUNCTION public.can_user_review(p_contract_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_contract RECORD;
BEGIN
  -- Get contract details
  SELECT c.*, j.parent_id, j.hired_tutor_id
  INTO v_contract
  FROM public.contracts c
  JOIN public.job_posts j ON c.job_post_id = j.id
  WHERE c.id = p_contract_id;

  -- Check if contract exists and is completed
  IF v_contract IS NULL OR v_contract.status != 'COMPLETED' THEN
    RETURN FALSE;
  END IF;

  -- Check if user is either the parent or tutor
  IF p_user_id != v_contract.parent_id AND p_user_id != v_contract.hired_tutor_id THEN
    RETURN FALSE;
  END IF;

  -- Check if user already reviewed
  IF EXISTS (
    SELECT 1 FROM public.reviews 
    WHERE contract_id = p_contract_id 
    AND reviewer_id = p_user_id
  ) THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.can_user_review(UUID, UUID) TO authenticated;

-- 15. Function to mark review as helpful
CREATE OR REPLACE FUNCTION public.mark_review_helpful(p_review_id UUID, p_user_id UUID, p_is_helpful BOOLEAN)
RETURNS VOID AS $$
DECLARE
  v_old_vote BOOLEAN;
BEGIN
  -- Check if user already voted
  SELECT is_helpful INTO v_old_vote
  FROM public.review_votes
  WHERE review_id = p_review_id AND user_id = p_user_id;

  IF v_old_vote IS NULL THEN
    -- New vote
    INSERT INTO public.review_votes (review_id, user_id, is_helpful)
    VALUES (p_review_id, p_user_id, p_is_helpful);
    
    -- Update helpful count
    IF p_is_helpful THEN
      UPDATE public.reviews SET helpful_count = helpful_count + 1 WHERE id = p_review_id;
    END IF;
  ELSIF v_old_vote != p_is_helpful THEN
    -- Changed vote
    UPDATE public.review_votes 
    SET is_helpful = p_is_helpful 
    WHERE review_id = p_review_id AND user_id = p_user_id;
    
    -- Update helpful count
    IF p_is_helpful THEN
      UPDATE public.reviews SET helpful_count = helpful_count + 1 WHERE id = p_review_id;
    ELSE
      UPDATE public.reviews SET helpful_count = helpful_count - 1 WHERE id = p_review_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.mark_review_helpful(UUID, UUID, BOOLEAN) TO authenticated;

-- 16. Function to add reviewee response
CREATE OR REPLACE FUNCTION public.add_review_response(p_review_id UUID, p_user_id UUID, p_response TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is the reviewee
  IF NOT EXISTS (
    SELECT 1 FROM public.reviews 
    WHERE id = p_review_id 
    AND reviewee_id = p_user_id
  ) THEN
    RETURN FALSE;
  END IF;

  UPDATE public.reviews 
  SET response_content = p_response,
      responded_at = NOW(),
      updated_at = NOW()
  WHERE id = p_review_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.add_review_response(UUID, UUID, TEXT) TO authenticated;
