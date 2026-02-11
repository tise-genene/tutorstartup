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

  return (
    <section className="section-shell space-y-12">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-8">
        <div>
          <p className="text-xs font-bold tracking-widest ui-muted uppercase mb-1">
            {t("home.partners.kicker")}
          </p>
          <p className="text-lg font-semibold text-[var(--foreground)]">
            {t("home.partners.title")}
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-4 text-sm font-medium text-[var(--foreground)] opacity-60">
          {partnerLogos.map((logo) => (
            <span key={logo}>{logo}</span>
          ))}
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="surface-panel p-6"
          >
            <p className="text-4xl font-bold tracking-tight text-[var(--foreground)]">
              {stat.value}
            </p>
            <p className="mt-2 text-sm ui-muted font-medium">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
