"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { getNotificationIcon, getNotificationColor } from "../../hooks/useNotifications";
import { useNotificationContext, useAuth } from "../../app/providers";
import type { EmailNotification } from "../../lib/types";

function BellIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

function formatTimeAgo(date: string): string {
  const now = new Date();
  const notificationDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return notificationDate.toLocaleDateString();
}

function getNotificationLink(notification: EmailNotification): string {
  const metadata = notification.metadata || {};
  
  switch (notification.type) {
    case 'NEW_MESSAGE':
      return `/messages/${metadata.conversation_id || ''}`;
    case 'NEW_PROPOSAL':
    case 'PROPOSAL_ACCEPTED':
    case 'PROPOSAL_DECLINED':
      return `/jobs/${metadata.job_post_id || ''}`;
    case 'INTERVIEW_SCHEDULED':
    case 'INTERVIEW_REMINDER_24H':
    case 'INTERVIEW_REMINDER_1H':
    case 'INTERVIEW_CANCELLED':
    case 'INTERVIEW_RESCHEDULED':
      return metadata.proposal_id ? `/jobs/${metadata.job_post_id || ''}` : '/interviews';
    case 'CONTRACT_CREATED':
      return `/contracts/${metadata.contract_id || ''}`;
    case 'NEW_LESSON_REQUEST':
    case 'LESSON_REQUEST_ACCEPTED':
    case 'LESSON_REQUEST_DECLINED':
      return '/tutor/requests';
    default:
      return '#';
  }
}

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className = "" }: NotificationBellProps) {
  const { auth } = useAuth();
  const { notifications, unreadCount, markAsOpened, markAllAsOpened } = useNotificationContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: EmailNotification) => {
    if (!notification.openedAt) {
      await markAsOpened(notification.id);
    }
    setIsOpen(false);
  };

  const handleMarkAllRead = async () => {
    await markAllAsOpened();
  };

  if (!auth) return null;

  const recentNotifications: EmailNotification[] = notifications.slice(0, 10);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative ui-btn ui-btn-ghost h-10 px-2.5"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white animate-pulse-soft">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl z-50 animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-[var(--accent)] hover:underline"
                >
                  Mark all read
                </button>
              )}
              <Link
                href="/account/notifications"
                className="p-1.5 text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <SettingsIcon />
              </Link>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[60vh] overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="text-4xl mb-2">🔔</div>
                <p className="text-[var(--foreground)]/60 text-sm">No notifications yet</p>
                <p className="text-[var(--foreground)]/40 text-xs mt-1">
                  We'll notify you about important updates
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {recentNotifications.map((notification) => (
                  <Link
                    key={notification.id}
                    href={getNotificationLink(notification)}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex items-start gap-3 p-4 hover:bg-[var(--muted)]/50 transition-colors ${
                      !notification.openedAt ? 'bg-[var(--accent)]/5' : ''
                    }`}
                  >
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {notification.subject}
                      </p>
                      {notification.bodyText && (
                        <p className="text-sm text-[var(--foreground)]/60 mt-0.5 line-clamp-2">
                          {notification.bodyText}
                        </p>
                      )}
                      <p className="text-xs text-[var(--foreground)]/40 mt-1">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.openedAt && (
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-[var(--accent)] mt-2" />
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 10 && (
            <div className="p-3 border-t border-[var(--border)] text-center">
              <Link
                href="/notifications"
                className="text-sm text-[var(--accent)] hover:underline"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
