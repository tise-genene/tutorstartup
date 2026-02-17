"use client";

import { createContext, useContext, ReactNode } from "react";
import { useNotifications } from "../hooks/useNotifications";
import type { EmailNotification } from "../lib/types";

interface NotificationContextType {
  notifications: EmailNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsOpened: (notificationId: string) => Promise<boolean>;
  markAllAsOpened: () => Promise<boolean>;
  fetchNotifications: (limit?: number) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ 
  children, 
  userId 
}: { 
  children: ReactNode; 
  userId: string | null;
}) {
  const notificationData = useNotifications(userId);

  return (
    <NotificationContext.Provider value={notificationData}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotificationContext must be used within NotificationProvider");
  }
  return context;
}
