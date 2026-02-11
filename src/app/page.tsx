"use client";

import { PageShell } from "./_components/PageShell";
import { Hero } from "./_components/Home/Hero";
import { Stats } from "./_components/Home/Stats";
import { Pathways } from "./_components/Home/Pathways";
import { Process } from "./_components/Home/Process";
import { Curriculum } from "./_components/Home/Curriculum";
import { Faq } from "./_components/Home/Faq";
import { Footer } from "./_components/Home/Footer";

export default function HomePage() {
  return (
    <PageShell>
      <div className="space-y-12 lg:space-y-16">
        <Hero />
        <Stats />
        <Pathways />
        <Process />
        <Curriculum />
        <Faq />
        <Footer />
      </div>
    </PageShell>
  );
}
