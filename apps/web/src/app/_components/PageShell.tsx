import type { ReactNode } from "react";
import { AppHeader } from "./AppHeader";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main id="main" className="px-4 pb-16 pt-10 md:px-10">
        {children}
      </main>
    </div>
  );
}
