"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageShell } from "../../_components/PageShell";
import { createJob } from "../../../lib/api";
import { parseCsv } from "../../../lib/form";
import { formatJobPostPreview } from "../../../lib/jobPreview";
import type { GenderPreference, JobPayType } from "../../../lib/types";
import { useAuth, useI18n } from "../../providers";

export default function PostJobPage() {
  const { t } = useI18n();
  const { auth } = useAuth();

  const token = auth?.accessToken ?? null;
  const isClient =
    auth?.user.role === "PARENT" || auth?.user.role === "STUDENT";

  const [form, setForm] = useState({
    title: "",
    description: "",
    subjects: "",
    location: "",
    budget: "",

    grade: "",
    sessionMinutes: "90",
    daysPerWeek: "3",
    startTime: "",
    endTime: "",
    preferredDays: "",
    genderPreference: "ANY" as GenderPreference,
    payType: "HOURLY" as JobPayType,
    hourlyAmount: "",
    monthlyAmount: "",
    fixedAmount: "",
    currency: "ETB",
  });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const helper = useMemo(() => {
    if (!auth) return t("state.loginRequired");
    if (!isClient) return "This page is for clients only.";
    return null;
  }, [auth, isClient, t]);

  const onSubmit = async () => {
    if (!token) return;
    if (
      form.title.trim().length === 0 ||
      form.description.trim().length === 0
    ) {
      setStatus("Title and description are required.");
      return;
    }

    setBusy(true);
    setStatus(null);
    try {
      const payType = form.payType;
      const currency = form.currency.trim().toUpperCase() || "ETB";
      const sessionMinutesRaw = Number(form.sessionMinutes);
      const daysPerWeekRaw = Number(form.daysPerWeek);
      const gradeRaw = form.grade.trim().length > 0 ? Number(form.grade) : null;

      const payload = {
        title: form.title,
        description: form.description,
        subjects: parseCsv(form.subjects),
        location: form.location || undefined,
        budget: form.budget.trim().length > 0 ? Number(form.budget) : undefined,

        grade:
          gradeRaw != null && Number.isFinite(gradeRaw) ? gradeRaw : undefined,
        sessionMinutes:
          Number.isFinite(sessionMinutesRaw) && sessionMinutesRaw > 0
            ? sessionMinutesRaw
            : undefined,
        daysPerWeek:
          Number.isFinite(daysPerWeekRaw) && daysPerWeekRaw > 0
            ? daysPerWeekRaw
            : undefined,
        startTime: form.startTime.trim() || undefined,
        endTime: form.endTime.trim() || undefined,
        preferredDays: parseCsv(form.preferredDays),
        genderPreference: form.genderPreference,
        payType,
        currency,
        hourlyAmount:
          payType === "HOURLY" && form.hourlyAmount.trim().length > 0
            ? Number(form.hourlyAmount)
            : undefined,
        monthlyAmount:
          payType === "MONTHLY" && form.monthlyAmount.trim().length > 0
            ? Number(form.monthlyAmount)
            : undefined,
        fixedAmount:
          payType === "FIXED" && form.fixedAmount.trim().length > 0
            ? Number(form.fixedAmount)
            : undefined,
      };

      await createJob(token, {
        ...payload,
      });
      setStatus("Job posted.");
      setForm({
        title: "",
        description: "",
        subjects: "",
        location: "",
        budget: "",

        grade: "",
        sessionMinutes: "90",
        daysPerWeek: "3",
        startTime: "",
        endTime: "",
        preferredDays: "",
        genderPreference: "ANY",
        payType: "HOURLY",
        hourlyAmount: "",
        monthlyAmount: "",
        fixedAmount: "",
        currency: "ETB",
      });
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const preview = useMemo(() => {
    const sessionMinutesRaw = Number(form.sessionMinutes);
    const daysPerWeekRaw = Number(form.daysPerWeek);
    const gradeRaw = form.grade.trim().length > 0 ? Number(form.grade) : null;

    return formatJobPostPreview({
      location: form.location || null,
      grade: gradeRaw != null && Number.isFinite(gradeRaw) ? gradeRaw : null,
      subjects: parseCsv(form.subjects),
      sessionMinutes:
        Number.isFinite(sessionMinutesRaw) && sessionMinutesRaw > 0
          ? sessionMinutesRaw
          : null,
      daysPerWeek:
        Number.isFinite(daysPerWeekRaw) && daysPerWeekRaw > 0
          ? daysPerWeekRaw
          : null,
      startTime: form.startTime.trim() || null,
      endTime: form.endTime.trim() || null,
      preferredDays: parseCsv(form.preferredDays),
      payType: form.payType,
      hourlyAmount:
        form.payType === "HOURLY" && form.hourlyAmount.trim().length > 0
          ? Number(form.hourlyAmount)
          : null,
      monthlyAmount:
        form.payType === "MONTHLY" && form.monthlyAmount.trim().length > 0
          ? Number(form.monthlyAmount)
          : null,
      fixedAmount:
        form.payType === "FIXED" && form.fixedAmount.trim().length > 0
          ? Number(form.fixedAmount)
          : null,
      genderPreference: form.genderPreference,
      currency: form.currency.trim().toUpperCase() || "ETB",
    });
  }, [form]);

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl">
        <div className="glass-panel p-8 sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">{t("nav.postJob")}</h1>
              <p className="mt-1 text-sm ui-muted">
                Post a tutor job for tutors to apply.
              </p>
            </div>
            <Link href="/jobs/mine" className="ui-btn">
              {t("nav.myJobs")}
            </Link>
          </div>

          {helper && <p className="mt-6 text-sm ui-muted">{helper}</p>}
          {status && <p className="mt-6 text-sm ui-muted">{status}</p>}

          {auth && isClient && (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <input
                  className="ui-field"
                  placeholder="Title"
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    className="ui-field"
                    placeholder="Place / Location (e.g., Bole Alem Cinema)"
                    value={form.location}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, location: e.target.value }))
                    }
                  />
                  <input
                    className="ui-field"
                    placeholder="Grade (e.g., 7)"
                    inputMode="numeric"
                    value={form.grade}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, grade: e.target.value }))
                    }
                  />
                </div>

                <textarea
                  className="ui-field"
                  rows={6}
                  placeholder="Describe what you need…"
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                />

                <input
                  className="ui-field"
                  placeholder="Subjects (comma separated)"
                  value={form.subjects}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, subjects: e.target.value }))
                  }
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    className="ui-field"
                    placeholder="Session minutes (e.g., 90)"
                    inputMode="numeric"
                    value={form.sessionMinutes}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, sessionMinutes: e.target.value }))
                    }
                  />
                  <input
                    className="ui-field"
                    placeholder="Days per week (e.g., 3)"
                    inputMode="numeric"
                    value={form.daysPerWeek}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, daysPerWeek: e.target.value }))
                    }
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    className="ui-field"
                    placeholder="Start time (e.g., 11:00)"
                    value={form.startTime}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, startTime: e.target.value }))
                    }
                  />
                  <input
                    className="ui-field"
                    placeholder="End time (e.g., 12:30)"
                    value={form.endTime}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, endTime: e.target.value }))
                    }
                  />
                </div>

                <input
                  className="ui-field"
                  placeholder="Preferred days (e.g., Monday, Wednesday, Friday)"
                  value={form.preferredDays}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, preferredDays: e.target.value }))
                  }
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm ui-muted">
                    Pay type
                    <select
                      className="ui-field mt-1"
                      value={form.payType}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          payType: e.target.value as JobPayType,
                        }))
                      }
                    >
                      <option value="HOURLY">Hourly</option>
                      <option value="MONTHLY">Monthly</option>
                      <option value="FIXED">Fixed</option>
                    </select>
                  </label>

                  <label className="block text-sm ui-muted">
                    Gender preference
                    <select
                      className="ui-field mt-1"
                      value={form.genderPreference}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          genderPreference: e.target.value as GenderPreference,
                        }))
                      }
                    >
                      <option value="ANY">Any</option>
                      <option value="FEMALE">Female</option>
                      <option value="MALE">Male</option>
                    </select>
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    className="ui-field"
                    placeholder={
                      form.payType === "HOURLY"
                        ? "Hourly amount (e.g., 300)"
                        : form.payType === "MONTHLY"
                          ? "Monthly amount"
                          : "Fixed amount"
                    }
                    inputMode="numeric"
                    value={
                      form.payType === "HOURLY"
                        ? form.hourlyAmount
                        : form.payType === "MONTHLY"
                          ? form.monthlyAmount
                          : form.fixedAmount
                    }
                    onChange={(e) =>
                      setForm((p) =>
                        p.payType === "HOURLY"
                          ? { ...p, hourlyAmount: e.target.value }
                          : p.payType === "MONTHLY"
                            ? { ...p, monthlyAmount: e.target.value }
                            : { ...p, fixedAmount: e.target.value }
                      )
                    }
                  />
                  <input
                    className="ui-field"
                    placeholder="Currency (ETB)"
                    value={form.currency}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, currency: e.target.value }))
                    }
                  />
                </div>

                <input
                  className="ui-field"
                  placeholder="Budget (optional - for fixed jobs)"
                  inputMode="numeric"
                  value={form.budget}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, budget: e.target.value }))
                  }
                />

                <button
                  type="button"
                  className="ui-btn ui-btn-primary"
                  disabled={busy}
                  onClick={onSubmit}
                >
                  {busy ? "Posting…" : "Post job"}
                </button>

                <p className="text-xs ui-muted">
                  Tip: Tutors will see the preview format too.
                </p>
              </div>

              <div className="surface-card surface-card--quiet p-6">
                <p className="text-sm font-semibold">
                  Preview (what tutors see)
                </p>
                <pre
                  className="mt-4 whitespace-pre-wrap text-sm ui-muted"
                  style={{ fontFamily: "inherit" }}
                >
                  {preview || "Fill the form to see the formatted preview."}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
