"use client";

import { useState } from "react";
import { useInterviews } from "../../hooks/useInterviews";
import { useAuth } from "../../app/providers";
import type { Interview } from "../../lib/types";

interface InterviewFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  interview: Interview;
  onSuccess?: () => void;
}

export function InterviewFeedbackModal({
  isOpen,
  onClose,
  interview,
  onSuccess,
}: InterviewFeedbackModalProps) {
  const { auth } = useAuth();
  const { completeInterview } = useInterviews(auth?.user.id || null);
  const [rating, setRating] = useState<number>(interview.rating || 0);
  const [feedback, setFeedback] = useState<string>(interview.feedback || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsLoading(true);
    setError(null);

    const result = await completeInterview(interview.id, rating, feedback);

    if (result) {
      onSuccess?.();
      onClose();
    } else {
      setError("Failed to save feedback. Please try again.");
    }

    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl animate-scale-in">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-2">Interview Feedback</h2>
          <p className="text-sm text-[var(--foreground)]/60 mb-4">
            How did the interview with {interview.tutor?.name || "the tutor"} go?
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Rating *
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-2xl transition-colors ${
                      star <= rating ? "text-yellow-500" : "text-[var(--foreground)]/20"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <p className="text-xs text-[var(--foreground)]/50 mt-1">
                {rating === 1 && "Poor - Not a good fit"}
                {rating === 2 && "Below Average - Some concerns"}
                {rating === 3 && "Average - Decent candidate"}
                {rating === 4 && "Good - Strong candidate"}
                {rating === 5 && "Excellent - Perfect fit"}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Feedback (optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your thoughts on the interview..."
                className="w-full min-h-[100px] border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--input)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>

            <div className="flex justify-end gap-3">
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
                disabled={rating === 0 || isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Saving...
                  </span>
                ) : (
                  "Complete Interview"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
