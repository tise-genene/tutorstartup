"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { PageShell } from "../../_components/PageShell";
import { useAuth, useI18n } from "../../providers";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { auth, login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!auth) return;
    router.replace(
      auth.user.role === "TUTOR" ? "/tutor/profile" : "/tutors/search"
    );
  }, [auth, router]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus(null);
    setBusy(true);

    try {
      const auth = await login(form);
      router.push(
        auth.user.role === "TUTOR" ? "/tutor/profile" : "/tutors/search"
      );
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell>
      <div className="glass-panel p-8 sm:p-10">
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
            {t("auth.login.footer")}{" "}
            <Link
              href="/auth/register"
              className="underline underline-offset-4"
            >
              {t("auth.login.footer.link")}
            </Link>
          </p>
        </form>
      </div>
    </PageShell>
  );
}
