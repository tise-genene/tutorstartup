import type { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { ChatWidget } from "./ChatWidget";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <ChatWidget />
    </div>
  );
}
