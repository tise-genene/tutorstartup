"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { PageShell } from "../../_components/PageShell";
import { forgotPassword } from "../../../lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus(null);
    setBusy(true);

    try {
      await forgotPassword(email);
      setStatus(
        "If an account exists for that email, a reset link has been sent."
      );
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-xl glass-panel p-8 sm:p-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Forgot password</h1>
          <p className="text-sm ui-muted">We’ll email you a reset link.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            className="ui-field"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <button
            className="ui-btn ui-btn-primary ui-btn-block disabled:opacity-50"
            disabled={busy}
          >
            {busy ? "Sending…" : "Send reset link"}
          </button>

          {status && <p className="text-sm ui-muted">{status}</p>}

          <p className="pt-1 text-sm ui-muted">
            <Link href="/auth/login" className="underline underline-offset-4">
              Back to login
            </Link>
          </p>
        </form>
      </div>
    </PageShell>
  );
}
