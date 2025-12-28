"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageShell } from "../../_components/PageShell";
import {
  fetchContractById,
  fetchContractMessages,
  fetchContractPayments,
  fetchContractMilestones,
  createContractMilestone,
  createMilestonePaymentIntent,
  releaseContractMilestone,
  createContractPaymentIntent,
  sendContractMessage,
} from "../../../lib/api";
import type {
  Contract,
  ContractMessage,
  ContractMilestone,
  Payment,
} from "../../../lib/types";
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
  const [payments, setPayments] = useState<Payment[]>([]);
  const [milestones, setMilestones] = useState<ContractMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [paying, setPaying] = useState(false);
  const [milestoneBusyId, setMilestoneBusyId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const [form, setForm] = useState({ body: "", attachmentUrl: "" });
  const [milestoneForm, setMilestoneForm] = useState({
    title: "",
    amount: "",
  });

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

      try {
        const loadedPayments = await fetchContractPayments(token, contractId);
        setPayments(loadedPayments);
      } catch {
        setPayments([]);
      }

      try {
        const loadedMilestones = await fetchContractMilestones(
          token,
          contractId
        );
        setMilestones(loadedMilestones);
      } catch {
        setMilestones([]);
      }
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

  const onPay = async () => {
    if (!token || !contractId) return;
    if (auth?.user.role !== "PARENT") {
      setStatus("Only parents can pay.");
      return;
    }

    setPaying(true);
    setStatus(null);
    try {
      const intent = await createContractPaymentIntent(token, contractId);
      window.location.href = intent.checkoutUrl;
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setPaying(false);
    }
  };

  const onCreateMilestone = async () => {
    if (!token || !contractId) return;
    if (auth?.user.role !== "PARENT") {
      setStatus("Only parents can create milestones.");
      return;
    }

    const title = milestoneForm.title.trim();
    const amount = Number(milestoneForm.amount);
    if (title.length === 0) {
      setStatus("Milestone title is required.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setStatus("Milestone amount must be > 0.");
      return;
    }

    setStatus(null);
    setMilestoneBusyId("__create__");
    try {
      await createContractMilestone(token, contractId, { title, amount });
      setMilestoneForm({ title: "", amount: "" });
      await reload();
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setMilestoneBusyId(null);
    }
  };

  const onFundMilestone = async (milestoneId: string) => {
    if (!token || !contractId) return;
    if (auth?.user.role !== "PARENT") {
      setStatus("Only parents can fund milestones.");
      return;
    }

    setStatus(null);
    setMilestoneBusyId(milestoneId);
    try {
      const intent = await createMilestonePaymentIntent(
        token,
        contractId,
        milestoneId
      );
      window.location.href = intent.checkoutUrl;
    } catch (e) {
      setStatus((e as Error).message);
      setMilestoneBusyId(null);
    }
  };

  const onReleaseMilestone = async (milestoneId: string) => {
    if (!token || !contractId) return;
    if (auth?.user.role !== "PARENT") {
      setStatus("Only parents can release milestones.");
      return;
    }

    setStatus(null);
    setMilestoneBusyId(milestoneId);
    try {
      await releaseContractMilestone(token, contractId, milestoneId);
      await reload();
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setMilestoneBusyId(null);
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

                {auth?.user.role === "PARENT" &&
                  contract.status === "PENDING_PAYMENT" && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm ui-muted">
                        Amount: {contract.amount ?? "—"}{" "}
                        {contract.currency ?? "ETB"}
                      </p>
                      <button
                        type="button"
                        className="ui-btn ui-btn-primary"
                        disabled={paying}
                        onClick={onPay}
                      >
                        {paying ? "Redirecting…" : "Pay"}
                      </button>
                    </div>
                  )}

                {payments.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm ui-muted">Payments</p>
                    <div className="mt-2 space-y-2">
                      {payments.map((p) => (
                        <div
                          key={p.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3"
                          style={{ borderColor: "var(--divider)" }}
                        >
                          <p className="text-sm ui-muted">
                            {p.amount} {p.currency} — {p.status}
                          </p>
                          <p className="text-xs ui-muted">
                            {new Date(p.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="surface-card surface-card--quiet p-5">
                <h2
                  className="text-lg font-semibold"
                  style={{ color: "var(--foreground)" }}
                >
                  Milestones
                </h2>

                {milestones.length === 0 ? (
                  <p className="mt-3 text-sm ui-muted">No milestones yet.</p>
                ) : (
                  <div className="mt-4 space-y-2">
                    {milestones.map((m) => (
                      <div
                        key={m.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3"
                        style={{ borderColor: "var(--divider)" }}
                      >
                        <div>
                          <p className="text-sm ui-muted">{m.title}</p>
                          <p className="text-xs ui-muted">
                            {m.amount} {m.currency} — {m.status}
                          </p>
                        </div>

                        {auth?.user.role === "PARENT" && (
                          <div className="flex items-center gap-2">
                            {m.status === "DRAFT" && (
                              <button
                                type="button"
                                className="ui-btn ui-btn-primary"
                                disabled={milestoneBusyId === m.id}
                                onClick={() => onFundMilestone(m.id)}
                              >
                                {milestoneBusyId === m.id
                                  ? "Redirecting…"
                                  : "Fund"}
                              </button>
                            )}
                            {m.status === "FUNDED" && (
                              <button
                                type="button"
                                className="ui-btn"
                                disabled={milestoneBusyId === m.id}
                                onClick={() => onReleaseMilestone(m.id)}
                              >
                                {milestoneBusyId === m.id
                                  ? "Releasing…"
                                  : "Release"}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {auth?.user.role === "PARENT" && (
                  <div className="mt-6 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <input
                        className="ui-field sm:col-span-2"
                        placeholder="Milestone title"
                        value={milestoneForm.title}
                        onChange={(e) =>
                          setMilestoneForm((p) => ({
                            ...p,
                            title: e.target.value,
                          }))
                        }
                      />
                      <input
                        className="ui-field"
                        placeholder="Amount"
                        inputMode="numeric"
                        value={milestoneForm.amount}
                        onChange={(e) =>
                          setMilestoneForm((p) => ({
                            ...p,
                            amount: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <button
                      type="button"
                      className="ui-btn"
                      disabled={milestoneBusyId === "__create__"}
                      onClick={onCreateMilestone}
                    >
                      {milestoneBusyId === "__create__"
                        ? "Creating…"
                        : "Add milestone"}
                    </button>
                  </div>
                )}
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
