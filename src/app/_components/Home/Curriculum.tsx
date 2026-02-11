"use client";

import Link from "next/link";
import { useI18n } from "../../providers";

export function Curriculum() {
  const { t } = useI18n();

  const curriculumTracks = [
    {
      title: t("home.curriculum.1.title"),
      body: t("home.curriculum.1.body"),
    },
    {
      title: t("home.curriculum.2.title"),
      body: t("home.curriculum.2.body"),
    },
    {
      title: t("home.curriculum.3.title"),
      body: t("home.curriculum.3.body"),
    },
    {
      title: t("home.curriculum.4.title"),
      body: t("home.curriculum.4.body"),
    },
  ];

  return (
    <section className="section-shell space-y-16">
      <div className="max-w-2xl">
        <p className="text-xs font-bold tracking-widest ui-muted uppercase mb-2">
          {t("home.curriculum.kicker")}
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
          {t("home.curriculum.title")}
        </h2>
        <p className="mt-4 text-base ui-muted leading-relaxed">
          {t("home.curriculum.body")}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {curriculumTracks.map((track) => (
          <div
            key={track.title}
            className="surface-panel p-6 border border-[var(--border)] hover:border-[var(--accent)] transition-colors duration-200"
          >
            <h3 className="text-lg font-bold text-[var(--foreground)]">
              {track.title}
            </h3>
            <p className="mt-2 text-sm ui-muted leading-relaxed">{track.body}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface-panel p-8 bg-[var(--card)]">
          <p className="text-xs font-bold tracking-widest ui-muted uppercase mb-2">
            {t("home.cta.schools.kicker")}
          </p>
          <h3 className="text-xl font-bold text-[var(--foreground)] mt-2">
            {t("home.cta.schools.title")}
          </h3>
          <p className="mt-2 text-sm ui-muted leading-relaxed">
            {t("home.cta.schools.body")}
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link href="/auth/register" className="ui-btn ui-btn-primary">
              {t("home.cta.schools.primary")}
            </Link>
            <Link href="/tutor/profile" className="ui-btn ui-btn-secondary">
              {t("home.cta.schools.secondary")}
            </Link>
          </div>
        </div>

        <div className="surface-panel p-8 bg-[var(--card)]">
          <p className="text-xs font-bold tracking-widest ui-muted uppercase mb-2">
            {t("home.cta.banner.kicker")}
          </p>
          <h3 className="text-xl font-bold text-[var(--foreground)] mt-2">
            {t("home.cta.banner.title")}
          </h3>
          <p className="mt-2 text-sm ui-muted leading-relaxed">
            {t("home.cta.banner.body")}
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link href="/auth/register" className="ui-btn ui-btn-primary">
              {t("home.cta.banner.primary")}
            </Link>
            <Link href="/tutors/search" className="ui-btn ui-btn-secondary">
              {t("home.cta.banner.secondary")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
