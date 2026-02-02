"use client";

import { BRAND_NAME, SUPPORT_EMAIL } from "../lib/brand";

import Link from "next/link";
import { PageShell } from "./_components/PageShell";
import { useI18n } from "./providers";

export default function HomePage() {
  const { t } = useI18n();

  const stats = [
    { value: t("home.stats.1.value"), label: t("home.stats.1.label") },
    { value: t("home.stats.2.value"), label: t("home.stats.2.label") },
    { value: t("home.stats.3.value"), label: t("home.stats.3.label") },
  ];

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

  const heroPreviewTags = [
    t("home.hero.preview.tags.1"),
    t("home.hero.preview.tags.2"),
    t("home.hero.preview.tags.3"),
    t("home.hero.preview.tags.4"),
  ];

  const partnerLogos = [
    t("home.partners.1"),
    t("home.partners.2"),
    t("home.partners.3"),
    t("home.partners.4"),
  ];

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

  const faqItems = [
    {
      question: t("home.faq.1.q"),
      answer: t("home.faq.1.a"),
    },
    {
      question: t("home.faq.2.q"),
      answer: t("home.faq.2.a"),
    },
    {
      question: t("home.faq.3.q"),
      answer: t("home.faq.3.a"),
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
  const partnerToneStyle = {
    color: "color-mix(in srgb, var(--foreground) 65%, transparent)",
  };

  return (
    <PageShell>
      <div className="space-y-12 lg:space-y-16">
        <section className="glass-panel relative overflow-hidden p-8 sm:p-12">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 10% 20%, rgba(255,255,255,0.16), transparent 50%), radial-gradient(circle at 80% 0%, rgba(14,165,233,0.35), transparent 45%), linear-gradient(135deg, rgba(82,95,247,0.28), rgba(2,6,23,0))",
              }}
            />
            <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-emerald-400/20 to-transparent blur-3xl" />
          </div>
          <div className="grid gap-12 lg:grid-cols-[1.18fr_0.82fr]">
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.28em]">
                {heroPreviewTags.map((tag) => (
                  <span key={tag} className="hero-chip">
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                {t("home.title")}
              </h1>
              <p className="max-w-2xl text-base leading-7 ui-muted">
                {t("home.subtitle")}
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link href="/tutors/search" className="ui-btn ui-btn-primary">
                  {t("home.cta.search")}
                </Link>
                <Link href="/tutor/profile" className="ui-btn">
                  {t("home.cta.tutor")}
                </Link>
              </div>
            </div>

            <div className="space-y-5">
              <div className="surface-card p-6">
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--foreground)" }}
                >
                  {t("home.value.title")}
                </p>
                <ul className="mt-4 space-y-4 text-sm ui-muted">
                  <li>
                    <span
                      className="font-semibold"
                      style={{ color: "var(--foreground)" }}
                    >
                      {t("home.value.1.title")}
                    </span>
                    <span className="ui-muted">
                      {" "}
                      — {t("home.value.1.body")}
                    </span>
                  </li>
                  <li>
                    <span
                      className="font-semibold"
                      style={{ color: "var(--foreground)" }}
                    >
                      {t("home.value.2.title")}
                    </span>
                    <span className="ui-muted">
                      {" "}
                      — {t("home.value.2.body")}
                    </span>
                  </li>
                  <li>
                    <span
                      className="font-semibold"
                      style={{ color: "var(--foreground)" }}
                    >
                      {t("home.value.3.title")}
                    </span>
                    <span className="ui-muted">
                      {" "}
                      — {t("home.value.3.body")}
                    </span>
                  </li>
                </ul>
              </div>
              <div className="surface-card p-6">
                <div className="flex items-center justify-between">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--foreground)" }}
                  >
                    {t("home.hero.preview.card.title")}
                  </p>
                  <span
                    className="pill text-xs"
                    style={{
                      background:
                        "color-mix(in srgb, var(--background) 70%, transparent)",
                    }}
                  >
                    {t("home.hero.preview.card.status")}
                  </span>
                </div>
                <p className="mt-3 text-sm ui-muted">
                  {t("home.hero.preview.card.body")}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href="/tutors/search" className="ui-btn ui-btn-primary">
                    {t("home.cta.search")}
                  </Link>
                  <Link href="/auth/register" className="ui-btn">
                    {t("home.cta.tutor")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

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
          <div
            className="grid gap-4 pt-6 md:grid-cols-3"
            style={borderTopStyle}
          >
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

        <section className="section-shell space-y-10">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] ui-muted">
                {t("home.paths.student.kicker")}
              </p>
              <h2
                className="mt-2 text-2xl font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                {t("home.reasons.students.title")}
              </h2>
              <p className="mt-2 text-sm ui-muted">
                {t("home.reasons.students.body")}
              </p>
              <div className="mt-8 space-y-5">
                {studentReasons.map((item) => (
                  <div key={item.title} className="relative pl-6">
                    <span
                      className="absolute left-0 top-1 h-full w-px"
                      style={timelineLineStyle}
                    />
                    <p
                      className="font-semibold"
                      style={{ color: "var(--foreground)" }}
                    >
                      {item.title}
                    </p>
                    <p className="text-sm ui-muted">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold tracking-[0.16em] ui-muted">
                {t("home.paths.tutor.kicker")}
              </p>
              <h2
                className="mt-2 text-2xl font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                {t("home.reasons.tutors.title")}
              </h2>
              <p className="mt-2 text-sm ui-muted">
                {t("home.reasons.tutors.body")}
              </p>
              <div className="mt-8 space-y-5">
                {tutorReasons.map((item) => (
                  <div key={item.title} className="relative pl-6">
                    <span
                      className="absolute left-0 top-1 h-full w-px"
                      style={timelineLineStyle}
                    />
                    <p
                      className="font-semibold"
                      style={{ color: "var(--foreground)" }}
                    >
                      {item.title}
                    </p>
                    <p className="text-sm ui-muted">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="surface-card p-6">
              <p className="text-xs font-semibold tracking-[0.16em] ui-muted">
                {t("home.paths.student.kicker")}
              </p>
              <p
                className="mt-2 text-lg font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                {t("home.paths.student.title")}
              </p>
              <p className="text-sm ui-muted">{t("home.paths.student.body")}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/tutors/search" className="ui-btn ui-btn-primary">
                  {t("home.paths.student.cta")}
                </Link>
                <Link href="/auth/login" className="ui-btn">
                  {t("home.paths.student.ctaSecondary")}
                </Link>
              </div>
            </div>
            <div className="surface-card surface-card--accent p-6">
              <p className="text-xs font-semibold tracking-[0.16em] ui-muted">
                {t("home.paths.tutor.kicker")}
              </p>
              <p
                className="mt-2 text-lg font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                {t("home.paths.tutor.title")}
              </p>
              <p className="text-sm ui-muted">{t("home.paths.tutor.body")}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/auth/register" className="ui-btn ui-btn-primary">
                  {t("home.paths.tutor.ctaPrimary")}
                </Link>
                <Link href="/tutor/profile" className="ui-btn">
                  {t("home.paths.tutor.ctaSecondary")}
                </Link>
              </div>
            </div>
          </div>
        </section>

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

        <section className="section-shell section-shell--tonal">
          <div className="flex flex-col gap-2">
            <h2
              className="text-2xl font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              {t("home.faq.title")}
            </h2>
            <p className="text-sm ui-muted">{t("home.faq.subtitle")}</p>
          </div>
          <div className="mt-6">
            {faqItems.map((item, index) => (
              <details
                key={item.question}
                className="py-4 transition"
                style={index === 0 ? undefined : borderTopStyle}
              >
                <summary
                  className="cursor-pointer text-lg font-semibold"
                  style={{ color: "var(--foreground)" }}
                >
                  {item.question}
                </summary>
                <p className="mt-3 text-sm ui-muted">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <footer className="section-shell section-shell--tonal text-sm">
          <div className="grid gap-6 md:grid-cols-[1.5fr_1fr_1fr]">
            <div>
              <p
                className="text-lg font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                {BRAND_NAME}
              </p>
              <p className="mt-2 text-sm ui-muted">{t("home.footer.copy")}</p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] ui-muted">
                {t("home.footer.contact")}
              </p>
              <div className="mt-3 space-y-1">
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="block underline-offset-4 hover:underline"
                >
                  {t("home.footer.email")}
                </a>
                <a
                  href="tel:+251110000000"
                  className="block underline-offset-4 hover:underline"
                >
                  {t("home.footer.phone")}
                </a>
                <Link
                  href="/support"
                  className="underline-offset-4 hover:underline"
                >
                  {t("home.footer.support")}
                </Link>
              </div>
            </div>
            <div className="space-y-1">
              <Link
                href="/tutors/search"
                className="block underline-offset-4 hover:underline"
              >
                {t("home.footer.links.search")}
              </Link>
              <Link
                href="/tutor/profile"
                className="block underline-offset-4 hover:underline"
              >
                {t("home.footer.links.profile")}
              </Link>
              <Link
                href="/auth/login"
                className="block underline-offset-4 hover:underline"
              >
                {t("home.footer.links.login")}
              </Link>
              <Link
                href="/privacy"
                className="block underline-offset-4 hover:underline"
              >
                {t("home.footer.privacy")}
              </Link>
              <Link
                href="/terms"
                className="block underline-offset-4 hover:underline"
              >
                {t("home.footer.terms")}
              </Link>
            </div>
          </div>
          <div className="mt-6 pt-4 text-xs ui-muted" style={borderTopStyle}>
            © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
          </div>
        </footer>
      </div>
    </PageShell>
  );
}
