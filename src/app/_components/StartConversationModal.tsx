"use client";

import { useState } from "react";
import { useMessaging } from "../../hooks/useMessaging";
import { useAuth } from "../../app/providers";
import type { Proposal } from "../../lib/types";

interface StartConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutorId: string;
  tutorName: string;
  jobPostId?: string;
  jobTitle?: string;
  proposalId?: string;
  onSuccess?: (conversationId: string) => void;
}

export function StartConversationModal({
  isOpen,
  onClose,
  tutorId,
  tutorName,
  jobPostId,
  jobTitle,
  proposalId,
  onSuccess,
}: StartConversationModalProps) {
  const { auth } = useAuth();
  const { createConversation } = useMessaging(auth?.user.id || null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    const conversationId = await createConversation({
      tutorId,
      jobPostId,
      proposalId,
      initialMessage: message.trim(),
    });

    if (conversationId) {
      onSuccess?.(conversationId);
      onClose();
    } else {
      setError("Failed to start conversation. Please try again.");
    }

    setIsLoading(false);
  };

  // Pre-fill message if it's about a job
  const getDefaultMessage = () => {
    if (jobTitle) {
      return `Hi, I'm interested in discussing the "${jobTitle}" position. `;
    }
    return "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl animate-scale-in">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-2">Start Conversation</h2>
          
          <div className="flex items-center gap-3 mb-4 p-3 bg-[var(--muted)]/50 rounded-lg">
            <div className="h-10 w-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-lg font-semibold text-[var(--accent)]">
              {tutorName[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{tutorName}</p>
              {jobTitle && (
                <p className="text-sm text-[var(--foreground)]/60">
                  Re: {jobTitle}
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Your Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={getDefaultMessage() || "Type your message..."}
                className="w-full min-h-[120px] rounded-lg border border-[var(--border)] bg-[var(--input)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
                required
              />
              <p className="mt-1 text-xs text-[var(--foreground)]/50">
                Introduce yourself and explain what you're looking for.
              </p>
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
                disabled={!message.trim() || isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Sending...
                  </span>
                ) : (
                  "Send Message"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

interface MessageButtonProps {
  tutorId: string;
  tutorName: string;
  jobPostId?: string;
  jobTitle?: string;
  proposalId?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  onConversationCreated?: (conversationId: string) => void;
}

export function MessageButton({
  tutorId,
  tutorName,
  jobPostId,
  jobTitle,
  proposalId,
  variant = "secondary",
  size = "md",
  className = "",
  onConversationCreated,
}: MessageButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sizeClasses = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };

  const variantClasses = {
    primary: "ui-btn ui-btn-primary",
    secondary: "ui-btn ui-btn-secondary",
    ghost: "ui-btn ui-btn-ghost",
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      >
        <span className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
          </svg>
          Message
        </span>
      </button>

      <StartConversationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tutorId={tutorId}
        tutorName={tutorName}
        jobPostId={jobPostId}
        jobTitle={jobTitle}
        proposalId={proposalId}
        onSuccess={onConversationCreated}
      />
    </>
  );
}
