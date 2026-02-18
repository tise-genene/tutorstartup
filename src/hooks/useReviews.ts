"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "../lib/supabase";
import type { 
  Review, 
  CreateReviewPayload, 
  UpdateReviewPayload,
  TutorReviewStats,
  ReviewBreakdown
} from "../lib/types";

export function useReviews(tutorId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async (limit = 50) => {
    if (!tutorId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          reviewer:reviewer_id(id, name, avatar_url, role),
          contract:contract_id(
            id,
            job_post:job_post_id(id, title)
          )
        `)
        .eq("reviewee_id", tutorId)
        .eq("status", "SUBMITTED")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      type SupabaseReviewRow = {
        id: string;
        contract_id: string;
        job_post_id: string;
        reviewer_id: string;
        reviewee_id: string;
        overall_rating: number;
        professionalism_rating: number;
        communication_rating: number;
        punctuality_rating: number;
        expertise_rating: number;
        title: string;
        content: string;
        would_recommend: boolean;
        status: string;
        is_public: boolean;
        helpful_count: number;
        reported_count: number;
        response_content: string | null;
        responded_at: string | null;
        created_at: string;
        updated_at: string;
        reviewer: {
          id: string;
          name: string;
          avatar_url: string | null;
          role: string;
        };
        contract: {
          id: string;
          job_post: {
            id: string;
            title: string;
          };
        };
      };

      const formattedReviews: Review[] = (data || []).map((r: SupabaseReviewRow) => ({
        id: r.id,
        contractId: r.contract_id,
        jobPostId: r.job_post_id,
        reviewerId: r.reviewer_id,
        revieweeId: r.reviewee_id,
        overallRating: r.overall_rating,
        professionalismRating: r.professionalism_rating,
        communicationRating: r.communication_rating,
        punctualityRating: r.punctuality_rating,
        expertiseRating: r.expertise_rating,
        title: r.title,
        content: r.content,
        wouldRecommend: r.would_recommend,
        status: r.status as import("../lib/types").ReviewStatus,
        isPublic: r.is_public,
        helpfulCount: r.helpful_count,
        reportedCount: r.reported_count,
        responseContent: r.response_content,
        respondedAt: r.responded_at,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        reviewer: r.reviewer,
        contract: r.contract,
      }));

      setReviews(formattedReviews);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [tutorId, supabase]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return {
    reviews,
    loading,
    error,
    fetchReviews,
  };
}

export function useReviewStats(tutorId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const [stats, setStats] = useState<TutorReviewStats | null>(null);
  const [breakdown, setBreakdown] = useState<ReviewBreakdown | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!tutorId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tutor_review_stats")
        .select("*")
        .eq("tutor_id", tutorId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        const statsData: TutorReviewStats = {
          tutorId: data.tutor_id,
          totalReviews: data.total_reviews,
          averageRating: data.average_rating,
          averageProfessionalism: data.average_professionalism,
          averageCommunication: data.average_communication,
          averagePunctuality: data.average_punctuality,
          averageExpertise: data.average_expertise,
          fiveStarCount: data.five_star_count,
          fourStarCount: data.four_star_count,
          threeStarCount: data.three_star_count,
          twoStarCount: data.two_star_count,
          oneStarCount: data.one_star_count,
          wouldRecommendCount: data.would_recommend_count,
          wouldRecommendPercentage: data.would_recommend_percentage,
          updatedAt: data.updated_at,
        };
        setStats(statsData);

        setBreakdown({
          fiveStar: data.five_star_count,
          fourStar: data.four_star_count,
          threeStar: data.three_star_count,
          twoStar: data.two_star_count,
          oneStar: data.one_star_count,
        });
      }
    } catch (e) {
      console.error("Error fetching review stats:", e);
    } finally {
      setLoading(false);
    }
  }, [tutorId, supabase]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    breakdown,
    loading,
    fetchStats,
  };
}

export function useContractReview(contractId: string | null, userId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [canReview, setCanReview] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkCanReview = useCallback(async () => {
    if (!contractId || !userId) return;

    try {
      const { data, error } = await supabase.rpc("can_user_review", {
        p_contract_id: contractId,
        p_user_id: userId,
      });

      if (error) throw error;
      setCanReview(data as boolean);
    } catch (e) {
      console.error("Error checking if can review:", e);
      setCanReview(false);
    }
  }, [contractId, userId, supabase]);

  const fetchExistingReview = useCallback(async () => {
    if (!contractId || !userId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          reviewer:reviewer_id(id, name, avatar_url, role),
          reviewee:reviewee_id(id, name, avatar_url, role)
        `)
        .eq("contract_id", contractId)
        .eq("reviewer_id", userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        const review: Review = {
          id: data.id,
          contractId: data.contract_id,
          jobPostId: data.job_post_id,
          reviewerId: data.reviewer_id,
          revieweeId: data.reviewee_id,
          overallRating: data.overall_rating,
          professionalismRating: data.professionalism_rating,
          communicationRating: data.communication_rating,
          punctualityRating: data.punctuality_rating,
          expertiseRating: data.expertise_rating,
          title: data.title,
          content: data.content,
          wouldRecommend: data.would_recommend,
          status: data.status,
          isPublic: data.is_public,
          helpfulCount: data.helpful_count,
          reportedCount: data.reported_count,
          responseContent: data.response_content,
          respondedAt: data.responded_at,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          reviewer: data.reviewer,
          reviewee: data.reviewee,
        };
        setExistingReview(review);
      }
    } catch (e) {
      console.error("Error fetching existing review:", e);
    } finally {
      setLoading(false);
    }
  }, [contractId, userId, supabase]);

  const createReview = useCallback(async (payload: CreateReviewPayload) => {
    if (!userId) return null;

    try {
      console.log("Creating review with payload:", payload);
      
      // First check if user can review
      const { data: canReviewData, error: canReviewError } = await supabase.rpc("can_user_review", {
        p_contract_id: payload.contractId,
        p_user_id: userId,
      });
      
      if (canReviewError) {
        console.error("can_user_review error:", canReviewError);
        throw new Error("Failed to verify review eligibility: " + canReviewError.message);
      }
      
      if (!canReviewData) {
        throw new Error("You are not eligible to review this contract. It must be completed and you must be a party to it.");
      }
      
      const { data, error } = await supabase
        .from("reviews")
        .insert({
          contract_id: payload.contractId,
          job_post_id: payload.jobPostId,
          reviewer_id: userId,
          reviewee_id: payload.revieweeId,
          overall_rating: payload.overallRating,
          professionalism_rating: payload.professionalismRating,
          communication_rating: payload.communicationRating,
          punctuality_rating: payload.punctualityRating,
          expertise_rating: payload.expertiseRating,
          title: payload.title,
          content: payload.content,
          would_recommend: payload.wouldRecommend,
        })
        .select(`
          *,
          reviewer:reviewer_id(id, name, avatar_url, role),
          reviewee:reviewee_id(id, name, avatar_url, role)
        `)
        .single();

      if (error) {
        console.error("Review insert error:", error);
        throw error;
      }

      const review: Review = {
        id: data.id,
        contractId: data.contract_id,
        jobPostId: data.job_post_id,
        reviewerId: data.reviewer_id,
        revieweeId: data.reviewee_id,
        overallRating: data.overall_rating,
        professionalismRating: data.professionalism_rating,
        communicationRating: data.communication_rating,
        punctualityRating: data.punctuality_rating,
        expertiseRating: data.expertise_rating,
        title: data.title,
        content: data.content,
        wouldRecommend: data.would_recommend,
        status: data.status,
        isPublic: data.is_public,
        helpfulCount: data.helpful_count,
        reportedCount: data.reported_count,
        responseContent: data.response_content,
        respondedAt: data.responded_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        reviewer: data.reviewer,
        reviewee: data.reviewee,
      };

      setExistingReview(review);
      setCanReview(false);
      return review;
    } catch (e) {
      console.error("Error creating review:", e);
      return null;
    }
  }, [userId, supabase]);

  const updateReview = useCallback(async (reviewId: string, payload: UpdateReviewPayload) => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .update({
          overall_rating: payload.overallRating,
          professionalism_rating: payload.professionalismRating,
          communication_rating: payload.communicationRating,
          punctuality_rating: payload.punctualityRating,
          expertise_rating: payload.expertiseRating,
          title: payload.title,
          content: payload.content,
          would_recommend: payload.wouldRecommend,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reviewId)
        .select(`
          *,
          reviewer:reviewer_id(id, name, avatar_url, role),
          reviewee:reviewee_id(id, name, avatar_url, role)
        `)
        .single();

      if (error) throw error;

      const review: Review = {
        id: data.id,
        contractId: data.contract_id,
        jobPostId: data.job_post_id,
        reviewerId: data.reviewer_id,
        revieweeId: data.reviewee_id,
        overallRating: data.overall_rating,
        professionalismRating: data.professionalism_rating,
        communicationRating: data.communication_rating,
        punctualityRating: data.punctuality_rating,
        expertiseRating: data.expertise_rating,
        title: data.title,
        content: data.content,
        wouldRecommend: data.would_recommend,
        status: data.status,
        isPublic: data.is_public,
        helpfulCount: data.helpful_count,
        reportedCount: data.reported_count,
        responseContent: data.response_content,
        respondedAt: data.responded_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        reviewer: data.reviewer,
        reviewee: data.reviewee,
      };

      setExistingReview(review);
      return review;
    } catch (e) {
      console.error("Error updating review:", e);
      return null;
    }
  }, [supabase]);

  const addResponse = useCallback(async (reviewId: string, response: string) => {
    if (!userId) return false;

    try {
      const { data, error } = await supabase.rpc("add_review_response", {
        p_review_id: reviewId,
        p_user_id: userId,
        p_response: response,
      });

      if (error) throw error;

      if (data) {
        await fetchExistingReview();
      }
      return data as boolean;
    } catch (e) {
      console.error("Error adding response:", e);
      return false;
    }
  }, [userId, supabase, fetchExistingReview]);

  useEffect(() => {
    checkCanReview();
    fetchExistingReview();
  }, [checkCanReview, fetchExistingReview]);

  return {
    existingReview,
    canReview,
    loading,
    createReview,
    updateReview,
    addResponse,
    refresh: fetchExistingReview,
  };
}

export function useReviewHelpful(reviewId: string | null) {
  const supabase = useMemo(() => createClient(), []);

  const markHelpful = useCallback(async (userId: string, isHelpful: boolean) => {
    if (!reviewId || !userId) return false;

    try {
      await supabase.rpc("mark_review_helpful", {
        p_review_id: reviewId,
        p_user_id: userId,
        p_is_helpful: isHelpful,
      });
      return true;
    } catch (e) {
      console.error("Error marking review helpful:", e);
      return false;
    }
  }, [reviewId, supabase]);

  return {
    markHelpful,
  };
}
