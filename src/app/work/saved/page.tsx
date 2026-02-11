"use client";

import Link from "next/link";
import { PageShell } from "../../_components/PageShell";
import { useAuth, useI18n } from "../../providers";

export default function SavedJobsPage() {
  const { t } = useI18n();
  const { auth } = useAuth();

  const isTutor = auth?.user.role === "TUTOR";

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl">
        <div className="glass-panel p-8 sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">{t("nav.savedJobs")}</h1>
              <p className="mt-1 text-sm ui-muted">Saved jobs list.</p>
            </div>
            <Link href="/work" className="ui-btn">
              Back
            </Link>
          </div>

          {!auth && (
            <p className="mt-6 text-sm ui-muted">{t("state.loginRequired")}</p>
          )}
          {auth && !isTutor && (
            <p className="mt-6 text-sm ui-muted">{t("state.tutorOnly")}</p>
          )}

          {auth && isTutor && (
            <p className="mt-6 text-sm ui-muted">No saved jobs yet.</p>
          )}
        </div>
      </div>
    </PageShell>
  );
}
