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
  const [responseDrafts, setResponseDrafts] = useState<
    Record<string, { message: string; fileUrl: string; videoUrl: string }>
  >({});

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

    const draft = responseDrafts[id];
    const payload =
      draft && (draft.message || draft.fileUrl || draft.videoUrl)
        ? {
            tutorResponseMessage: draft.message || undefined,
            tutorResponseFileUrl: draft.fileUrl || undefined,
            tutorResponseVideoUrl: draft.videoUrl || undefined,
          }
        : undefined;

    try {
      const updated = await updateLessonRequestStatus(token, id, next, payload);
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const updateDraft = (
    id: string,
    key: "message" | "fileUrl" | "videoUrl",
    value: string
  ) => {
    setResponseDrafts((prev) => ({
      ...prev,
      [id]: {
        message: prev[id]?.message ?? "",
        fileUrl: prev[id]?.fileUrl ?? "",
        videoUrl: prev[id]?.videoUrl ?? "",
        [key]: value,
      },
    }));
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

                  {item.status !== "PENDING" && item.tutorResponseMessage && (
                    <div
                      className="mt-4 rounded-2xl border p-4"
                      style={{ borderColor: "var(--divider)" }}
                    >
                      <p className="text-xs ui-muted">Your response</p>
                      <p
                        className="mt-2 text-sm"
                        style={{ whiteSpace: "pre-wrap" }}
                      >
                        {item.tutorResponseMessage}
                      </p>
                      {(item.tutorResponseFileUrl ||
                        item.tutorResponseVideoUrl) && (
                        <div className="mt-2 flex flex-col gap-1 text-sm">
                          {item.tutorResponseFileUrl && (
                            <a
                              className="text-sm underline opacity-85 hover:opacity-100"
                              href={item.tutorResponseFileUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              File link
                            </a>
                          )}
                          {item.tutorResponseVideoUrl && (
                            <a
                              className="text-sm underline opacity-85 hover:opacity-100"
                              href={item.tutorResponseVideoUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Video link
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {item.status === "PENDING" && (
                    <div className="mt-4 space-y-3">
                      <textarea
                        className="ui-field"
                        rows={3}
                        placeholder="Add a message (optional)"
                        value={responseDrafts[item.id]?.message ?? ""}
                        onChange={(e) =>
                          updateDraft(item.id, "message", e.target.value)
                        }
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          className="ui-field"
                          placeholder="File link (https://...)"
                          value={responseDrafts[item.id]?.fileUrl ?? ""}
                          onChange={(e) =>
                            updateDraft(item.id, "fileUrl", e.target.value)
                          }
                        />
                        <input
                          className="ui-field"
                          placeholder="Video link (https://...)"
                          value={responseDrafts[item.id]?.videoUrl ?? ""}
                          onChange={(e) =>
                            updateDraft(item.id, "videoUrl", e.target.value)
                          }
                        />
                      </div>

                      <div className="flex flex-wrap gap-3">
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
