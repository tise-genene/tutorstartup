"use client";

import Link from "next/link";
import { useI18n } from "../../providers";

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
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
      className="transition-transform group-hover:translate-x-1"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function UserGroupIcon() {
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

function BookOpenIcon() {
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
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function ShieldCheckIcon() {
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
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function Hero() {
  const { t } = useI18n();

  const heroPreviewTags = [
    t("home.hero.preview.tags.1"),
    t("home.hero.preview.tags.2"),
    t("home.hero.preview.tags.3"),
    t("home.hero.preview.tags.4"),
  ];

  const valueProps = [
    { icon: UserGroupIcon, title: t("home.value.1.title"), body: t("home.value.1.body") },
    { icon: BookOpenIcon, title: t("home.value.2.title"), body: t("home.value.2.body") },
    { icon: ShieldCheckIcon, title: t("home.value.3.title"), body: t("home.value.3.body") },
  ];

  return (
    <section className="section-shell-lg relative overflow-hidden">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-[var(--accent)]/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-[var(--accent)]/5 blur-3xl" />
      </div>
      
      <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] items-start">
        <div className="space-y-8 animate-slide-up">
          <div className="flex flex-wrap gap-3">
            {heroPreviewTags.map((tag) => (
              <span
                key={tag}
                className="pill text-xs font-semibold text-[var(--accent)] bg-[var(--accent-subtle)] border-[var(--accent)]/30"
              >
                {tag}
              </span>
            ))}
          </div>
          <div>
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl text-[var(--foreground)] leading-[1.1]">
              {t("home.title")}
            </h1>
            <p className="mt-6 text-lg leading-8 ui-muted max-w-xl">
              {t("home.subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/tutors/search"
              className="ui-btn ui-btn-primary px-8 h-12 text-base group"
            >
              <span>{t("home.cta.search")}</span>
              <ArrowRightIcon />
            </Link>
            <Link
              href="/tutor/profile"
              className="ui-btn ui-btn-secondary px-8 h-12 text-base"
            >
              {t("home.cta.tutor")}
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <div className="surface-panel p-7 shadow-md animate-slide-up animate-delay-200">
            <p className="text-sm font-semibold mb-5 text-[var(--foreground)] flex items-center gap-2">
              <span className="icon-container">
                <CheckIcon />
              </span>
              {t("home.value.title")}
            </p>
            <ul className="space-y-4 text-sm">
              {valueProps.map((prop) => (
                <li key={prop.title} className="flex items-start gap-3">
                  <span className="flex-none mt-0.5 text-[var(--accent)]">
                    <prop.icon />
                  </span>
                  <span className="ui-muted">
                    <strong className="text-[var(--foreground)] font-medium">{prop.title}</strong>
                    {" — "}{prop.body}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="surface-panel p-7 shadow-md animate-slide-up animate-delay-300 card-hover">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {t("home.hero.preview.card.title")}
              </p>
              <span className="pill text-xs badge-success border-0">
                {t("home.hero.preview.card.status")}
              </span>
            </div>
            <p className="text-sm ui-muted mb-5 leading-relaxed">
              {t("home.hero.preview.card.body")}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/tutors/search" className="ui-btn ui-btn-primary flex-1 h-10">
                {t("home.cta.search")}
              </Link>
              <Link href="/auth/register" className="ui-btn ui-btn-secondary flex-1 h-10">
                {t("home.cta.tutor")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
