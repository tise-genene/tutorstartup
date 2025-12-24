"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageShell } from "../../_components/PageShell";
import {
  fetchLessonRequestInbox,
  updateLessonRequestStatus,
} from "../../../lib/api";
import type { LessonRequest, LessonRequestStatus } from "../../../lib/types";
import { useAuth, useI18n } from "../../providers";

export default function TutorRequestsPage() {
  const { t } = useI18n();
  const { auth } = useAuth();

  const token = auth?.accessToken ?? null;
  const isTutor = auth?.user.role === "TUTOR";

  const [items, setItems] = useState<LessonRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const helper = useMemo(() => {
    if (!auth) return t("requests.guard.login");
    if (!isTutor) return t("requests.guard.tutorOnly");
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
        const response = await fetchLessonRequestInbox(token);
        setItems(response);
      } catch (error) {
        setStatus((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [token, isTutor]);

  const onUpdate = async (id: string, next: LessonRequestStatus) => {
    if (!token) return;
    setBusyId(id);
    setStatus(null);

    try {
      const updated = await updateLessonRequestStatus(token, id, next);
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl">
        <div className="glass-panel p-8 sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">{t("requests.title")}</h1>
              <p className="mt-1 text-sm ui-muted">{t("requests.subtitle")}</p>
            </div>
            <Link href="/tutor/profile" className="ui-btn">
              {t("requests.back")}
            </Link>
          </div>

          {helper && <p className="mt-6 text-sm ui-muted">{helper}</p>}

          {status && <p className="mt-6 text-sm ui-muted">{status}</p>}

          {loading && (
            <p className="mt-6 text-sm ui-muted">{t("common.loading")}</p>
          )}

          {!loading && isTutor && items.length === 0 && (
            <p className="mt-6 text-sm ui-muted">{t("requests.empty")}</p>
          )}

          {!loading && isTutor && items.length > 0 && (
            <div className="mt-6 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="surface-card surface-card--quiet p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm ui-muted">
                        {t("requests.from")}: {item.requester.name} (
                        {item.requester.email})
                      </p>
                      <p
                        className="mt-1 text-lg font-semibold"
                        style={{ color: "var(--foreground)" }}
                      >
                        {item.subject}
                      </p>
                    </div>
                    <span
                      className="pill text-xs"
                      style={{
                        background:
                          "color-mix(in srgb, var(--background) 70%, transparent)",
                      }}
                    >
                      {item.status}
                    </span>
                  </div>

                  <p
                    className="mt-3 text-sm ui-muted"
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {item.message}
                  </p>

                  {item.status === "PENDING" && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        className="ui-btn ui-btn-primary"
                        disabled={busyId === item.id}
                        onClick={() => onUpdate(item.id, "ACCEPTED")}
                      >
                        {t("requests.accept")}
                      </button>
                      <button
                        type="button"
                        className="ui-btn"
                        disabled={busyId === item.id}
                        onClick={() => onUpdate(item.id, "DECLINED")}
                      >
                        {t("requests.decline")}
                      </button>
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
