"use client";

import { useState } from "react";
import { useContractReview } from "../../hooks/useReviews";
import { useAuth } from "../../app/providers";
import type { Review, CreateReviewPayload } from "../../lib/types";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
  jobPostId: string;
  tutorId: string;
  tutorName: string;
  existingReview?: Review | null;
  onSuccess?: (review: Review) => void;
}

function StarRating({ 
  rating, 
  onChange, 
  label, 
  size = "md" 
}: { 
  rating: number; 
  onChange?: (rating: number) => void; 
  label?: string;
  size?: "sm" | "md" | "lg";
}) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <div className="space-y-1">
      {label && <label className="text-sm font-medium text-[var(--foreground)]/70">{label}</label>}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            disabled={!onChange}
            className={`${sizeClasses[size]} transition-colors ${
              star <= (hoverRating || rating) 
                ? "text-yellow-500" 
                : "text-[var(--foreground)]/20"
            } ${onChange ? "cursor-pointer" : "cursor-default"}`}
          >
            ★
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm text-[var(--foreground)]/60">
            {rating}/5
          </span>
        )}
      </div>
    </div>
  );
}

export function ReviewModal({
  isOpen,
  onClose,
  contractId,
  jobPostId,
  tutorId,
  tutorName,
  existingReview,
  onSuccess,
}: ReviewModalProps) {
  const { auth } = useAuth();
  const { createReview, updateReview } = useContractReview(contractId, auth?.user.id || null);
  
  const [overallRating, setOverallRating] = useState(existingReview?.overallRating || 0);
  const [professionalismRating, setProfessionalismRating] = useState(existingReview?.professionalismRating || 0);
  const [communicationRating, setCommunicationRating] = useState(existingReview?.communicationRating || 0);
  const [punctualityRating, setPunctualityRating] = useState(existingReview?.punctualityRating || 0);
  const [expertiseRating, setExpertiseRating] = useState(existingReview?.expertiseRating || 0);
  const [title, setTitle] = useState(existingReview?.title || "");
  const [content, setContent] = useState(existingReview?.content || "");
  const [wouldRecommend, setWouldRecommend] = useState(existingReview?.wouldRecommend ?? true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (overallRating === 0) {
      setError("Please provide an overall rating");
      return;
    }

    if (content.trim().length < 10) {
      setError("Please write at least 10 characters in your review");
      return;
    }

    setIsLoading(true);
    setError(null);

    const payload: CreateReviewPayload = {
      contractId,
      jobPostId,
      revieweeId: tutorId,
      overallRating,
      professionalismRating: professionalismRating || undefined,
      communicationRating: communicationRating || undefined,
      punctualityRating: punctualityRating || undefined,
      expertiseRating: expertiseRating || undefined,
      title: title.trim() || undefined,
      content: content.trim(),
      wouldRecommend,
    };

    let result;
    if (existingReview) {
      result = await updateReview(existingReview.id, payload);
    } else {
      result = await createReview(payload);
    }

    if (result) {
      onSuccess?.(result);
      onClose();
    } else {
      setError("Failed to submit review. The contract may not be eligible for review yet.");
    }

    setIsLoading(false);
  };

  const getRatingLabel = (rating: number) => {
    if (rating === 0) return "";
    if (rating === 1) return "Poor";
    if (rating === 2) return "Fair";
    if (rating === 3) return "Good";
    if (rating === 4) return "Very Good";
    return "Excellent";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">
                {existingReview ? "Edit Your Review" : "Write a Review"}
              </h2>
              <p className="text-sm text-[var(--foreground)]/60 mt-1">
                How was your experience with {tutorName}?
              </p>
            </div>
            <button
              onClick={onClose}
              className="ui-btn ui-btn-ghost p-2"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Overall Rating */}
            <div className="p-4 bg-[var(--muted)]/30 rounded-xl">
              <StarRating
                label={`Overall Rating ${getRatingLabel(overallRating) ? `- ${getRatingLabel(overallRating)}` : ""}`}
                rating={overallRating}
                onChange={setOverallRating}
                size="lg"
              />
            </div>

            {/* Detailed Ratings */}
            <div className="grid grid-cols-2 gap-4">
              <StarRating
                label="Professionalism"
                rating={professionalismRating}
                onChange={setProfessionalismRating}
              />
              <StarRating
                label="Communication"
                rating={communicationRating}
                onChange={setCommunicationRating}
              />
              <StarRating
                label="Punctuality"
                rating={punctualityRating}
                onChange={setPunctualityRating}
              />
              <StarRating
                label="Expertise"
                rating={expertiseRating}
                onChange={setExpertiseRating}
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Review Title (optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summarize your experience"
                className="w-full border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--input)] text-sm"
                maxLength={100}
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Your Review *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share details about your experience. What went well? What could be improved?"
                className="w-full min-h-[120px] border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--input)] text-sm resize-none"
                required
                minLength={10}
                maxLength={2000}
              />
              <p className="text-xs text-[var(--foreground)]/40 mt-1 text-right">
                {content.length}/2000
              </p>
            </div>

            {/* Would Recommend */}
            <div className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg">
              <span className="text-sm font-medium">Would you recommend this tutor?</span>
              <button
                type="button"
                onClick={() => setWouldRecommend(!wouldRecommend)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  wouldRecommend ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span className={`block w-5 h-5 bg-white rounded-full transition-transform ${
                  wouldRecommend ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="ui-btn ui-btn-ghost"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ui-btn ui-btn-primary"
                disabled={overallRating === 0 || content.trim().length < 10 || isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Submitting...
                  </span>
                ) : existingReview ? (
                  "Update Review"
                ) : (
                  "Submit Review"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

interface ReviewCardProps {
  review: Review;
  showResponse?: boolean;
  onHelpful?: (isHelpful: boolean) => void;
  isOwner?: boolean;
  onEdit?: () => void;
}

export function ReviewCard({ review, showResponse = true, onHelpful, isOwner, onEdit }: ReviewCardProps) {
  const [showFullContent, setShowFullContent] = useState(false);
  const isLongContent = review.content.length > 300;
  const displayContent = showFullContent || !isLongContent 
    ? review.content 
    : review.content.slice(0, 300) + "...";

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="rounded-xl border border-[var(--border)] p-5 bg-[var(--card)]">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-lg font-semibold text-[var(--accent)]">
            {review.reviewer?.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <p className="font-semibold">{review.reviewer?.name || "Anonymous"}</p>
            <p className="text-xs text-[var(--foreground)]/60">
              {formatDate(review.createdAt)}
              {review.contract?.jobPost && (
                <span className="ml-2">• {review.contract.jobPost.title}</span>
              )}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1">
            <span className="text-2xl font-bold text-yellow-500">{review.overallRating}</span>
            <span className="text-yellow-500 text-lg">★</span>
          </div>
          <p className="text-xs text-[var(--foreground)]/60">out of 5</p>
        </div>
      </div>

      {/* Title */}
      {review.title && (
        <h4 className="font-semibold mb-2">{review.title}</h4>
      )}

      {/* Content */}
      <div className="mb-4">
        <p className="text-[var(--foreground)]/80 leading-relaxed">
          {displayContent}
        </p>
        {isLongContent && (
          <button
            onClick={() => setShowFullContent(!showFullContent)}
            className="text-sm text-[var(--accent)] hover:underline mt-1"
          >
            {showFullContent ? "Show less" : "Read more"}
          </button>
        )}
      </div>

      {/* Detailed Ratings */}
      {(review.professionalismRating || review.communicationRating || review.punctualityRating || review.expertiseRating) && (
        <div className="flex flex-wrap gap-4 mb-4 text-sm">
          {review.professionalismRating && (
            <div className="flex items-center gap-1">
              <span className="text-[var(--foreground)]/60">Professionalism:</span>
              <span className="font-medium">{review.professionalismRating}/5</span>
            </div>
          )}
          {review.communicationRating && (
            <div className="flex items-center gap-1">
              <span className="text-[var(--foreground)]/60">Communication:</span>
              <span className="font-medium">{review.communicationRating}/5</span>
            </div>
          )}
          {review.punctualityRating && (
            <div className="flex items-center gap-1">
              <span className="text-[var(--foreground)]/60">Punctuality:</span>
              <span className="font-medium">{review.punctualityRating}/5</span>
            </div>
          )}
          {review.expertiseRating && (
            <div className="flex items-center gap-1">
              <span className="text-[var(--foreground)]/60">Expertise:</span>
              <span className="font-medium">{review.expertiseRating}/5</span>
            </div>
          )}
        </div>
      )}

      {/* Would Recommend */}
      {review.wouldRecommend !== null && (
        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm mb-4 ${
          review.wouldRecommend 
            ? "bg-green-500/10 text-green-600" 
            : "bg-red-500/10 text-red-600"
        }`}>
          {review.wouldRecommend ? "✓ Would recommend" : "✗ Would not recommend"}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
        <div className="flex items-center gap-4">
          {onHelpful && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--foreground)]/60">Helpful?</span>
              <button
                onClick={() => onHelpful(true)}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[var(--muted)]/50 hover:bg-[var(--accent)]/10 text-sm transition-colors"
              >
                👍 Yes
              </button>
              <button
                onClick={() => onHelpful(false)}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[var(--muted)]/50 hover:bg-red-500/10 text-sm transition-colors"
              >
                👎 No
              </button>
            </div>
          )}
          {review.helpfulCount > 0 && (
            <span className="text-sm text-[var(--foreground)]/60">
              {review.helpfulCount} found this helpful
            </span>
          )}
        </div>
        
        {isOwner && onEdit && (
          <button
            onClick={onEdit}
            className="text-sm text-[var(--accent)] hover:underline"
          >
            Edit Review
          </button>
        )}
      </div>

      {/* Response from Reviewee */}
      {showResponse && review.responseContent && (
        <div className="mt-4 p-4 bg-[var(--muted)]/30 rounded-lg border-l-4 border-[var(--accent)]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-xs font-semibold text-[var(--accent)]">
              {review.reviewee?.name?.[0]?.toUpperCase() || "?"}
            </div>
            <span className="font-semibold text-sm">Response from {review.reviewee?.name || "Tutor"}</span>
            {review.respondedAt && (
              <span className="text-xs text-[var(--foreground)]/60">
                {formatDate(review.respondedAt)}
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--foreground)]/80">{review.responseContent}</p>
        </div>
      )}
    </div>
  );
}

interface TutorRatingSummaryProps {
  stats: {
    totalReviews: number;
    averageRating: number;
    averageProfessionalism: number;
    averageCommunication: number;
    averagePunctuality: number;
    averageExpertise: number;
    wouldRecommendPercentage: number;
  } | null;
  breakdown: {
    fiveStar: number;
    fourStar: number;
    threeStar: number;
    twoStar: number;
    oneStar: number;
  } | null;
}

export function TutorRatingSummary({ stats, breakdown }: TutorRatingSummaryProps) {
  if (!stats || stats.totalReviews === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[var(--foreground)]/60">No reviews yet</p>
      </div>
    );
  }

  const maxCount = Math.max(
    breakdown?.fiveStar || 0,
    breakdown?.fourStar || 0,
    breakdown?.threeStar || 0,
    breakdown?.twoStar || 0,
    breakdown?.oneStar || 0,
    1
  );

  return (
    <div className="space-y-6">
      {/* Overall Rating */}
      <div className="flex items-center gap-6">
        <div className="text-center">
          <div className="text-5xl font-bold text-[var(--foreground)]">
            {stats.averageRating.toFixed(1)}
          </div>
          <div className="flex items-center justify-center gap-1 text-yellow-500 text-xl my-1">
            {"★".repeat(Math.round(stats.averageRating))}
            {"☆".repeat(5 - Math.round(stats.averageRating))}
          </div>
          <p className="text-sm text-[var(--foreground)]/60">
            {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Star Breakdown */}
        {breakdown && (
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = breakdown[`${['one', 'two', 'three', 'four', 'five'][stars - 1]}Star` as keyof typeof breakdown] || 0;
              const percentage = (count / maxCount) * 100;
              return (
                <div key={stars} className="flex items-center gap-2 text-sm">
                  <span className="w-8 text-[var(--foreground)]/60">{stars} ★</span>
                  <div className="flex-1 h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-[var(--foreground)]/60">{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed Ratings */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-[var(--muted)]/30 rounded-lg">
          <div className="text-2xl font-bold text-[var(--accent)]">
            {stats.averageProfessionalism.toFixed(1)}
          </div>
          <p className="text-xs text-[var(--foreground)]/60">Professionalism</p>
        </div>
        <div className="text-center p-3 bg-[var(--muted)]/30 rounded-lg">
          <div className="text-2xl font-bold text-[var(--accent)]">
            {stats.averageCommunication.toFixed(1)}
          </div>
          <p className="text-xs text-[var(--foreground)]/60">Communication</p>
        </div>
        <div className="text-center p-3 bg-[var(--muted)]/30 rounded-lg">
          <div className="text-2xl font-bold text-[var(--accent)]">
            {stats.averagePunctuality.toFixed(1)}
          </div>
          <p className="text-xs text-[var(--foreground)]/60">Punctuality</p>
        </div>
        <div className="text-center p-3 bg-[var(--muted)]/30 rounded-lg">
          <div className="text-2xl font-bold text-[var(--accent)]">
            {stats.averageExpertise.toFixed(1)}
          </div>
          <p className="text-xs text-[var(--foreground)]/60">Expertise</p>
        </div>
      </div>

      {/* Would Recommend */}
      <div className="flex items-center justify-center gap-2 p-4 bg-green-500/10 rounded-lg">
        <span className="text-2xl">👍</span>
        <div className="text-center">
          <div className="text-xl font-bold text-green-600">
            {stats.wouldRecommendPercentage.toFixed(0)}%
          </div>
          <p className="text-sm text-green-600/80">would recommend this tutor</p>
        </div>
      </div>
    </div>
  );
}
