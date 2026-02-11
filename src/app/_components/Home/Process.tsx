"use client";

import { useI18n } from "../../providers";

export function Process() {
  const { t } = useI18n();

  const howSteps = [
    {
      kicker: t("home.how.1.kicker"),
      title: t("home.how.1.title"),
      body: t("home.how.1.body"),
    },
    {
      kicker: t("home.how.2.kicker"),
      title: t("home.how.2.title"),
      body: t("home.how.2.body"),
    },
    {
      kicker: t("home.how.3.kicker"),
      title: t("home.how.3.title"),
      body: t("home.how.3.body"),
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
        <div className="space-y-12">
          <div>
            <p className="text-xs font-bold tracking-widest ui-muted uppercase mb-2">
              {t("home.how.title")}
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
              {t("home.how.subtitle")}
            </h2>
          </div>

          <div className="space-y-10 pl-2">
            {howSteps.map((step, index) => (
              <div key={step.title} className="flex gap-6 relative">
                <div className="flex-none">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold bg-[var(--input)] text-[var(--foreground)] border border-[var(--border)]">
                    0{index + 1}
                  </span>
                </div>
                {index !== howSteps.length - 1 && (
                  <div className="absolute left-[1.25rem] top-10 bottom-[-2.5rem] w-px bg-[var(--border)]" />
                )}
                <div>
                  <p className="text-xs font-bold tracking-widest ui-muted uppercase mb-1">
                    {step.kicker}
                  </p>
                  <h3 className="text-lg font-bold text-[var(--foreground)] mt-1">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm ui-muted leading-relaxed">
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="surface-panel p-8 sticky top-24">
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
                  className="pt-8 first:pt-0 border-t first:border-t-0 border-[var(--border)]"
                >
                  <blockquote className="text-base italic text-[var(--foreground)] leading-relaxed">
                    “{item.quote}”
                  </blockquote>
                  <div className="mt-4">
                    <p className="text-sm font-bold text-[var(--foreground)]">
                      {item.author}
                    </p>
                    <p className="text-xs ui-muted mt-0.5">{item.role}</p>
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
