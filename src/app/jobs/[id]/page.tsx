"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageShell } from "../../_components/PageShell";
import { Pagination } from "../../_components/Pagination";
import { MessageButton } from "../../_components/StartConversationModal";
import { InterviewSchedulerModal, InterviewCard } from "../../_components/InterviewScheduler";
import { InterviewFeedbackModal } from "../../_components/InterviewFeedbackModal";
import { createClient } from "../../../lib/supabase";
import { formatJobPostPreview } from "../../../lib/jobPreview";
import type { JobPost, Proposal, Contract, Interview } from "../../../lib/types";
import { useAuth, useI18n } from "../../providers";
import { useInterviews } from "../../../hooks/useInterviews";

interface ProposalWithTutor extends Proposal {
  tutor?: { id: string; name: string; email: string; role: string };
  interview?: Interview | null;
}

export default function JobDetailForParentPage() {
  const { t } = useI18n();
  const { auth } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const { 
    createInterview, 
    updateInterview, 
    cancelInterview, 
    completeInterview,
    getInterviewByProposal 
  } = useInterviews(auth?.user.id || null);

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
  const [schedulingProposal, setSchedulingProposal] = useState<ProposalWithTutor | null>(null);
  const [reschedulingInterview, setReschedulingInterview] = useState<Interview | null>(null);
  const [feedbackInterview, setFeedbackInterview] = useState<Interview | null>(null);
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

      // Fetch job
      const { data: jobData, error: jobError } = await supabase
        .from("job_posts")
        .select("*")
        .eq("id", jobId)
        .single();

      if (jobError) throw jobError;

      // Fetch proposals
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

      // Fetch interviews for these proposals
      const proposalIds = (proposalsData || []).map((p: any) => p.id);
      const { data: interviewsData } = await supabase
        .from("interviews")
        .select(`
          *,
          parent:parent_id(id, name, avatar_url, role),
          tutor:tutor_id(id, name, avatar_url, role)
        `)
        .in("proposal_id", proposalIds)
        .order("scheduled_at", { ascending: false });

      // Create interview lookup map
      const interviewMap = new Map<string, Interview>();
      (interviewsData || []).forEach((i: any) => {
        if (!interviewMap.has(i.proposal_id)) {
          interviewMap.set(i.proposal_id, {
            id: i.id,
            proposalId: i.proposal_id,
            jobPostId: i.job_post_id,
            parentId: i.parent_id,
            tutorId: i.tutor_id,
            scheduledAt: i.scheduled_at,
            durationMinutes: i.duration_minutes,
            meetingLink: i.meeting_link,
            meetingProvider: i.meeting_provider,
            status: i.status,
            notes: i.notes,
            clientNotes: i.client_notes,
            tutorNotes: i.tutor_notes,
            rating: i.rating,
            feedback: i.feedback,
            reminderSentAt: i.reminder_sent_at,
            createdAt: i.created_at,
            updatedAt: i.updated_at,
            parent: i.parent,
            tutor: i.tutor,
          });
        }
      });

      const formattedProposals: ProposalWithTutor[] = (proposalsData || []).map((p: any) => ({
        ...p,
        tutor: p.profiles,
        interview: interviewMap.get(p.id) || null,
      }));

      setJob(jobData as any);
      setProposals(formattedProposals);
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [auth?.user.id, isClient, jobId, page]);

  const onShortlist = async (proposalId: string) => {
    if (!auth) return;
    setBusyProposalId(proposalId);
    setStatus(null);
    try {
      const { error } = await supabase
        .from("proposals")
        .update({ status: "SHORTLISTED" })
        .eq("id", proposalId);

      if (error) throw error;
      
      setProposals((prev) =>
        prev.map((p) => (p.id === proposalId ? { ...p, status: "SHORTLISTED" } : p)),
      );
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusyProposalId(null);
    }
  };

  const onDecline = async (proposalId: string) => {
    if (!auth) return;
    setBusyProposalId(proposalId);
    setStatus(null);
    try {
      const { error } = await supabase
        .from("proposals")
        .update({ status: "DECLINED" })
        .eq("id", proposalId);

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

  const handleInterviewScheduled = async (interview: Interview) => {
    // Update proposal status to SHORTLISTED if not already
    if (schedulingProposal && schedulingProposal.status === "SUBMITTED") {
      await onShortlist(schedulingProposal.id);
    }
    
    setSchedulingProposal(null);
    setReschedulingInterview(null);
    await fetchData();
  };

  const handleInterviewCompleted = async () => {
    setFeedbackInterview(null);
    await fetchData();
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      SUBMITTED: "bg-gray-500/10 text-gray-500",
      SHORTLISTED: "bg-blue-500/10 text-blue-500",
      ACCEPTED: "bg-green-500/10 text-green-500",
      DECLINED: "bg-red-500/10 text-red-500",
      WITHDRAWN: "bg-gray-500/10 text-gray-500",
    };
    return colors[status] || "bg-gray-500/10 text-gray-500";
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
                          <span className={`pill text-xs ${getStatusBadge(p.status)}`}>
                            {p.status}
                          </span>
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

                        {/* Interview Status */}
                        {p.interview && (
                          <div className="mt-4 p-3 bg-[var(--muted)]/50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                p.interview.status === 'SCHEDULED' 
                                  ? 'bg-blue-500/10 text-blue-500'
                                  : 'bg-green-500/10 text-green-500'
                              }`}>
                                Interview {p.interview.status}
                              </span>
                              <span className="text-sm text-[var(--foreground)]/60">
                                {new Date(p.interview.scheduledAt).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            {p.interview.meetingLink && (
                              <a
                                href={p.interview.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-[var(--accent)] hover:underline"
                              >
                                Join Meeting →
                              </a>
                            )}
                          </div>
                        )}

                        <div className="mt-4 flex flex-wrap gap-2">
                          {/* Message Button */}
                          {p.status !== "DECLINED" && p.status !== "WITHDRAWN" && p.tutor && (
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

                          {/* Schedule Interview Button */}
                          {p.status !== "ACCEPTED" && p.status !== "DECLINED" && p.status !== "WITHDRAWN" && p.tutor && (
                            <button
                              onClick={() => {
                                if (p.interview) {
                                  setReschedulingInterview(p.interview);
                                } else {
                                  setSchedulingProposal(p);
                                }
                              }}
                              className="ui-btn ui-btn-secondary text-sm h-9"
                              disabled={busyProposalId === p.id}
                            >
                              {p.interview ? "Reschedule" : "Schedule Interview"}
                            </button>
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
                                onClick={() => onShortlist(p.id)}
                              >
                                {busyProposalId === p.id ? "Processing…" : "Shortlist"}
                              </button>
                              <button
                                type="button"
                                className="ui-btn"
                                disabled={busyProposalId === p.id}
                                onClick={() => onDecline(p.id)}
                              >
                                {busyProposalId === p.id ? "Declining…" : "Decline"}
                              </button>
                            </>
                          )}

                          {p.status === "SHORTLISTED" && (
                            <>
                              <button
                                type="button"
                                className="ui-btn ui-btn-primary"
                                disabled={busyProposalId === p.id}
                                onClick={() => onAccept(p.id)}
                              >
                                {busyProposalId === p.id ? "Accepting…" : "Hire"}
                              </button>
                              <button
                                type="button"
                                className="ui-btn"
                                disabled={busyProposalId === p.id}
                                onClick={() => onDecline(p.id)}
                              >
                                {busyProposalId === p.id ? "Declining…" : "Decline"}
                              </button>
                            </>
                          )}

                          {/* Complete Interview Button */}
                          {p.interview && p.interview.status === 'SCHEDULED' && (
                            <button
                              onClick={() => setFeedbackInterview(p.interview!)}
                              className="ui-btn ui-btn-primary text-sm h-9 ml-auto"
                            >
                              Complete Interview
                            </button>
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

      {/* Schedule Interview Modal */}
      {schedulingProposal && schedulingProposal.tutor && (
        <InterviewSchedulerModal
          isOpen={true}
          onClose={() => setSchedulingProposal(null)}
          proposalId={schedulingProposal.id}
          tutorId={schedulingProposal.tutor.id}
          tutorName={schedulingProposal.tutor.name}
          jobPostId={job?.id || ""}
          jobTitle={job?.title || ""}
          onSuccess={handleInterviewScheduled}
        />
      )}

      {/* Reschedule Interview Modal */}
      {reschedulingInterview && (
        <InterviewSchedulerModal
          isOpen={true}
          onClose={() => setReschedulingInterview(null)}
          proposalId={reschedulingInterview.proposalId}
          tutorId={reschedulingInterview.tutorId}
          tutorName={reschedulingInterview.tutor?.name || "Tutor"}
          jobPostId={reschedulingInterview.jobPostId}
          jobTitle={job?.title || ""}
          existingInterview={reschedulingInterview}
          onSuccess={handleInterviewScheduled}
        />
      )}

      {/* Interview Feedback Modal */}
      {feedbackInterview && (
        <InterviewFeedbackModal
          isOpen={true}
          onClose={() => setFeedbackInterview(null)}
          interview={feedbackInterview}
          onSuccess={handleInterviewCompleted}
        />
      )}
    </PageShell>
  );
}
