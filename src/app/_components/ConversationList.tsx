"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useMessaging } from "../../hooks/useMessaging";
import { useAuth } from "../../app/providers";
import type { Conversation } from "../../lib/types";

function MessageCircleIcon({ count }: { count: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
      {count > 0 && (
        <circle cx="18" cy="8" r="3" fill="currentColor" className="text-red-500" />
      )}
    </svg>
  );
}

function formatRelativeTime(date: string): string {
  const now = new Date();
  const messageDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - messageDate.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return messageDate.toLocaleDateString([], { month: "short", day: "numeric" });
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

interface ConversationListProps {
  onSelectConversation?: (conversation: Conversation) => void;
  selectedId?: string;
  compact?: boolean;
}

export function ConversationList({ onSelectConversation, selectedId, compact = false }: ConversationListProps) {
  const { auth } = useAuth();
  const { conversations, loading, totalUnreadCount, fetchConversations } = useMessaging(auth?.user.id || null);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => 
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  }, [conversations]);

  if (loading && conversations.length === 0) {
    return (
      <div className={`${compact ? "p-2" : "p-4"}`}>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="h-10 w-10 rounded-full bg-[var(--muted)]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-[var(--muted)] rounded" />
                <div className="h-3 w-full bg-[var(--muted)] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center ${compact ? "p-4" : "p-8"} text-center`}>
        <div className="text-4xl mb-2">💬</div>
        <p className="text-[var(--foreground)]/60 text-sm">No conversations yet</p>
        <p className="text-[var(--foreground)]/40 text-xs mt-1">
          Messages with tutors will appear here
        </p>
      </div>
    );
  }

  return (
    <div className={`${compact ? "" : "h-full flex flex-col"}`}>
      {!compact && (
        <div className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Messages</h2>
            {totalUnreadCount > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
                {totalUnreadCount}
              </span>
            )}
          </div>
        </div>
      )}

      <div className={`${compact ? "space-y-1 p-2" : "flex-1 overflow-y-auto"}`}>
        {sortedConversations.map((conversation) => {
          const otherUser = conversation.parentId === auth?.user.id 
            ? conversation.tutor 
            : conversation.parent;
          const isSelected = selectedId === conversation.id;
          const hasUnread = (conversation.unreadCount || 0) > 0;

          const content = (
            <div
              className={`flex items-center gap-3 ${compact ? "p-2" : "p-4"} cursor-pointer transition-colors ${
                isSelected
                  ? "bg-[var(--accent)]/10 border-l-2 border-[var(--accent)]"
                  : "hover:bg-[var(--muted)]/50 border-l-2 border-transparent"
              } ${hasUnread ? "bg-[var(--accent)]/5" : ""}`}
              onClick={() => onSelectConversation?.(conversation)}
            >
              <div className="relative flex-shrink-0">
                <div className={`${compact ? "h-8 w-8" : "h-12 w-12"} rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-lg font-semibold text-[var(--accent)]`}>
                  {otherUser?.name?.[0]?.toUpperCase() || "?"}
                </div>
                {hasUnread && (
                  <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 border-2 border-[var(--card)]" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className={`font-medium truncate ${hasUnread ? "font-semibold" : ""} ${compact ? "text-sm" : ""}`}>
                    {otherUser?.name || "Unknown"}
                  </h3>
                  {conversation.lastMessage && (
                    <span className="text-xs text-[var(--foreground)]/40 flex-shrink-0 ml-2">
                      {formatRelativeTime(conversation.lastMessageAt)}
                    </span>
                  )}
                </div>

                {!compact && (
                  <>
                    <p className={`text-sm truncate ${hasUnread ? "text-[var(--foreground)] font-medium" : "text-[var(--foreground)]/60"}`}>
                      {conversation.lastMessage ? (
                        <>
                          {conversation.lastMessage.senderId === auth?.user.id && "You: "}
                          {truncateText(conversation.lastMessage.content, 50)}
                        </>
                      ) : (
                        <span className="text-[var(--foreground)]/40">No messages yet</span>
                      )}
                    </p>
                    
                    {conversation.jobPost && (
                      <p className="text-xs text-[var(--foreground)]/40 mt-1 truncate">
                        Re: {conversation.jobPost.title}
                      </p>
                    )}
                  </>
                )}
              </div>

              {hasUnread && !compact && (
                <span className="flex-shrink-0 inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-xs font-bold text-white bg-[var(--accent)] rounded-full">
                  {conversation.unreadCount}
                </span>
              )}
            </div>
          );

          return compact ? (
            <div key={conversation.id}>{content}</div>
          ) : (
            <Link
              key={conversation.id}
              href={`/messages/${conversation.id}`}
              className="block"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

interface MessageBadgeProps {
  className?: string;
}

export function MessageBadge({ className = "" }: MessageBadgeProps) {
  const { auth } = useAuth();
  const { totalUnreadCount } = useMessaging(auth?.user.id || null);

  if (totalUnreadCount === 0) return null;

  return (
    <span className={`inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-xs font-bold text-white bg-red-500 rounded-full ${className}`}>
      {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
    </span>
  );
}
