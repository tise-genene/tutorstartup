"use client";

import { PageShell } from "./_components/PageShell";
import { Hero } from "./_components/Home/Hero";
import { Pathways } from "./_components/Home/Pathways";
import { Footer } from "./_components/Home/Footer";

export default function HomePage() {
  return (
    <PageShell>
      <Hero />
      <Pathways />
      <Footer />
    </PageShell>
  );
}
