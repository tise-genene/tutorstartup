"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "../_components/PageShell";
import { fetchMyContracts, fetchMyJobs } from "../../lib/api";
import type { Contract, JobPost } from "../../lib/types";
import { useAuth } from "../providers";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const { auth } = useAuth();

  const token = auth?.accessToken ?? null;
  const role = auth?.user.role ?? null;
  const isTutor = role === "TUTOR";
  const isClient = role === "PARENT" || role === "STUDENT";

  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) return;
    if (isTutor) router.replace("/work");
  }, [auth, isTutor, router]);

  useEffect(() => {
    const run = async () => {
      if (!token || !isClient) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setStatus(null);
      try {
        const [myJobs, myContracts] = await Promise.all([
          fetchMyJobs(token),
          fetchMyContracts(token),
        ]);
        setJobs(myJobs);
        setContracts(myContracts);
      } catch (e) {
        setStatus((e as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [token, isClient]);

  const helper = useMemo(() => {
    if (!auth) return "Please log in to continue.";
    if (!isClient && !isTutor)
      return "Dashboard is not available for this role.";
    return null;
  }, [auth, isClient, isTutor]);

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl">
        <div className="glass-panel p-8 sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Dashboard</h1>
              <p className="mt-1 text-sm ui-muted">
                Post a job, review proposals, and manage contracts.
              </p>
            </div>
            <Link href="/tutors/search" className="ui-btn">
              Browse talent
            </Link>
          </div>

          {helper && <p className="mt-6 text-sm ui-muted">{helper}</p>}
          {status && <p className="mt-6 text-sm ui-muted">{status}</p>}
          {loading && auth && isClient && (
            <p className="mt-6 text-sm ui-muted">Loading…</p>
          )}

          {auth && isClient && !loading && (
            <>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <Link
                  href="/jobs/post"
                  className="surface-card surface-card--quiet block p-6"
                >
                  <p className="text-lg font-semibold">Post a job</p>
                  <p className="mt-1 text-sm ui-muted">
                    Describe what you need and receive proposals.
                  </p>
                </Link>

                <Link
                  href="/tutors/search"
                  className="surface-card surface-card--quiet block p-6"
                >
                  <p className="text-lg font-semibold">Browse talent</p>
                  <p className="mt-1 text-sm ui-muted">
                    Review profiles and send a request to get started.
                  </p>
                </Link>

                <Link
                  href="/jobs/mine"
                  className="surface-card surface-card--quiet block p-6"
                >
                  <p className="text-lg font-semibold">My jobs</p>
                  <p className="mt-1 text-sm ui-muted">
                    Track your posts, proposals, and status.
                  </p>
                </Link>
              </div>

              <div className="mt-10 grid gap-6 lg:grid-cols-2">
                <div className="surface-card surface-card--quiet p-6">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">Recent job posts</p>
                    <Link href="/jobs/mine" className="ui-btn">
                      View all
                    </Link>
                  </div>

                  {jobs.length === 0 ? (
                    <p className="mt-4 text-sm ui-muted">No job posts yet.</p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {jobs.slice(0, 3).map((job) => (
                        <Link
                          key={job.id}
                          href={`/jobs/${job.id}`}
                          className="block rounded-2xl border px-4 py-3"
                          style={{ borderColor: "var(--divider)" }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold">{job.title}</p>
                              <p className="mt-1 text-xs ui-muted">
                                {(job.location ?? "") || "Remote/unspecified"}
                                {job.budget != null
                                  ? ` • Budget: ${job.budget}`
                                  : ""}
                              </p>
                            </div>
                            <span className="pill text-xs">{job.status}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div className="surface-card surface-card--quiet p-6">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">Recent contracts</p>
                    <Link href="/contracts" className="ui-btn">
                      View all
                    </Link>
                  </div>

                  {contracts.length === 0 ? (
                    <p className="mt-4 text-sm ui-muted">No contracts yet.</p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {contracts.slice(0, 3).map((c) => (
                        <Link
                          key={c.id}
                          href={`/contracts/${c.id}`}
                          className="block rounded-2xl border px-4 py-3"
                          style={{ borderColor: "var(--divider)" }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold">
                                {c.jobPost?.title ?? "Contract"}
                              </p>
                              <p className="mt-1 text-xs ui-muted">
                                {c.amount != null
                                  ? `${c.amount} ${c.currency ?? ""}`
                                  : ""}
                              </p>
                            </div>
                            <span className="pill text-xs">{c.status}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}
