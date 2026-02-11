"use client";

import Link from "next/link";
import { useI18n } from "../../providers";

export function Hero() {
  const { t } = useI18n();

  const heroPreviewTags = [
    t("home.hero.preview.tags.1"),
    t("home.hero.preview.tags.2"),
    t("home.hero.preview.tags.3"),
    t("home.hero.preview.tags.4"),
  ];

  return (
    <section className="section-shell relative overflow-hidden">
      <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] items-center">
        <div className="space-y-8">
          <div className="flex flex-wrap gap-2">
            {heroPreviewTags.map((tag) => (
              <span key={tag} className="pill text-xs font-medium text-[var(--accent)] bg-[var(--accent)]/10 border-[var(--accent)]/20">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl text-[var(--foreground)]">
            {t("home.title")}
          </h1>
          <p className="max-w-2xl text-lg leading-8 ui-muted">
            {t("home.subtitle")}
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <Link href="/tutors/search" className="ui-btn ui-btn-primary px-6 h-12 text-base">
              {t("home.cta.search")}
            </Link>
            <Link href="/tutor/profile" className="ui-btn ui-btn-secondary px-6 h-12 text-base">
              {t("home.cta.tutor")}
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <div className="surface-panel p-6 shadow-sm">
            <p className="text-sm font-semibold mb-4 text-[var(--foreground)]">
              {t("home.value.title")}
            </p>
            <ul className="space-y-4 text-sm ui-muted">
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent)] mt-0.5">•</span>
                <span>
                  <strong className="text-[var(--foreground)] font-medium">{t("home.value.1.title")}</strong>
                  {" — "}{t("home.value.1.body")}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent)] mt-0.5">•</span>
                <span>
                  <strong className="text-[var(--foreground)] font-medium">{t("home.value.2.title")}</strong>
                  {" — "}{t("home.value.2.body")}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent)] mt-0.5">•</span>
                <span>
                  <strong className="text-[var(--foreground)] font-medium">{t("home.value.3.title")}</strong>
                  {" — "}{t("home.value.3.body")}
                </span>
              </li>
            </ul>
          </div>

          <div className="surface-panel p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {t("home.hero.preview.card.title")}
              </p>
              <span className="pill text-xs bg-green-500/10 text-green-600 border-green-500/20">
                {t("home.hero.preview.card.status")}
              </span>
            </div>
            <p className="text-sm ui-muted">
              {t("home.hero.preview.card.body")}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/tutors/search" className="ui-btn ui-btn-primary flex-1">
                {t("home.cta.search")}
              </Link>
              <Link href="/auth/register" className="ui-btn ui-btn-secondary flex-1">
                {t("home.cta.tutor")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
