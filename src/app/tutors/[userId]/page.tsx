"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageShell } from "../../_components/PageShell";
import { createClient } from "../../../lib/supabase";
import type { TutorProfile } from "../../../lib/types";
import { useAuth, useI18n } from "../../providers";
import { useReviews, useReviewStats } from "../../../hooks/useReviews";
import { TutorRatingSummary, ReviewCard } from "../../_components/ReviewComponents";

// Reviews Section Component
function TutorReviewsSection({ tutorId }: { tutorId: string }) {
  const { reviews, loading: reviewsLoading } = useReviews(tutorId);
  const { stats, breakdown, loading: statsLoading } = useReviewStats(tutorId);

  if (statsLoading || reviewsLoading) {
    return (
      <div className="surface-card surface-card--quiet p-5">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]" />
        </div>
      </div>
    );
  }

  if (!stats || stats.totalReviews === 0) {
    return null; // Don't show reviews section if no reviews
  }

  return (
    <div className="surface-card surface-card--quiet p-5">
      <h2 className="text-lg font-semibold mb-4">Reviews & Ratings</h2>
      
      <TutorRatingSummary stats={stats} breakdown={breakdown} />
      
      {reviews.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)]/70 uppercase tracking-wider">
            Recent Reviews
          </h3>
          {reviews.slice(0, 3).map((review) => (
            <ReviewCard key={review.id} review={review} showResponse={true} />
          ))}
          {reviews.length > 3 && (
            <p className="text-center text-sm text-[var(--foreground)]/60 py-2">
              +{reviews.length - 3} more reviews
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function TutorDetailPage() {
  const { t } = useI18n();
  const { auth } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const params = useParams();
  const userIdParam = params?.userId;
  const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;

  const [tutor, setTutor] = useState<TutorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  const [form, setForm] = useState({ subject: "", message: "" });
  const [busy, setBusy] = useState(false);

  const canRequest =
    auth?.user.role === "STUDENT" || auth?.user.role === "PARENT";

  useEffect(() => {
    if (!userId) {
      setTutor(null);
      setLoading(false);
      setStatus("Invalid tutor id");
      return;
    }

    const run = async () => {
      setLoading(true);
      setStatus(null);
      try {
        const { data, error } = await supabase
          .from("tutor_profiles")
          .select(`
            *,
            profiles!inner(id, name, avatar_url)
          `)
          .eq("user_id", userId)
          .maybeSingle();

        if (error) throw error;
        
        if (!data) {
          setStatus("Tutor profile not found");
          setLoading(false);
          return;
        }

        const tutorData: any = {
          ...data,
          name: data.profiles?.name || "Unknown",
          avatarUrl: data.profiles?.avatar_url,
          location: data.location,
        };

        setTutor(tutorData);
        setForm((prev) => ({
          ...prev,
          subject: prev.subject || tutorData.subjects?.[0] || "",
        }));
      } catch (error) {
        console.error("Error loading tutor profile:", error);
        setStatus("Failed to load tutor profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [userId, t]);

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
      const { error } = await supabase.from("lesson_requests").insert({
        tutor_id: tutor.userId,
        requester_id: auth.user.id,
        subject: form.subject.trim(),
        message: form.message.trim(),
      });

      if (error) throw error;
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

              {/* Reviews Section */}
              {userId && <TutorReviewsSection tutorId={userId} />}
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
