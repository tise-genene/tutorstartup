"use client";

import Link from "next/link";
import { useI18n } from "../../providers";

function CheckCircleIcon() {
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
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function SparklesIcon() {
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
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="20"
      height="20"
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

function BriefcaseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  );
}

export function Pathways() {
  const { t } = useI18n();

  const studentReasons = [
    {
      title: t("home.reasons.students.items.1.title"),
      body: t("home.reasons.students.items.1.body"),
      icon: CheckCircleIcon,
    },
    {
      title: t("home.reasons.students.items.2.title"),
      body: t("home.reasons.students.items.2.body"),
      icon: SparklesIcon,
    },
    {
      title: t("home.reasons.students.items.3.title"),
      body: t("home.reasons.students.items.3.body"),
      icon: UsersIcon,
    },
  ];

  const tutorReasons = [
    {
      title: t("home.reasons.tutors.items.1.title"),
      body: t("home.reasons.tutors.items.1.body"),
      icon: BriefcaseIcon,
    },
    {
      title: t("home.reasons.tutors.items.2.title"),
      body: t("home.reasons.tutors.items.2.body"),
      icon: ChartIcon,
    },
    {
      title: t("home.reasons.tutors.items.3.title"),
      body: t("home.reasons.tutors.items.3.body"),
      icon: UsersIcon,
    },
  ];

  return (
    <section className="section-shell space-y-16">
      <div className="grid gap-16 lg:grid-cols-2">
        <div className="space-y-8 animate-slide-up">
          <div>
            <p className="text-xs font-bold tracking-widest ui-muted uppercase mb-2">
              {t("home.paths.student.kicker")}
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
              {t("home.reasons.students.title")}
            </h2>
            <p className="mt-4 text-base ui-muted leading-relaxed">
              {t("home.reasons.students.body")}
            </p>
          </div>
          <div className="space-y-6 pl-2">
            {studentReasons.map((item, index) => (
              <div key={item.title} className="relative pl-8 border-l-2 border-[var(--border)] pb-6 last:pb-0 last:border-l-0">
                <div className="absolute left-[-10px] top-0 p-1.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)]">
                  <item.icon />
                </div>
                <p className="font-semibold text-[var(--foreground)] text-lg">
                  {item.title}
                </p>
                <p className="mt-1.5 text-sm ui-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8 animate-slide-up animate-delay-200">
          <div>
            <p className="text-xs font-bold tracking-widest ui-muted uppercase mb-2">
              {t("home.paths.tutor.kicker")}
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
              {t("home.reasons.tutors.title")}
            </h2>
            <p className="mt-4 text-base ui-muted leading-relaxed">
              {t("home.reasons.tutors.body")}
            </p>
          </div>
          <div className="space-y-6 pl-2">
            {tutorReasons.map((item, index) => (
              <div key={item.title} className="relative pl-8 border-l-2 border-[var(--border)] pb-6 last:pb-0 last:border-l-0">
                <div className="absolute left-[-10px] top-0 p-1.5 rounded-full bg-blue-100 text-blue-600">
                  <item.icon />
                </div>
                <p className="font-semibold text-[var(--foreground)] text-lg">
                  {item.title}
                </p>
                <p className="mt-1.5 text-sm ui-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface-panel p-8 flex flex-col justify-between card-hover animate-slide-up animate-delay-300">
          <div>
            <p className="text-xs font-bold tracking-widest ui-muted uppercase mb-2">
              {t("home.paths.student.kicker")}
            </p>
            <h3 className="text-xl font-bold text-[var(--foreground)] mt-2">
              {t("home.paths.student.title")}
            </h3>
            <p className="mt-3 text-sm ui-muted leading-relaxed">
              {t("home.paths.student.body")}
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/tutors/search" className="ui-btn ui-btn-primary">
              {t("home.paths.student.cta")}
              <ArrowRightIcon />
            </Link>
            <Link href="/auth/login" className="ui-btn ui-btn-secondary">
              {t("home.paths.student.ctaSecondary")}
            </Link>
          </div>
        </div>

        <div className="surface-panel p-8 flex flex-col justify-between border-l-4 border-l-[var(--accent)] card-hover animate-slide-up animate-delay-400">
          <div>
            <p className="text-xs font-bold tracking-widest ui-muted uppercase mb-2">
              {t("home.paths.tutor.kicker")}
            </p>
            <h3 className="text-xl font-bold text-[var(--foreground)] mt-2">
              {t("home.paths.tutor.title")}
            </h3>
            <p className="mt-3 text-sm ui-muted leading-relaxed">
              {t("home.paths.tutor.body")}
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/auth/register" className="ui-btn ui-btn-primary">
              {t("home.paths.tutor.ctaPrimary")}
              <ArrowRightIcon />
            </Link>
            <Link href="/tutor/profile" className="ui-btn ui-btn-secondary">
              {t("home.paths.tutor.ctaSecondary")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
