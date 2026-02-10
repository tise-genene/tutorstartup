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
    <section className="section-shell space-y-10">
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] ui-muted">
          {t("home.curriculum.kicker")}
        </p>
        <h2
          className="mt-2 text-2xl font-semibold"
          style={{ color: "var(--foreground)" }}
        >
          {t("home.curriculum.title")}
        </h2>
        <p className="text-sm ui-muted">{t("home.curriculum.body")}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {curriculumTracks.map((track) => (
          <div
            key={track.title}
            className="surface-card surface-card--quiet p-5 transition hover:-translate-y-1"
          >
            <p
              className="text-lg font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              {track.title}
            </p>
            <p className="text-sm ui-muted">{track.body}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-card p-6">
          <p className="text-xs font-semibold tracking-[0.16em] ui-muted">
            {t("home.cta.schools.kicker")}
          </p>
          <h3
            className="mt-2 text-xl font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            {t("home.cta.schools.title")}
          </h3>
          <p className="text-sm ui-muted">{t("home.cta.schools.body")}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/auth/register" className="ui-btn ui-btn-primary">
              {t("home.cta.schools.primary")}
            </Link>
            <Link href="/tutor/profile" className="ui-btn">
              {t("home.cta.schools.secondary")}
            </Link>
          </div>
        </div>
        <div className="surface-card p-6">
          <p className="text-xs font-semibold tracking-[0.16em] ui-muted">
            {t("home.cta.banner.kicker")}
          </p>
          <h3
            className="mt-2 text-xl font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            {t("home.cta.banner.title")}
          </h3>
          <p className="text-sm ui-muted">{t("home.cta.banner.body")}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/auth/register" className="ui-btn ui-btn-primary">
              {t("home.cta.banner.primary")}
            </Link>
            <Link href="/tutors/search" className="ui-btn">
              {t("home.cta.banner.secondary")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
