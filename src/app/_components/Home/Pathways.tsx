"use client";

import Link from "next/link";
import { useI18n } from "../../providers";

function ArrowRightIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function Pathways() {
  const { t } = useI18n();

  return (
    <section className="py-20 bg-[var(--card)]/50">
      <div className="max-w-[1400px] mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Why choose TutorHub?
          </h2>
          <p className="mt-4 text-lg text-[var(--foreground)]/60">
            Whether you're a student or a tutor, we make learning simple and secure.
          </p>
        </div>

        {/* Two Paths */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* For Students */}
          <div className="surface-panel p-8 rounded-2xl">
            <div className="h-12 w-12 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">For Students</h3>
            <p className="text-[var(--foreground)]/60 mb-6">
              Find the perfect tutor for your learning needs
            </p>
            <ul className="space-y-3 mb-8">
              {[
                "Verified tutors",
                "Browse by subject & price",
                "Read reviews",
                "Secure payments",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                    <CheckIcon />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/tutors/search"
              className="inline-flex items-center gap-2 text-[var(--accent)] font-semibold hover:gap-3 transition-all"
            >
              Find a Tutor <ArrowRightIcon />
            </Link>
          </div>

          {/* For Tutors */}
          <div className="surface-panel p-8 rounded-2xl border-2 border-[var(--accent)]/20">
            <div className="h-12 w-12 rounded-xl bg-[var(--accent)] flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">For Tutors</h3>
            <p className="text-[var(--foreground)]/60 mb-6">
              Turn your knowledge into income
            </p>
            <ul className="space-y-3 mb-8">
              {[
                "Set your own rates",
                "Get matched with students",
                "Secure milestone payments",
                "Build your reputation",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-white">
                    <CheckIcon />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold px-5 py-2.5 rounded-xl transition-all hover:-translate-y-0.5"
            >
              Start Teaching <ArrowRightIcon />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
