"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageShell } from "../../_components/PageShell";
import { fetchMyProposals } from "../../../lib/api";
import type { Proposal } from "../../../lib/types";
import { useAuth, useI18n } from "../../providers";

export default function WorkProposalsPage() {
  const { t } = useI18n();
  const { auth } = useAuth();

  const token = auth?.accessToken ?? null;
  const isTutor = auth?.user.role === "TUTOR";

  const [items, setItems] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  const helper = useMemo(() => {
    if (!auth) return t("state.loginRequired");
    if (!isTutor) return t("state.tutorOnly");
    return null;
  }, [auth, isTutor, t]);

  useEffect(() => {
    const run = async () => {
      if (!token || !isTutor) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setStatus(null);
      try {
        const proposals = await fetchMyProposals(token);
        setItems(proposals);
      } catch (e) {
        setStatus((e as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [token, isTutor]);

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl">
        <div className="glass-panel p-8 sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">{t("nav.proposals")}</h1>
              <p className="mt-1 text-sm ui-muted">Your submitted proposals.</p>
            </div>
            <Link href="/work" className="ui-btn">
              Back
            </Link>
          </div>

          {helper && <p className="mt-6 text-sm ui-muted">{helper}</p>}
          {status && <p className="mt-6 text-sm ui-muted">{status}</p>}
          {loading && (
            <p className="mt-6 text-sm ui-muted">{t("common.loading")}</p>
          )}

          {!loading && isTutor && items.length === 0 && (
            <p className="mt-6 text-sm ui-muted">No proposals yet.</p>
          )}

          {!loading && isTutor && items.length > 0 && (
            <div className="mt-6 space-y-4">
              {items.map((p) => (
                <div
                  key={p.id}
                  className="surface-card surface-card--quiet p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm ui-muted">Job</p>
                      <p
                        className="mt-1 text-lg font-semibold"
                        style={{ color: "var(--foreground)" }}
                      >
                        {p.jobPost?.title ?? p.jobPostId}
                      </p>
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
    </PageShell>
  );
}
