"use client";

import { useEffect } from "react";
import { PageShell } from "../_components/PageShell";
import { ConversationList } from "../_components/ConversationList";
import { ChatWindow } from "../_components/ChatWindow";
import { useAuth, useNotificationContext } from "../providers";
import type { EmailNotification } from "../../lib/types";

export default function MessagesPage() {
  const { auth } = useAuth();
  const { notifications, markAsOpened } = useNotificationContext();

  // Mark all message notifications as opened when viewing messages page
  useEffect(() => {
    if (!notifications.length) return;
    
    const messageNotifications = notifications.filter(
      (n: EmailNotification) => n.type === 'NEW_MESSAGE' && !n.openedAt
    );
    
    messageNotifications.forEach((notification: EmailNotification) => {
      markAsOpened(notification.id);
    });
  }, [notifications, markAsOpened]);

  if (!auth) {
    return (
      <PageShell>
        <div className="mx-auto max-w-6xl">
          <div className="glass-panel p-8 text-center">
            <p className="text-[var(--foreground)]/60">Please log in to view messages.</p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl h-[calc(100vh-140px)]">
        <div className="glass-panel h-full overflow-hidden flex">
          {/* Conversation List - Full width on mobile, sidebar on desktop */}
          <div className="w-full lg:w-80 xl:w-96 lg:border-r lg:border-[var(--border)]">
            <ConversationList />
          </div>

          {/* Empty State - Hidden on mobile, shown on desktop */}
          <div className="hidden lg:flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">💬</div>
              <h3 className="text-lg font-semibold">Select a conversation</h3>
              <p className="text-sm text-[var(--foreground)]/60 mt-1">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
