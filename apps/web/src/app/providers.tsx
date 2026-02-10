"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "../providers/auth-provider";
import { I18nProvider } from "../providers/i18n-provider";
import { ThemeProvider } from "../providers/theme-provider";

export { useAuth } from "../providers/auth-provider";
export { useI18n } from "../providers/i18n-provider";
export { useTheme } from "../providers/theme-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>{children}</AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
