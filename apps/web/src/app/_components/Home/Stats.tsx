"use client";

import { useI18n } from "../../providers";

export function Stats() {
  const { t } = useI18n();

  const partnerLogos = [
    t("home.partners.1"),
    t("home.partners.2"),
    t("home.partners.3"),
    t("home.partners.4"),
  ];

  const stats = [
    { value: t("home.stats.1.value"), label: t("home.stats.1.label") },
    { value: t("home.stats.2.value"), label: t("home.stats.2.label") },
    { value: t("home.stats.3.value"), label: t("home.stats.3.label") },
  ];

  const borderTopStyle = { borderTop: "1px solid var(--divider)" };
  const partnerToneStyle = {
    color: "color-mix(in srgb, var(--foreground) 65%, transparent)",
  };

  return (
    <section className="section-shell space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] ui-muted">
            {t("home.partners.kicker")}
          </p>
          <p
            className="text-lg font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            {t("home.partners.title")}
          </p>
        </div>
        <div
          className="flex flex-wrap gap-5 text-sm font-semibold"
          style={partnerToneStyle}
        >
          {partnerLogos.map((logo) => (
            <span key={logo}>{logo}</span>
          ))}
        </div>
      </div>
      <div className="grid gap-4 pt-6 md:grid-cols-3" style={borderTopStyle}>
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="surface-card surface-card--quiet p-5 transition hover:-translate-y-1"
          >
            <p
              className="text-3xl font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              {stat.value}
            </p>
            <p className="mt-1 text-sm ui-muted">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
