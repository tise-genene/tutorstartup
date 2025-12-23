import type { ReactNode } from "react";
import { AppHeader } from "./AppHeader";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="px-4 pb-12 pt-10 md:px-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
