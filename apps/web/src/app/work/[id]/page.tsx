"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageShell } from "../../_components/PageShell";
import { fetchJobById, submitProposal } from "../../../lib/api";
import type { JobPost } from "../../../lib/types";
import { useAuth, useI18n } from "../../providers";

export default function WorkJobDetailPage() {
  const { t } = useI18n();
  const { auth } = useAuth();

  const params = useParams();
  const idParam = params?.id;
  const jobId = Array.isArray(idParam) ? idParam[0] : idParam;

  const token = auth?.accessToken ?? null;
  const isTutor = auth?.user.role === "TUTOR";

  const [job, setJob] = useState<JobPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({ message: "", fileUrl: "", videoUrl: "" });

  const helper = useMemo(() => {
    if (!auth) return t("state.loginRequired");
    if (!isTutor) return t("state.tutorOnly");
    if (!jobId) return "Invalid job id";
    return null;
  }, [auth, isTutor, jobId, t]);

  useEffect(() => {
    const run = async () => {
      if (!token || !isTutor || !jobId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setStatus(null);
      try {
        const loaded = await fetchJobById(token, jobId);
        setJob(loaded);
      } catch (e) {
        setStatus((e as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [token, isTutor, jobId]);

  const onSubmit = async () => {
    if (!token || !jobId) return;
    if (form.message.trim().length === 0) {
      setStatus("Message is required");
      return;
    }

    setBusy(true);
    setStatus(null);
    try {
      await submitProposal(token, jobId, {
        message: form.message,
        fileUrl: form.fileUrl || undefined,
        videoUrl: form.videoUrl || undefined,
      });
      setStatus("Proposal sent.");
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
              <h1 className="text-2xl font-semibold">Job details</h1>
              <p className="mt-1 text-sm ui-muted">
                Send a proposal to the parent.
              </p>
            </div>
            <Link href="/work" className="ui-btn">
              Back to jobs
            </Link>
          </div>

          {helper && <p className="mt-6 text-sm ui-muted">{helper}</p>}
          {status && <p className="mt-6 text-sm ui-muted">{status}</p>}
          {loading && (
            <p className="mt-6 text-sm ui-muted">{t("common.loading")}</p>
          )}

          {!loading && job && (
            <div className="mt-6 space-y-6">
              <div className="surface-card surface-card--quiet p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p
                      className="text-lg font-semibold"
                      style={{ color: "var(--foreground)" }}
                    >
                      {job.title}
                    </p>
                    <p className="mt-1 text-sm ui-muted">
                      {(job.location ?? "") || "Remote/unspecified"}
                      {job.budget != null ? ` • Budget: ${job.budget}` : ""}
                    </p>
                  </div>
                  <span className="pill text-xs">{job.status}</span>
                </div>

                {job.subjects.length > 0 && (
                  <p className="mt-3 text-sm ui-muted">
                    Subjects: {job.subjects.join(", ")}
                  </p>
                )}

                <p
                  className="mt-3 text-sm ui-muted"
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {job.description}
                </p>
              </div>

              <div className="surface-card surface-card--quiet p-5">
                <h2
                  className="text-lg font-semibold"
                  style={{ color: "var(--foreground)" }}
                >
                  Your proposal
                </h2>
                <p className="mt-1 text-sm ui-muted">
                  Include a message and optionally a file/video link.
                </p>

                <div className="mt-4 space-y-3">
                  <textarea
                    className="ui-field"
                    rows={6}
                    placeholder="Write your proposal message…"
                    value={form.message}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, message: e.target.value }))
                    }
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      className="ui-field"
                      placeholder="File link (https://...)"
                      value={form.fileUrl}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, fileUrl: e.target.value }))
                      }
                    />
                    <input
                      className="ui-field"
                      placeholder="Video link (https://...)"
                      value={form.videoUrl}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, videoUrl: e.target.value }))
                      }
                    />
                  </div>

                  <button
                    type="button"
                    className="ui-btn ui-btn-primary"
                    disabled={busy}
                    onClick={onSubmit}
                  >
                    {busy ? "Sending…" : "Send proposal"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
