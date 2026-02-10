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

  const timelineLineStyle = {
    background:
      "linear-gradient(to bottom, color-mix(in srgb, var(--foreground) 35%, transparent), transparent)",
  };

  const stepBadgeStyle = {
    border: "1px solid color-mix(in srgb, var(--foreground) 20%, transparent)",
    color: "color-mix(in srgb, var(--foreground) 70%, transparent)",
    background: "color-mix(in srgb, var(--background) 80%, transparent)",
  };

  const borderTopStyle = { borderTop: "1px solid var(--divider)" };

  return (
    <section className="section-shell section-shell--tonal space-y-10">
      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] ui-muted">
            {t("home.how.title")}
          </p>
          <h2
            className="mt-2 text-2xl font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            {t("home.how.subtitle")}
          </h2>
          <div className="relative mt-10">
            <span
              className="pointer-events-none absolute left-3 top-2 bottom-2 w-px"
              style={timelineLineStyle}
            />
            <ol className="space-y-8">
              {howSteps.map((step, index) => (
                <li key={step.title} className="flex gap-5">
                  <span
                    className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold"
                    style={stepBadgeStyle}
                  >
                    0{index + 1}
                  </span>
                  <div>
                    <p className="text-xs font-semibold tracking-[0.16em] ui-muted">
                      {step.kicker}
                    </p>
                    <p
                      className="mt-1 font-semibold"
                      style={{ color: "var(--foreground)" }}
                    >
                      {step.title}
                    </p>
                    <p className="text-sm ui-muted">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="space-y-6">
          <div className="surface-card p-6">
            <p className="text-xs font-semibold tracking-[0.16em] ui-muted">
              {t("home.metrics.kicker")}
            </p>
            <p
              className="mt-2 text-lg font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              {t("home.metrics.title")}
            </p>
            <p className="text-sm ui-muted">{t("home.metrics.subtitle")}</p>
            <div className="mt-6 space-y-5">
              {testimonials.map((item, index) => (
                <div
                  key={item.author}
                  className="pt-5 first:pt-0"
                  style={index === 0 ? undefined : borderTopStyle}
                >
                  <p
                    className="text-base"
                    style={{ color: "var(--foreground)" }}
                  >
                    “{item.quote}”
                  </p>
                  <p
                    className="mt-3 text-sm font-semibold"
                    style={{ color: "var(--foreground)" }}
                  >
                    {item.author}
                  </p>
                  <p className="text-xs ui-muted">{item.role}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
