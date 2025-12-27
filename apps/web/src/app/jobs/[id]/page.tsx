"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageShell } from "../../_components/PageShell";
import { fetchJobById, fetchJobProposals } from "../../../lib/api";
import type { JobPost, Proposal } from "../../../lib/types";
import { useAuth, useI18n } from "../../providers";

type ProposalWithTutor = Proposal & {
  tutor?: { id: string; name: string; email: string; role: string };
};

export default function JobDetailForParentPage() {
  const { t } = useI18n();
  const { auth } = useAuth();

  const params = useParams();
  const idParam = params?.id;
  const jobId = Array.isArray(idParam) ? idParam[0] : idParam;

  const token = auth?.accessToken ?? null;
  const isParent = auth?.user.role === "PARENT";

  const [job, setJob] = useState<JobPost | null>(null);
  const [proposals, setProposals] = useState<ProposalWithTutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  const helper = useMemo(() => {
    if (!auth) return t("state.loginRequired");
    if (!isParent) return "This page is for parents only.";
    if (!jobId) return "Invalid job id";
    return null;
  }, [auth, isParent, jobId, t]);

  useEffect(() => {
    const run = async () => {
      if (!token || !isParent || !jobId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setStatus(null);
      try {
        const [loadedJob, loadedProposals] = await Promise.all([
          fetchJobById(token, jobId),
          fetchJobProposals(token, jobId),
        ]);
        setJob(loadedJob);
        setProposals(loadedProposals);
      } catch (e) {
        setStatus((e as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [token, isParent, jobId]);

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl">
        <div className="glass-panel p-8 sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">{t("nav.jobs")}</h1>
              <p className="mt-1 text-sm ui-muted">
                Review proposals from tutors.
              </p>
            </div>
            <Link href="/jobs/mine" className="ui-btn">
              Back
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
                  Proposals
                </h2>
                {proposals.length === 0 ? (
                  <p className="mt-3 text-sm ui-muted">No proposals yet.</p>
                ) : (
                  <div className="mt-4 space-y-4">
                    {proposals.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-2xl border p-4"
                        style={{ borderColor: "var(--divider)" }}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="text-sm ui-muted">Tutor</p>
                            <p
                              className="mt-1 font-semibold"
                              style={{ color: "var(--foreground)" }}
                            >
                              {p.tutor?.name ?? p.tutorId}
                            </p>
                            {p.tutor?.email && (
                              <p className="mt-1 text-sm ui-muted">
                                {p.tutor.email}
                              </p>
                            )}
                          </div>
                          <span className="pill text-xs">{p.status}</span>
                        </div>
                        <p
                          className="mt-3 text-sm ui-muted"
                          style={{ whiteSpace: "pre-wrap" }}
                        >
                          {p.message}
                        </p>
                        {(p.fileUrl || p.videoUrl) && (
                          <div className="mt-3 flex flex-col gap-1">
                            {p.fileUrl && (
                              <a
                                className="text-sm underline opacity-85 hover:opacity-100"
                                href={p.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                File link
                              </a>
                            )}
                            {p.videoUrl && (
                              <a
                                className="text-sm underline opacity-85 hover:opacity-100"
                                href={p.videoUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Video link
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
