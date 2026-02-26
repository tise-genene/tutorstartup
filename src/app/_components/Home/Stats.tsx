"use client";

import { useI18n } from "../../providers";

function UserGroupIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function AcademicCapIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

export function Stats() {
  const { t } = useI18n();

  const partnerLogos = [
    t("home.partners.1"),
    t("home.partners.2"),
    t("home.partners.3"),
    t("home.partners.4"),
  ];

  const stats = [
    { 
      value: t("home.stats.1.value"), 
      label: t("home.stats.1.label"),
      icon: UserGroupIcon,
      color: "text-[var(--accent)]"
    },
    { 
      value: t("home.stats.2.value"), 
      label: t("home.stats.2.label"),
      icon: AcademicCapIcon,
      color: "text-blue-500"
    },
    { 
      value: t("home.stats.3.value"), 
      label: t("home.stats.3.label"),
      icon: HeartIcon,
      color: "text-rose-500"
    },
  ];

  return (
    <section className="section-shell space-y-12 relative">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -/2 -translate-y-1/translate-x-12 w-[800px] h-[400px] bg-gradient-to-r from-[var(--accent)]/5 via-transparent to-blue-500/5 rounded-full blur-3xl" />
      </div>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-8">
        <div className="space-y-2">
          <p className="text-xs font-bold tracking-widest ui-muted uppercase">
            {t("home.partners.kicker")}
          </p>
          <p className="text-lg font-semibold text-[var(--foreground)]">
            {t("home.partners.title")}
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-4 text-sm font-medium text-[var(--foreground)] opacity-50">
          {partnerLogos.map((logo) => (
            <span key={logo} className="hover:opacity-100 transition-opacity cursor-default">
              {logo}
            </span>
          ))}
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="surface-panel p-8 card-hover animate-slide-up relative overflow-hidden"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--accent)]/5 to-transparent rounded-full blur-2xl" />
            <div className="flex items-start justify-between mb-4 relative">
              <div className={`p-3.5 rounded-xl bg-gradient-to-br from-[var(--accent)]/10 to-[var(--accent)]/5 ${stat.color}`}>
                <stat.icon />
              </div>
            </div>
            <p className="text-4xl font-bold tracking-tight text-[var(--foreground)] bg-gradient-to-r from-[var(--foreground)] to-[var(--foreground)]/80 bg-clip-text text-transparent">
              {stat.value}
            </p>
            <p className="mt-3 text-sm ui-muted font-medium">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
