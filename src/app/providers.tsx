"use client";

import type { ReactNode } from "react";
import { AuthProvider, useAuth } from "../providers/auth-provider";
import { I18nProvider } from "../providers/i18n-provider";
import { ThemeProvider } from "../providers/theme-provider";
import { NotificationProvider } from "../providers/notification-provider";

export { useAuth } from "../providers/auth-provider";
export { useI18n } from "../providers/i18n-provider";
export { useTheme } from "../providers/theme-provider";
export { useNotificationContext } from "../providers/notification-provider";

// Inner component that has access to auth
function NotificationWrapper({ children }: { children: ReactNode }) {
  const { auth } = useAuth();
  return (
    <NotificationProvider userId={auth?.user.id || null}>
      {children}
    </NotificationProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <NotificationWrapper>
            {children}
          </NotificationWrapper>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
