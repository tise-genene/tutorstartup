"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { PageShell } from "../../_components/PageShell";
import type { UserRole } from "../../../lib/types";
import { useAuth, useI18n } from "../../providers";
import { getGoogleAuthUrl } from "../../../lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { auth, register } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "PARENT" as UserRole,
  });
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!auth) return;
    router.replace(auth.user.role === "TUTOR" ? "/work" : "/dashboard");
  }, [auth, router]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus(null);
    setBusy(true);

    try {
      await register(form);
      setStatus(
        "Account created. Please check your email and verify before logging in."
      );
      router.push("/auth/login?registered=1");
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
          <h1 className="text-2xl font-semibold">{t("auth.register.title")}</h1>
          <p className="text-sm ui-muted">{t("auth.register.subtitle")}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            className="ui-field"
            placeholder={t("auth.name")}
            value={form.name}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, name: event.target.value }))
            }
            required
            autoComplete="name"
          />
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
            autoComplete="new-password"
          />

          <label className="block text-sm ui-muted">
            {t("auth.role")}
            <select
              className="ui-field mt-1"
              value={form.role}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  role: event.target.value as UserRole,
                }))
              }
            >
              <option
                value="STUDENT"
                className="bg-white text-black dark:bg-neutral-900 dark:text-white"
              >
                {t("auth.role.student")}
              </option>
              <option
                value="PARENT"
                className="bg-white text-black dark:bg-neutral-900 dark:text-white"
              >
                {t("auth.role.parent")}
              </option>
              <option
                value="TUTOR"
                className="bg-white text-black dark:bg-neutral-900 dark:text-white"
              >
                {t("auth.role.tutor")}
              </option>
            </select>
          </label>

          <button
            className="ui-btn ui-btn-primary ui-btn-block disabled:opacity-50"
            disabled={busy}
          >
            {busy ? t("common.loading") : t("auth.register.submit")}
          </button>

          {status && <p className="text-sm ui-muted">{status}</p>}

          <p className="pt-1 text-sm ui-muted">
            {t("auth.register.footer")}{" "}
            <Link href="/auth/login" className="underline underline-offset-4">
              {t("auth.register.footer.link")}
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
