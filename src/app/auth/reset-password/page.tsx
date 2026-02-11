"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "../../_components/PageShell";
import { resetPassword } from "../../../lib/api";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [token, setToken] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const qs = new URLSearchParams(window.location.search).get("token");
    if (qs && qs.trim().length > 0) {
      setToken(qs.trim());
      return;
    }

    const hash = window.location.hash || "";
    const match = /token=([^&]+)/.exec(hash);
    if (match?.[1]) {
      try {
        setToken(decodeURIComponent(match[1]));
      } catch {
        setToken(match[1]);
      }
    }
  }, []);

  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus(null);

    if (!token) {
      setStatus("Missing reset token.");
      return;
    }
    if (password.trim().length < 8) {
      setStatus("Password must be at least 8 characters.");
      return;
    }

    setBusy(true);
    try {
      await resetPassword({ token, password });
      setStatus("Password updated. You can log in now.");
      router.push("/auth/login?reset=1");
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
          <h1 className="text-2xl font-semibold">Reset password</h1>
          <p className="text-sm ui-muted">
            Set a new password for your account.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            className="ui-field"
            placeholder="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />

          <button
            className="ui-btn ui-btn-primary ui-btn-block disabled:opacity-50"
            disabled={busy}
          >
            {busy ? "Saving…" : "Update password"}
          </button>

          {status && <p className="text-sm ui-muted">{status}</p>}
        </form>
      </div>
    </PageShell>
  );
}
