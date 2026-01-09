"use client";

import Link from "next/link";
import { PageShell } from "../_components/PageShell";
import { useAuth, useI18n } from "../providers";

export default function AccountPage() {
  const { t } = useI18n();
  const { auth } = useAuth();

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl glass-panel p-8 sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{t("nav.account")}</h1>
            <p className="mt-1 text-sm ui-muted">
              {auth ? "Your account details." : "Log in to view your profile."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {!auth ? (
              <Link href="/auth/login" className="ui-btn ui-btn-primary">
                {t("nav.login")}
              </Link>
            ) : (
              <Link href="/auth/logout" className="ui-btn">
                {t("nav.logout")}
              </Link>
            )}
          </div>
        </div>

        {!auth ? (
          <p className="mt-6 text-sm ui-muted">{t("state.loginRequired")}</p>
        ) : (
          <div className="mt-6 grid gap-4">
            <div
              className="rounded-2xl border p-5"
              style={{
                borderColor: "var(--divider)",
                background: "var(--card)",
              }}
            >
              <div className="grid gap-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="ui-muted">Name</span>
                  <span className="font-semibold">{auth.user.name}</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="ui-muted">Email</span>
                  <span className="font-semibold">{auth.user.email}</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="ui-muted">Role</span>
                  <span className="font-semibold">{auth.user.role}</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="ui-muted">Verified</span>
                  <span className="font-semibold">
                    {auth.user.isVerified ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>

            {auth.user.role === "TUTOR" && (
              <div className="flex flex-wrap gap-2">
                <Link href="/tutor/profile" className="ui-btn ui-btn-primary">
                  {t("nav.profile")}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
