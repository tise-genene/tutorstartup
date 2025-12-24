"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { PageShell } from "../../_components/PageShell";
import { fetchTutorProfile, upsertTutorProfile } from "../../../lib/api";
import type { TutorProfile } from "../../../lib/types";
import { parseCsv, parseNumber, upsertCsv } from "../../../lib/form";
import { useAuth, useI18n } from "../../providers";

const subjectLibrary = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Writing",
  "SAT Prep",
];

export default function TutorProfilePage() {
  const { t } = useI18n();
  const { auth } = useAuth();

  const token = auth?.accessToken ?? null;
  const isTutor = auth?.user.role === "TUTOR";

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [profile, setProfile] = useState<TutorProfile | null>(null);
  const [form, setForm] = useState({
    bio: "",
    subjects: "",
    languages: "",
    hourlyRate: "",
    location: "",
  });

  const canEdit = Boolean(token && isTutor);

  useEffect(() => {
    const run = async () => {
      if (!token || !isTutor) return;
      setStatus(null);
      try {
        const response = await fetchTutorProfile(token);
        setProfile(response);
        setForm({
          bio: response.bio ?? "",
          subjects: response.subjects.join(", "),
          languages: response.languages.join(", "),
          hourlyRate: response.hourlyRate?.toString() ?? "",
          location: response.location ?? "",
        });
      } catch (error) {
        setStatus((error as Error).message);
      }
    };

    void run();
  }, [token, isTutor]);

  const helper = useMemo(() => {
    if (!auth) return t("profile.guard.login");
    if (!isTutor) return t("profile.guard.tutorOnly");
    return null;
  }, [auth, isTutor, t]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !isTutor) return;

    setBusy(true);
    setStatus(null);

    try {
      const payload = {
        bio: form.bio.trim() || undefined,
        subjects: parseCsv(form.subjects),
        languages: parseCsv(form.languages),
        hourlyRate: parseNumber(form.hourlyRate),
        location: form.location.trim() || undefined,
      };

      const updated = await upsertTutorProfile(token, payload);
      setProfile(updated);
      setStatus(t("profile.saved"));
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl glass-panel p-8 sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{t("profile.title")}</h1>
            <p className="mt-1 text-sm ui-muted">{t("profile.subtitle")}</p>
          </div>

          {!canEdit && (
            <Link
              href={auth ? "/tutors/search" : "/auth/login"}
              className="ui-btn"
            >
              {auth
                ? t("profile.guard.cta.search")
                : t("profile.guard.cta.login")}
            </Link>
          )}
        </div>

        {helper && <p className="mt-6 text-sm ui-muted">{helper}</p>}

        {canEdit && (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <textarea
              className="ui-field h-28"
              placeholder={t("profile.bio")}
              value={form.bio}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, bio: event.target.value }))
              }
            />

            <input
              className="ui-field"
              placeholder={t("profile.subjects")}
              value={form.subjects}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, subjects: event.target.value }))
              }
            />

            <div className="flex flex-wrap gap-2">
              {subjectLibrary.map((subject) => (
                <button
                  key={subject}
                  type="button"
                  className="ui-btn rounded-full px-3 py-1 text-xs"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      subjects: upsertCsv(prev.subjects, subject),
                    }))
                  }
                >
                  {subject}
                </button>
              ))}
            </div>

            <input
              className="ui-field"
              placeholder={t("profile.languages")}
              value={form.languages}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, languages: event.target.value }))
              }
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <input
                className="ui-field"
                placeholder={t("profile.hourlyRate")}
                value={form.hourlyRate}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    hourlyRate: event.target.value,
                  }))
                }
              />

              <input
                className="ui-field"
                placeholder={t("profile.location")}
                value={form.location}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, location: event.target.value }))
                }
              />
            </div>

            <button
              className="ui-btn ui-btn-primary ui-btn-block disabled:opacity-50"
              disabled={busy}
            >
              {busy ? t("common.loading") : t("profile.save")}
            </button>

            {status && <p className="text-sm ui-muted">{status}</p>}
          </form>
        )}

        {profile && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
            <p className="ui-muted">
              {t("profile.lastUpdated")}:{" "}
              {new Date(profile.updatedAt).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
