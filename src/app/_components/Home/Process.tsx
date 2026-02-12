"use client";

import { useI18n } from "../../providers";

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="32"
      height="32"
      fill="currentColor"
      stroke="none"
      className="text-[var(--accent)]/20"
    >
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21c0 1 0 1 1 1zM15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
    </svg>
  );
}

export function Process() {
  const { t } = useI18n();

  const howSteps = [
    {
      kicker: t("home.how.1.kicker"),
      title: t("home.how.1.title"),
      body: t("home.how.1.body"),
      icon: SearchIcon,
    },
    {
      kicker: t("home.how.2.kicker"),
      title: t("home.how.2.title"),
      body: t("home.how.2.body"),
      icon: MessageIcon,
    },
    {
      kicker: t("home.how.3.kicker"),
      title: t("home.how.3.title"),
      body: t("home.how.3.body"),
      icon: StarIcon,
    },
  ];

  const testimonials = [
    {
      quote: t("home.testimonials.1.quote"),
      author: t("home.testimonials.1.author"),
      role: t("home.testimonials.1.role"),
    },
    {
      quote: t("home.testimonials.2.quote"),
      author: t("home.testimonials.2.author"),
      role: t("home.testimonials.2.role"),
    },
  ];

  return (
    <section className="section-shell space-y-16">
      <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-12 animate-slide-up">
          <div>
            <p className="text-xs font-bold tracking-widest ui-muted uppercase mb-2">
              {t("home.how.title")}
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
              {t("home.how.subtitle")}
            </h2>
          </div>

          <div className="space-y-8 pl-2">
            {howSteps.map((step, index) => (
              <div key={step.title} className="flex gap-6 relative group">
                <div className="flex-none">
                  <div className="relative">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/30">
                      0{index + 1}
                    </div>
                    {index !== howSteps.length - 1 && (
                      <div className="absolute left-[1.45rem] top-12 bottom-[-2rem] w-px bg-[var(--border)] group-hover:bg-[var(--accent)]/30 transition-colors" />
                    )}
                  </div>
                </div>
                <div className="pt-1">
                  <p className="text-xs font-bold tracking-widest ui-muted uppercase mb-1">
                    {step.kicker}
                  </p>
                  <h3 className="text-lg font-bold text-[var(--foreground)] mt-1 flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent)]">
                      <step.icon />
                    </span>
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm ui-muted leading-relaxed max-w-md">
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="surface-panel p-8 sticky top-24 shadow-lg animate-slide-up animate-delay-200">
            <p className="text-xs font-bold tracking-widest ui-muted uppercase mb-4">
              {t("home.metrics.kicker")}
            </p>
            <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">
              {t("home.metrics.title")}
            </h3>
            <p className="text-sm ui-muted mb-8">
              {t("home.metrics.subtitle")}
            </p>

            <div className="space-y-8">
              {testimonials.map((item, index) => (
                <div
                  key={item.author}
                  className="pt-6 first:pt-0 border-t first:border-t-0 border-[var(--border)]"
                >
                  <QuoteIcon />
                  <blockquote className="text-base italic text-[var(--foreground)] leading-relaxed mt-3">
                    "{item.quote}"
                  </blockquote>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-9 w-px bg-[var(--accent)]" />
                    <div>
                      <p className="text-sm font-bold text-[var(--foreground)]">
                        {item.author}
                      </p>
                      <p className="text-xs ui-muted mt-0.5">{item.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
