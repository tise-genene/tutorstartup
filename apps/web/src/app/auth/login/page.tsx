"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { PageShell } from "../../_components/PageShell";
import { useAuth, useI18n } from "../../providers";
import { getGoogleAuthUrl } from "../../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { auth, login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const verified = params.get("verified");
    const registered = params.get("registered");
    const oauth = params.get("oauth");
    const reset = params.get("reset");

    if (registered === "1") {
      setStatus("Check your email to verify your account.");
      return;
    }
    if (verified === "1") {
      setStatus("Email verified. You can log in now.");
      return;
    }
    if (verified === "0") {
      setStatus("Verification link invalid or expired.");
      return;
    }
    if (reset === "1") {
      setStatus("Password updated. You can log in now.");
      return;
    }
    if (oauth === "0") {
      setStatus("Google sign-in failed. Please try again.");
    }
  }, []);

  useEffect(() => {
    if (!auth) return;
    router.replace(auth.user.role === "TUTOR" ? "/work" : "/dashboard");
  }, [auth, router]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus(null);
    setBusy(true);

    try {
      const auth = await login(form);
      router.push(auth.user.role === "TUTOR" ? "/work" : "/dashboard");
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-xl glass-panel p-8 sm:p-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">{t("auth.login.title")}</h1>
          <p className="text-sm ui-muted">{t("auth.login.subtitle")}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            className="ui-field"
            placeholder={t("auth.email")}
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, email: event.target.value }))
            }
            required
            autoComplete="email"
          />
          <input
            className="ui-field"
            placeholder={t("auth.password")}
            type="password"
            value={form.password}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, password: event.target.value }))
            }
            required
            minLength={8}
            autoComplete="current-password"
          />

          <button
            className="ui-btn ui-btn-primary ui-btn-block disabled:opacity-50"
            disabled={busy}
          >
            {busy ? t("common.loading") : t("auth.login.submit")}
          </button>

          {status && <p className="text-sm ui-muted">{status}</p>}

          <p className="pt-1 text-sm ui-muted">
            <Link
              href="/auth/forgot-password"
              className="underline underline-offset-4"
            >
              Forgot password?
            </Link>
          </p>

          <p className="pt-1 text-sm ui-muted">
            {t("auth.login.footer")}{" "}
            <Link
              href="/auth/register"
              className="underline underline-offset-4"
            >
              {t("auth.login.footer.link")}
            </Link>
          </p>

          <div
            className="my-2 h-px w-full"
            style={{ backgroundColor: "var(--divider)" }}
          />

          <a className="ui-btn ui-btn-block" href={getGoogleAuthUrl()}>
            Continue with Google
          </a>
        </form>
      </div>
    </PageShell>
  );
}
