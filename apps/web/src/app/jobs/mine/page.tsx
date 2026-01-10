"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageShell } from "../../_components/PageShell";
import { fetchMyJobs, publishJob } from "../../../lib/api";
import type { JobPost } from "../../../lib/types";
import { useAuth, useI18n } from "../../providers";

export default function MyJobsPage() {
  const { t } = useI18n();
  const { auth } = useAuth();

  const token = auth?.accessToken ?? null;
  const isClient =
    auth?.user.role === "PARENT" || auth?.user.role === "STUDENT";

  const [items, setItems] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  const [publishingId, setPublishingId] = useState<string | null>(null);

  const helper = useMemo(() => {
    if (!auth) return t("state.loginRequired");
    if (!isClient) return "This page is for clients only.";
    return null;
  }, [auth, isClient, t]);

  useEffect(() => {
    const run = async () => {
      if (!token || !isClient) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setStatus(null);
      try {
        const jobs = await fetchMyJobs(token);
        setItems(jobs);
      } catch (e) {
        setStatus((e as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [token, isClient]);

  const onPublish = async (jobId: string) => {
    if (!token) return;
    setPublishingId(jobId);
    setStatus(null);
    try {
      await publishJob(token, jobId);
      const jobs = await fetchMyJobs(token);
      setItems(jobs);
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl">
        <div className="glass-panel p-8 sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">{t("nav.myJobs")}</h1>
              <p className="mt-1 text-sm ui-muted">Your posted jobs.</p>
            </div>
            <Link href="/jobs/post" className="ui-btn ui-btn-primary">
              {t("nav.postJob")}
            </Link>
          </div>

          {helper && <p className="mt-6 text-sm ui-muted">{helper}</p>}
          {status && <p className="mt-6 text-sm ui-muted">{status}</p>}
          {loading && (
            <p className="mt-6 text-sm ui-muted">{t("common.loading")}</p>
          )}

          {!loading && isClient && items.length === 0 && (
            <p className="mt-6 text-sm ui-muted">No jobs yet.</p>
          )}

          {!loading && isClient && items.length > 0 && (
            <div className="mt-6 space-y-4">
              {items.map((job) => (
                <div
                  key={job.id}
                  className="surface-card surface-card--quiet block p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <Link href={`/jobs/${job.id}`} className="block">
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
                      </Link>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="pill text-xs">{job.status}</span>
                      {job.status === "DRAFT" && (
                        <button
                          type="button"
                          className="ui-btn ui-btn-primary"
                          disabled={publishingId === job.id}
                          onClick={() => onPublish(job.id)}
                        >
                          {publishingId === job.id ? "Publishing…" : "Publish"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
