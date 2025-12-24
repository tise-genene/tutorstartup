"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { PageShell } from "../../_components/PageShell";
import { createLessonRequest, fetchTutorByUserId } from "../../../lib/api";
import type { TutorProfile } from "../../../lib/types";
import { useAuth, useI18n } from "../../providers";

export default function TutorDetailPage({
  params,
}: {
  params: { userId: string };
}) {
  const { t } = useI18n();
  const { auth } = useAuth();

  const [tutor, setTutor] = useState<TutorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  const [form, setForm] = useState({ subject: "", message: "" });
  const [busy, setBusy] = useState(false);

  const canRequest =
    auth?.user.role === "STUDENT" || auth?.user.role === "PARENT";

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setStatus(null);
      try {
        const response = await fetchTutorByUserId(params.userId);
        setTutor(response);
        setForm((prev) => ({
          ...prev,
          subject: prev.subject || response.subjects?.[0] || "",
        }));
      } catch (error) {
        setStatus((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [params.userId]);

  const title = useMemo(() => {
    if (tutor?.name) return tutor.name;
    return t("tutor.detail.title");
  }, [tutor?.name, t]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!auth || !tutor) return;
    if (!canRequest) {
      setStatus(t("lesson.guard.studentParentOnly"));
      return;
    }

    setBusy(true);
    setStatus(null);

    try {
      await createLessonRequest(auth.accessToken, {
        tutorUserId: tutor.userId,
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      setStatus(t("lesson.sent"));
      setForm((prev) => ({ ...prev, message: "" }));
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell>
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="glass-panel p-8 sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] ui-muted">
                {t("tutor.detail.kicker")}
              </p>
              <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
              {tutor?.location && (
                <p className="mt-1 text-sm ui-muted">{tutor.location}</p>
              )}
            </div>
            <Link href="/tutors/search" className="ui-btn">
              {t("tutor.detail.back")}
            </Link>
          </div>

          {loading && (
            <p className="mt-6 text-sm ui-muted">{t("common.loading")}</p>
          )}

          {!loading && tutor && (
            <div className="mt-6 space-y-6">
              <div className="surface-card surface-card--quiet p-5">
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--foreground)" }}
                >
                  {t("tutor.detail.about")}
                </p>
                <p className="mt-2 text-sm ui-muted">
                  {tutor.bio || t("tutor.detail.noBio")}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="surface-card surface-card--quiet p-5">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--foreground)" }}
                  >
                    {t("tutor.detail.subjects")}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(tutor.subjects ?? []).map((subject) => (
                      <span key={subject} className="hero-chip text-xs">
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="surface-card surface-card--quiet p-5">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--foreground)" }}
                  >
                    {t("tutor.detail.languages")}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(tutor.languages ?? []).map((lang) => (
                      <span key={lang} className="hero-chip text-xs">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="surface-card surface-card--quiet p-5">
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--foreground)" }}
                >
                  {t("tutor.detail.rate")}
                </p>
                <p className="mt-2 text-sm ui-muted">
                  {tutor.hourlyRate
                    ? `$${tutor.hourlyRate}/hr`
                    : t("search.customRate")}
                </p>
              </div>
            </div>
          )}

          {status && <p className="mt-6 text-sm ui-muted">{status}</p>}
        </div>

        <div className="glass-panel p-8 sm:p-10 lg:sticky lg:top-28 lg:self-start">
          <h2 className="text-lg font-semibold">{t("lesson.request.title")}</h2>
          <p className="mt-1 text-sm ui-muted">
            {t("lesson.request.subtitle")}
          </p>

          {!auth && (
            <div className="mt-6 space-y-3">
              <p className="text-sm ui-muted">{t("lesson.guard.login")}</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/auth/login" className="ui-btn ui-btn-primary">
                  {t("lesson.guard.cta.login")}
                </Link>
                <Link href="/auth/register" className="ui-btn">
                  {t("lesson.guard.cta.register")}
                </Link>
              </div>
            </div>
          )}

          {auth && (
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              {!canRequest && (
                <p className="text-sm ui-muted">
                  {t("lesson.guard.studentParentOnly")}
                </p>
              )}
              <input
                className="ui-field"
                placeholder={t("lesson.request.subject")}
                value={form.subject}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, subject: event.target.value }))
                }
                required
                maxLength={120}
                disabled={!canRequest || busy}
              />
              <textarea
                className="ui-field h-28"
                placeholder={t("lesson.request.message")}
                value={form.message}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, message: event.target.value }))
                }
                required
                maxLength={2000}
                disabled={!canRequest || busy}
              />
              <button
                className="ui-btn ui-btn-primary ui-btn-block disabled:opacity-50"
                disabled={!canRequest || busy || !tutor}
              >
                {busy ? t("common.loading") : t("lesson.request.submit")}
              </button>
            </form>
          )}
        </div>
      </div>
    </PageShell>
  );
}
