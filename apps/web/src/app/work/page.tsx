"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageShell } from "../_components/PageShell";
import { Pagination } from "../_components/Pagination";
import { fetchOpenJobs } from "../../lib/api";
import type { JobPost } from "../../lib/types";
import { useAuth, useI18n } from "../providers";

export default function WorkPage() {
  const { t } = useI18n();
  const { auth } = useAuth();

  const token = auth?.accessToken ?? null;
  const isTutor = auth?.user.role === "TUTOR";

  const [items, setItems] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const LIMIT = 10;

  useEffect(() => {
    const run = async () => {
      if (!token || !isTutor) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setStatus(null);
      try {
        const jobs = await fetchOpenJobs(token, { page, limit: LIMIT });
        setItems(jobs);
      } catch (e) {
        setStatus((e as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [token, isTutor, page]);

  const helper = !auth
    ? t("state.loginRequired")
    : !isTutor
      ? t("state.tutorOnly")
      : null;

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl">
        <div className="glass-panel p-8 sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">{t("nav.findWork")}</h1>
              <p className="mt-1 text-sm ui-muted">
                Browse tutor job posts from clients.
              </p>
            </div>
            {auth && isTutor && (
              <Link href="/work/proposals" className="ui-btn">
                {t("nav.proposals")}
              </Link>
            )}
          </div>

          {helper && <p className="mt-6 text-sm ui-muted">{helper}</p>}
          {status && <p className="mt-6 text-sm ui-muted">{status}</p>}
          {loading && (
            <p className="mt-6 text-sm ui-muted">{t("common.loading")}</p>
          )}

          {!loading && isTutor && items.length === 0 && (
            <p className="mt-6 text-sm ui-muted">No open jobs yet.</p>
          )}

          {!loading && isTutor && items.length > 0 && (
            <div className="mt-6 space-y-4">
              {items.map((job) => (
                <Link
                  key={job.id}
                  href={`/work/${job.id}`}
                  className="surface-card surface-card--quiet block p-5"
                >
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
                    {job.description.length > 260
                      ? `${job.description.slice(0, 260)}…`
                      : job.description}
                  </p>
                </Link>
              ))}
            </div>
          )}

          {!loading && isTutor && (
            <Pagination
              page={page}
              onPageChange={setPage}
              hasMore={items.length === LIMIT}
            />
          )}
        </div>
      </div>
    </PageShell>
  );
}
