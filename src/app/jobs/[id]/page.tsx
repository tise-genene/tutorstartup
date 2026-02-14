"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageShell } from "../../_components/PageShell";
import { Pagination } from "../../_components/Pagination";
import { MessageButton } from "../../_components/StartConversationModal";
import { createClient } from "../../../lib/supabase";
import { formatJobPostPreview } from "../../../lib/jobPreview";
import type { JobPost, Proposal, Contract } from "../../../lib/types";
import { useAuth, useI18n } from "../../providers";

interface ProposalWithTutor extends Proposal {
  tutor?: { id: string; name: string; email: string; role: string };
}

export default function JobDetailForParentPage() {
  const { t } = useI18n();
  const { auth } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const params = useParams();
  const idParam = params?.id;
  const jobId = Array.isArray(idParam) ? idParam[0] : idParam;

  const isClient =
    auth?.user.role === "PARENT" || auth?.user.role === "STUDENT";

  const [job, setJob] = useState<JobPost | null>(null);
  const [proposals, setProposals] = useState<ProposalWithTutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyProposalId, setBusyProposalId] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const LIMIT = 10;

  const helper = useMemo(() => {
    if (!auth) return t("state.loginRequired");
    if (!isClient) return "This page is for clients only.";
    if (!jobId) return "Invalid job id";
    return null;
  }, [auth, isClient, jobId, t]);

  const preview = useMemo(() => {
    if (!job) return "";
    return formatJobPostPreview(job);
  }, [job]);

  const fetchData = async () => {
    if (!auth || !isClient || !jobId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      const offset = (page - 1) * LIMIT;

      const { data: jobData, error: jobError } = await supabase
        .from("job_posts")
        .select("*")
        .eq("id", jobId)
        .single();

      if (jobError) throw jobError;

      const { data: proposalsData, error: proposalsError } = await supabase
        .from("proposals")
        .select(`
          *,
          profiles:tutor_id (
            id,
            name,
            email,
            role
          )
        `)
        .eq("job_post_id", jobId)
        .order("created_at", { ascending: false })
        .range(offset, offset + LIMIT - 1);

      if (proposalsError) throw proposalsError;

      setJob(jobData as any);
      setProposals((proposalsData || []).map((p: any) => ({
        ...p,
        tutor: p.profiles,
      })));
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [auth?.user.id, isClient, jobId, page]);

  const onDecline = async (proposalId: string) => {
    if (!auth) return;
    setBusyProposalId(proposalId);
    setStatus(null);
    try {
      const { data, error } = await supabase
        .from("proposals")
        .update({ status: "DECLINED" })
        .eq("id", proposalId)
        .select()
        .single();

      if (error) throw error;
      setProposals((prev) =>
        prev.map((p) => (p.id === proposalId ? { ...p, status: "DECLINED" } : p)),
      );
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusyProposalId(null);
    }
  };

  const onAccept = async (proposalId: string) => {
    if (!auth || !job) return;
    setBusyProposalId(proposalId);
    setStatus(null);
    try {
      const { data: proposal, error: pError } = await supabase
        .from("proposals")
        .update({ status: "ACCEPTED" })
        .eq("id", proposalId)
        .select()
        .single();

      if (pError) throw pError;

      const { data: contract, error: cError } = await supabase
        .from("contracts")
        .insert({
          job_post_id: job.id,
          proposal_id: proposalId,
          parent_id: auth.user.id,
          tutor_id: proposal.tutor_id,
          amount: job.budget || 0,
          currency: job.currency || "ETB",
          status: "ACTIVE",
        })
        .select()
        .single();

      if (cError) throw cError;

      setProposals((prev) =>
        prev.map((p) =>
          p.id === proposalId
            ? { ...p, status: "ACCEPTED", contractId: contract.id }
            : p,
        ),
      );
      window.location.href = `/contracts/${contract.id}`;
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusyProposalId(null);
    }
  };

  const onCloseJob = async () => {
    if (!auth || !jobId) return;
    setClosing(true);
    setStatus(null);
    try {
      const { data, error } = await supabase
        .from("job_posts")
        .update({ status: "CLOSED" })
        .eq("id", jobId)
        .select()
        .single();

      if (error) throw error;
      setJob(data as any);
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setClosing(false);
    }
  };

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

                {job.status === "OPEN" && (
                  <div className="mt-4">
                    <button
                      type="button"
                      className="ui-btn"
                      disabled={closing}
                      onClick={onCloseJob}
                    >
                      {closing ? "Closing…" : "Close job"}
                    </button>
                  </div>
                )}
                {job.subjects.length > 0 && (
                  <p className="mt-3 text-sm ui-muted">
                    Subjects: {job.subjects.join(", ")}
                  </p>
                )}

                {preview && (
                  <p
                    className="mt-3 text-sm ui-muted"
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {preview}
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
                  Proposals ({proposals.length})
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

                        <div className="mt-4 flex flex-wrap gap-2">
                          {/* Message Button - Always available for submitted proposals */}
                          {p.status === "SUBMITTED" && p.tutor && (
                            <MessageButton
                              tutorId={p.tutor.id}
                              tutorName={p.tutor.name}
                              jobPostId={job.id}
                              jobTitle={job.title}
                              proposalId={p.id}
                              variant="secondary"
                              size="sm"
                            />
                          )}

                          {p.status === "ACCEPTED" && p.contractId && (
                            <Link
                              className="ui-btn ui-btn-primary"
                              href={`/contracts/${p.contractId}`}
                            >
                              Open contract
                            </Link>
                          )}

                          {p.status === "SUBMITTED" && (
                            <>
                              <button
                                type="button"
                                className="ui-btn ui-btn-primary"
                                disabled={busyProposalId === p.id}
                                onClick={() => onAccept(p.id)}
                              >
                                {busyProposalId === p.id
                                  ? "Accepting…"
                                  : "Accept"}
                              </button>
                              <button
                                type="button"
                                className="ui-btn"
                                disabled={busyProposalId === p.id}
                                onClick={() => onDecline(p.id)}
                              >
                                {busyProposalId === p.id
                                  ? "Declining…"
                                  : "Decline"}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!loading && isClient && proposals.length > 0 && (
                  <Pagination
                    page={page}
                    onPageChange={setPage}
                    hasMore={proposals.length === LIMIT}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
