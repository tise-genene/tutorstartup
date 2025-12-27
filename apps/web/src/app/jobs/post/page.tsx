"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageShell } from "../../_components/PageShell";
import { createJob } from "../../../lib/api";
import { parseCsv } from "../../../lib/form";
import { useAuth, useI18n } from "../../providers";

export default function PostJobPage() {
  const { t } = useI18n();
  const { auth } = useAuth();

  const token = auth?.accessToken ?? null;
  const isParent = auth?.user.role === "PARENT";

  const [form, setForm] = useState({
    title: "",
    description: "",
    subjects: "",
    location: "",
    budget: "",
  });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const helper = useMemo(() => {
    if (!auth) return t("state.loginRequired");
    if (!isParent) return "This page is for parents only.";
    return null;
  }, [auth, isParent, t]);

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
      await createJob(token, {
        title: form.title,
        description: form.description,
        subjects: parseCsv(form.subjects),
        location: form.location || undefined,
        budget: form.budget.trim().length > 0 ? Number(form.budget) : undefined,
      });
      setStatus("Job posted.");
      setForm({
        title: "",
        description: "",
        subjects: "",
        location: "",
        budget: "",
      });
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

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

          {auth && isParent && (
            <div className="mt-6 space-y-3">
              <input
                className="ui-field"
                placeholder="Title"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
              />
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
                  placeholder="Location"
                  value={form.location}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, location: e.target.value }))
                  }
                />
                <input
                  className="ui-field"
                  placeholder="Budget (number)"
                  inputMode="numeric"
                  value={form.budget}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, budget: e.target.value }))
                  }
                />
              </div>

              <button
                type="button"
                className="ui-btn ui-btn-primary"
                disabled={busy}
                onClick={onSubmit}
              >
                {busy ? "Posting…" : "Post job"}
              </button>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
