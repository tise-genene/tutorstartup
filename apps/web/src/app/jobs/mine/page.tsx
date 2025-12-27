"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageShell } from "../../_components/PageShell";
import { fetchMyJobs } from "../../../lib/api";
import type { JobPost } from "../../../lib/types";
import { useAuth, useI18n } from "../../providers";

export default function MyJobsPage() {
  const { t } = useI18n();
  const { auth } = useAuth();

  const token = auth?.accessToken ?? null;
  const isParent = auth?.user.role === "PARENT";

  const [items, setItems] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  const helper = useMemo(() => {
    if (!auth) return t("state.loginRequired");
    if (!isParent) return "This page is for parents only.";
    return null;
  }, [auth, isParent, t]);

  useEffect(() => {
    const run = async () => {
      if (!token || !isParent) {
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
  }, [token, isParent]);

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

          {!loading && isParent && items.length === 0 && (
            <p className="mt-6 text-sm ui-muted">No jobs yet.</p>
          )}

          {!loading && isParent && items.length > 0 && (
            <div className="mt-6 space-y-4">
              {items.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
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
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
