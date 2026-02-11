"use client";

import Link from "next/link";
import { useI18n } from "../../providers";

export function Pathways() {
  const { t } = useI18n();

  const studentReasons = [
    {
      title: t("home.reasons.students.items.1.title"),
      body: t("home.reasons.students.items.1.body"),
    },
    {
      title: t("home.reasons.students.items.2.title"),
      body: t("home.reasons.students.items.2.body"),
    },
    {
      title: t("home.reasons.students.items.3.title"),
      body: t("home.reasons.students.items.3.body"),
    },
  ];

  const tutorReasons = [
    {
      title: t("home.reasons.tutors.items.1.title"),
      body: t("home.reasons.tutors.items.1.body"),
    },
    {
      title: t("home.reasons.tutors.items.2.title"),
      body: t("home.reasons.tutors.items.2.body"),
    },
    {
      title: t("home.reasons.tutors.items.3.title"),
      body: t("home.reasons.tutors.items.3.body"),
    },
  ];

  return (
    <section className="section-shell space-y-16">
      <div className="grid gap-16 lg:grid-cols-2">
        <div className="space-y-8">
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
          <div className="space-y-8 pl-2">
            {studentReasons.map((item) => (
              <div key={item.title} className="relative pl-8 border-l border-[var(--border)]">
                <p className="font-semibold text-[var(--foreground)] text-lg">
                  {item.title}
                </p>
                <p className="mt-1 text-sm ui-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
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
          <div className="space-y-8 pl-2">
            {tutorReasons.map((item) => (
              <div key={item.title} className="relative pl-8 border-l border-[var(--border)]">
                <p className="font-semibold text-[var(--foreground)] text-lg">
                  {item.title}
                </p>
                <p className="mt-1 text-sm ui-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface-panel p-8 flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold tracking-widest ui-muted uppercase mb-2">
              {t("home.paths.student.kicker")}
            </p>
            <h3 className="text-xl font-bold text-[var(--foreground)] mt-2">
              {t("home.paths.student.title")}
            </h3>
            <p className="mt-2 text-sm ui-muted leading-relaxed">
              {t("home.paths.student.body")}
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/tutors/search" className="ui-btn ui-btn-primary">
              {t("home.paths.student.cta")}
            </Link>
            <Link href="/auth/login" className="ui-btn ui-btn-secondary">
              {t("home.paths.student.ctaSecondary")}
            </Link>
          </div>
        </div>

        <div className="surface-panel p-8 flex flex-col justify-between border-l-4 border-l-[var(--accent)]">
          <div>
            <p className="text-xs font-bold tracking-widest ui-muted uppercase mb-2">
              {t("home.paths.tutor.kicker")}
            </p>
            <h3 className="text-xl font-bold text-[var(--foreground)] mt-2">
              {t("home.paths.tutor.title")}
            </h3>
            <p className="mt-2 text-sm ui-muted leading-relaxed">
              {t("home.paths.tutor.body")}
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/auth/register" className="ui-btn ui-btn-primary">
              {t("home.paths.tutor.ctaPrimary")}
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
