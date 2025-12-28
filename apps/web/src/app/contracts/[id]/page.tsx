"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageShell } from "../../_components/PageShell";
import {
  fetchContractById,
  fetchContractMessages,
  sendContractMessage,
} from "../../../lib/api";
import type { Contract, ContractMessage } from "../../../lib/types";
import { useAuth, useI18n } from "../../providers";

export default function ContractDetailPage() {
  const { t } = useI18n();
  const { auth } = useAuth();

  const params = useParams();
  const idParam = params?.id;
  const contractId = Array.isArray(idParam) ? idParam[0] : idParam;

  const token = auth?.accessToken ?? null;
  const isParentOrTutor =
    auth?.user.role === "PARENT" || auth?.user.role === "TUTOR";

  const [contract, setContract] = useState<Contract | null>(null);
  const [messages, setMessages] = useState<ContractMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const [form, setForm] = useState({ body: "", attachmentUrl: "" });

  const helper = useMemo(() => {
    if (!auth) return t("state.loginRequired");
    if (!isParentOrTutor) return "This page is for parents and tutors only.";
    if (!contractId) return "Invalid contract id";
    return null;
  }, [auth, isParentOrTutor, contractId, t]);

  const reload = async () => {
    if (!token || !isParentOrTutor || !contractId) return;

    setLoading(true);
    setStatus(null);
    try {
      const [loadedContract, loadedMessages] = await Promise.all([
        fetchContractById(token, contractId),
        fetchContractMessages(token, contractId),
      ]);
      setContract(loadedContract);
      setMessages(loadedMessages);
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isParentOrTutor, contractId]);

  const onSend = async () => {
    if (!token || !contractId) return;
    if (form.body.trim().length === 0) {
      setStatus("Message is required.");
      return;
    }

    setSending(true);
    setStatus(null);
    try {
      await sendContractMessage(token, contractId, {
        body: form.body,
        attachmentUrl: form.attachmentUrl.trim().length
          ? form.attachmentUrl
          : undefined,
      });
      setForm({ body: "", attachmentUrl: "" });
      await reload();
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl">
        <div className="glass-panel p-8 sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">{t("nav.contracts")}</h1>
              <p className="mt-1 text-sm ui-muted">Contract chat</p>
            </div>
            <Link href="/contracts" className="ui-btn">
              Back
            </Link>
          </div>

          {helper && <p className="mt-6 text-sm ui-muted">{helper}</p>}
          {status && <p className="mt-6 text-sm ui-muted">{status}</p>}
          {loading && (
            <p className="mt-6 text-sm ui-muted">{t("common.loading")}</p>
          )}

          {!loading && contract && (
            <div className="mt-6 space-y-6">
              <div className="surface-card surface-card--quiet p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p
                      className="text-lg font-semibold"
                      style={{ color: "var(--foreground)" }}
                    >
                      {contract.jobPost?.title ?? "Contract"}
                    </p>
                    <p className="mt-1 text-sm ui-muted">
                      {auth?.user.role === "PARENT"
                        ? `Tutor: ${contract.tutor?.name ?? contract.tutorId}`
                        : `Parent: ${contract.parent?.name ?? contract.parentId}`}
                    </p>
                  </div>
                  <span className="pill text-xs">{contract.status}</span>
                </div>
              </div>

              <div className="surface-card surface-card--quiet p-5">
                <h2
                  className="text-lg font-semibold"
                  style={{ color: "var(--foreground)" }}
                >
                  Messages
                </h2>

                {messages.length === 0 ? (
                  <p className="mt-3 text-sm ui-muted">No messages yet.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className="rounded-2xl border p-4"
                        style={{ borderColor: "var(--divider)" }}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <p className="text-sm ui-muted">
                            {m.sender?.name ?? m.senderId}
                          </p>
                          <p className="text-xs ui-muted">
                            {new Date(m.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <p
                          className="mt-2 text-sm ui-muted"
                          style={{ whiteSpace: "pre-wrap" }}
                        >
                          {m.body}
                        </p>
                        {m.attachmentUrl && (
                          <a
                            className="mt-2 inline-block text-sm underline opacity-85 hover:opacity-100"
                            href={m.attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Attachment
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 space-y-3">
                  <textarea
                    className="ui-field"
                    rows={4}
                    placeholder="Write a message…"
                    value={form.body}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, body: e.target.value }))
                    }
                  />
                  <input
                    className="ui-field"
                    placeholder="Attachment URL (https://...) (optional)"
                    value={form.attachmentUrl}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, attachmentUrl: e.target.value }))
                    }
                  />
                  <button
                    type="button"
                    className="ui-btn ui-btn-primary"
                    disabled={sending}
                    onClick={onSend}
                  >
                    {sending ? "Sending…" : "Send"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
