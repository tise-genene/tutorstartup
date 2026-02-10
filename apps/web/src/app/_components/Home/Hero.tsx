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
                <span className="ui-muted"> — {t("home.value.1.body")}</span>
              </li>
              <li>
                <span
                  className="font-semibold"
                  style={{ color: "var(--foreground)" }}
                >
                  {t("home.value.2.title")}
                </span>
                <span className="ui-muted"> — {t("home.value.2.body")}</span>
              </li>
              <li>
                <span
                  className="font-semibold"
                  style={{ color: "var(--foreground)" }}
                >
                  {t("home.value.3.title")}
                </span>
                <span className="ui-muted"> — {t("home.value.3.body")}</span>
              </li>
            </ul>
          </div>
          <div className="surface-card p-6">
            <div className="items-center justify-between flex">
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
  );
}
