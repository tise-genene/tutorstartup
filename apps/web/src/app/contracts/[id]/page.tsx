"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageShell } from "../../_components/PageShell";
import {
  fetchContractById,
  fetchContractMessages,
  fetchContractAppointments,
  fetchContractPayments,
  fetchContractMilestones,
  createContractMilestone,
  createMilestonePaymentIntent,
  releaseContractMilestone,
  payoutContractMilestone,
  createContractPaymentIntent,
  createContractAppointment,
  cancelContractAppointment,
  sendContractMessage,
} from "../../../lib/api";
import { Pagination } from "../../_components/Pagination";
import type {
  Appointment,
  Contract,
  ContractMessage,
  ContractMilestone,
  Payment,
} from "../../../lib/types";
import { useAuth, useI18n } from "../../providers";
import { GoogleMapPicker } from "../../../components/maps/GoogleMapPicker";

export default function ContractDetailPage() {
  const { t } = useI18n();
  const { auth } = useAuth();

  const params = useParams();
  const idParam = params?.id;
  const contractId = Array.isArray(idParam) ? idParam[0] : idParam;

  const token = auth?.accessToken ?? null;
  const isParentTutorOrAdmin =
    auth?.user.role === "PARENT" ||
    auth?.user.role === "TUTOR" ||
    auth?.user.role === "ADMIN";

  const [contract, setContract] = useState<Contract | null>(null);
  const [messages, setMessages] = useState<ContractMessage[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [milestones, setMilestones] = useState<ContractMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [paying, setPaying] = useState(false);
  const [creatingAppointment, setCreatingAppointment] = useState(false);
  const [cancellingAppointmentId, setCancellingAppointmentId] = useState<
    string | null
  >(null);
  const [milestoneBusyId, setMilestoneBusyId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const [form, setForm] = useState({ body: "", attachmentUrl: "" });
  const [milestoneForm, setMilestoneForm] = useState({
    title: "",
    amount: "",
  });

  const [msgPage, setMsgPage] = useState(1);
  const [apptPage, setApptPage] = useState(1);
  const [payPage, setPayPage] = useState(1);
  const [msPage, setMsPage] = useState(1);
  const LIMIT = 10;

  const [appointmentForm, setAppointmentForm] = useState({
    title: "",
    notes: "",
    startAt: "",
    endAt: "",
    locationText: "",
    locationLat: null as number | null,
    locationLng: null as number | null,
  });

  const helper = useMemo(() => {
    if (!auth) return t("state.loginRequired");
    if (!isParentTutorOrAdmin)
      return "This page is for parents, tutors, and admins only.";
    if (!contractId) return "Invalid contract id";
    return null;
  }, [auth, isParentTutorOrAdmin, contractId, t]);

  const reload = async () => {
    if (!token || !isParentTutorOrAdmin || !contractId) return;

    setLoading(true);
    setStatus(null);
    try {
      const loadedContract = await fetchContractById(token, contractId);
      setContract(loadedContract);
      await Promise.all([
        fetchMessages(),
        fetchPayments(),
        fetchMilestones(),
        fetchAppointments(),
      ]);
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!token || !contractId) return;
    try {
      const loaded = await fetchContractMessages(token, contractId, {
        page: msgPage,
        limit: LIMIT,
      });
      setMessages(loaded);
    } catch (e) {
      console.error("Failed to load messages:", e);
    }
  };

  const fetchPayments = async () => {
    if (!token || !contractId) return;
    try {
      const loaded = await fetchContractPayments(token, contractId, {
        page: payPage,
        limit: LIMIT,
      });
      setPayments(loaded);
    } catch (e) {
      setPayments([]);
    }
  };

  const fetchMilestones = async () => {
    if (!token || !contractId) return;
    try {
      const loaded = await fetchContractMilestones(token, contractId, {
        page: msPage,
        limit: LIMIT,
      });
      setMilestones(loaded);
    } catch (e) {
      setMilestones([]);
    }
  };

  const fetchAppointments = async () => {
    if (!token || !contractId) return;
    try {
      const loaded = await fetchContractAppointments(token, contractId, {
        page: apptPage,
        limit: LIMIT,
      });
      setAppointments(loaded);
    } catch (e) {
      setAppointments([]);
    }
  };

  useEffect(() => {
    if (!token || !isParentTutorOrAdmin || !contractId) return;
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isParentTutorOrAdmin, contractId]);

  useEffect(() => {
    void fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgPage]);

  useEffect(() => {
    void fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payPage]);

  useEffect(() => {
    void fetchMilestones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msPage]);

  useEffect(() => {
    void fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apptPage]);

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
        milestoneId,
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

  const onPayoutMilestone = async (milestoneId: string) => {
    if (!token || !contractId) return;
    if (auth?.user.role !== "ADMIN") {
      setStatus("Only admins can payout milestones.");
      return;
    }

    setStatus(null);
    setMilestoneBusyId(milestoneId);
    try {
      await payoutContractMilestone(token, contractId, milestoneId);
      await reload();
      setStatus("Payout recorded.");
      window.setTimeout(() => setStatus(null), 3000);
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setMilestoneBusyId(null);
    }
  };

  const onCreateAppointment = async () => {
    if (!token || !contractId) return;
    if (auth?.user.role !== "PARENT" && auth?.user.role !== "TUTOR") {
      setStatus("Only parents and tutors can schedule appointments.");
      return;
    }

    const title = appointmentForm.title.trim();
    if (title.length === 0) {
      setStatus("Title is required.");
      return;
    }
    if (!appointmentForm.startAt || !appointmentForm.endAt) {
      setStatus("Start and end time are required.");
      return;
    }

    const startAt = new Date(appointmentForm.startAt);
    const endAt = new Date(appointmentForm.endAt);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      setStatus("Invalid start/end time.");
      return;
    }
    if (endAt <= startAt) {
      setStatus("End time must be after start time.");
      return;
    }

    setCreatingAppointment(true);
    setStatus(null);
    try {
      await createContractAppointment(token, contractId, {
        title,
        notes: appointmentForm.notes.trim().length
          ? appointmentForm.notes
          : undefined,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        locationText: appointmentForm.locationText.trim().length
          ? appointmentForm.locationText
          : undefined,
        locationLat:
          typeof appointmentForm.locationLat === "number"
            ? appointmentForm.locationLat
            : undefined,
        locationLng:
          typeof appointmentForm.locationLng === "number"
            ? appointmentForm.locationLng
            : undefined,
      });
      setAppointmentForm({
        title: "",
        notes: "",
        startAt: "",
        endAt: "",
        locationText: "",
        locationLat: null,
        locationLng: null,
      });
      await reload();
      setStatus("Appointment scheduled.");
      window.setTimeout(() => setStatus(null), 2500);
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setCreatingAppointment(false);
    }
  };

  const onCancelAppointment = async (appointmentId: string) => {
    if (!token || !contractId) return;
    if (auth?.user.role !== "PARENT" && auth?.user.role !== "TUTOR") {
      setStatus("Only parents and tutors can cancel appointments.");
      return;
    }
    if (!window.confirm("Cancel this appointment?")) return;

    setCancellingAppointmentId(appointmentId);
    setStatus(null);
    try {
      await cancelContractAppointment(token, contractId, appointmentId);
      await reload();
      setStatus("Appointment cancelled.");
      window.setTimeout(() => setStatus(null), 2500);
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setCancellingAppointmentId(null);
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

                    {!loading && (
                      <Pagination
                        page={payPage}
                        onPageChange={setPayPage}
                        hasMore={payments.length === LIMIT}
                      />
                    )}
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

                        {auth?.user.role === "ADMIN" && (
                          <div className="flex items-center gap-2">
                            {m.status === "RELEASED" && (
                              <button
                                type="button"
                                className="ui-btn"
                                disabled={milestoneBusyId === m.id}
                                onClick={() => onPayoutMilestone(m.id)}
                              >
                                {milestoneBusyId === m.id
                                  ? "Paying…"
                                  : "Payout"}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {!loading && milestones.length > 0 && (
                  <Pagination
                    page={msPage}
                    onPageChange={setMsPage}
                    hasMore={milestones.length === LIMIT}
                  />
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
                  Appointments
                </h2>

                {appointments.length === 0 ? (
                  <p className="mt-3 text-sm ui-muted">
                    No appointments scheduled yet.
                  </p>
                ) : (
                  <div className="mt-4 space-y-2">
                    {appointments.map((a) => {
                      const hasCoords =
                        typeof a.locationLat === "number" &&
                        typeof a.locationLng === "number";
                      const mapUrl = hasCoords
                        ? `https://www.google.com/maps?q=${a.locationLat},${a.locationLng}`
                        : null;
                      return (
                        <div
                          key={a.id}
                          className="rounded-xl border px-4 py-3"
                          style={{ borderColor: "var(--divider)" }}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-sm ui-muted">{a.title}</p>
                              <p className="mt-1 text-xs ui-muted">
                                {new Date(a.startAt).toLocaleString()} –{" "}
                                {new Date(a.endAt).toLocaleString()}
                              </p>
                              {(a.locationText || mapUrl) && (
                                <div className="mt-1 text-xs ui-muted">
                                  {a.locationText ? (
                                    <span>{a.locationText}</span>
                                  ) : null}
                                  {mapUrl ? (
                                    <a
                                      className="ml-2 underline opacity-85 hover:opacity-100"
                                      href={mapUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      Open map
                                    </a>
                                  ) : null}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {(auth?.user.role === "PARENT" ||
                                auth?.user.role === "TUTOR") && (
                                <button
                                  type="button"
                                  className="ui-btn"
                                  disabled={cancellingAppointmentId === a.id}
                                  onClick={() => onCancelAppointment(a.id)}
                                >
                                  {cancellingAppointmentId === a.id
                                    ? "Cancelling…"
                                    : "Cancel"}
                                </button>
                              )}
                              <p className="text-xs ui-muted">
                                {new Date(a.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {a.notes && (
                            <p
                              className="mt-2 text-sm ui-muted"
                              style={{ whiteSpace: "pre-wrap" }}
                            >
                              {a.notes}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {!loading && appointments.length > 0 && (
                  <Pagination
                    page={apptPage}
                    onPageChange={setApptPage}
                    hasMore={appointments.length === LIMIT}
                  />
                )}

                {(auth?.user.role === "PARENT" ||
                  auth?.user.role === "TUTOR") && (
                  <div className="mt-6 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        className="ui-field"
                        placeholder="Title"
                        value={appointmentForm.title}
                        onChange={(e) =>
                          setAppointmentForm((p) => ({
                            ...p,
                            title: e.target.value,
                          }))
                        }
                      />
                      <input
                        className="ui-field"
                        placeholder="Location text (optional)"
                        value={appointmentForm.locationText}
                        onChange={(e) =>
                          setAppointmentForm((p) => ({
                            ...p,
                            locationText: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <textarea
                      className="ui-field"
                      rows={3}
                      placeholder="Notes (optional)"
                      value={appointmentForm.notes}
                      onChange={(e) =>
                        setAppointmentForm((p) => ({
                          ...p,
                          notes: e.target.value,
                        }))
                      }
                    />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-xs ui-muted">
                        Start
                        <input
                          className="ui-field mt-2"
                          type="datetime-local"
                          value={appointmentForm.startAt}
                          onChange={(e) =>
                            setAppointmentForm((p) => ({
                              ...p,
                              startAt: e.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="text-xs ui-muted">
                        End
                        <input
                          className="ui-field mt-2"
                          type="datetime-local"
                          value={appointmentForm.endAt}
                          onChange={(e) =>
                            setAppointmentForm((p) => ({
                              ...p,
                              endAt: e.target.value,
                            }))
                          }
                        />
                      </label>
                    </div>

                    <GoogleMapPicker
                      enableSearch
                      value={{
                        lat: appointmentForm.locationLat,
                        lng: appointmentForm.locationLng,
                        locationText: appointmentForm.locationText,
                      }}
                      onChange={(v) =>
                        setAppointmentForm((p) => ({
                          ...p,
                          locationLat: v.lat,
                          locationLng: v.lng,
                          locationText: v.locationText ?? p.locationText,
                        }))
                      }
                    />

                    <button
                      type="button"
                      className="ui-btn ui-btn-primary"
                      disabled={creatingAppointment}
                      onClick={onCreateAppointment}
                    >
                      {creatingAppointment
                        ? "Scheduling…"
                        : "Schedule appointment"}
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

                {!loading && messages.length > 0 && (
                  <Pagination
                    page={msgPage}
                    onPageChange={setMsgPage}
                    hasMore={messages.length === LIMIT}
                  />
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
