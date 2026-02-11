"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageShell } from "../_components/PageShell";
import { useAuth, useI18n } from "../providers";
import { createClient } from "../../lib/supabase";

export default function AccountPage() {
  const { t } = useI18n();
  const { auth } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [avatarUrl, setAvatarUrl] = useState<string>(
    auth?.user.avatarUrl ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const token = auth?.accessToken ?? null;
  const effectiveAvatar = useMemo(() => {
    const draft = avatarUrl.trim();
    if (draft.length > 0) return draft;
    return auth?.user.avatarUrl ?? "";
  }, [avatarUrl, auth?.user.avatarUrl]);

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
              <p className="text-sm font-semibold">Profile picture</p>
              <p className="mt-1 text-xs ui-muted">
                Paste an image URL (https://...) to set your avatar.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div
                  className="h-12 w-12 overflow-hidden rounded-full border"
                  style={{
                    borderColor: "var(--divider)",
                    background: "var(--panel-surface)",
                  }}
                >
                  {effectiveAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={effectiveAvatar}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-bold">
                      {auth.user.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>

                <input
                  className="ui-field min-w-[260px] flex-1"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/me.jpg"
                />

                <button
                  type="button"
                  className="ui-btn ui-btn-primary"
                  disabled={!auth || saving}
                  onClick={async () => {
                    if (!auth) return;
                    setSaving(true);
                    setStatus(null);
                    try {
                      const { error } = await supabase.auth.updateUser({
                        data: { avatarUrl: avatarUrl.trim() || undefined },
                      });
                      if (error) throw error;
                      setStatus("Saved.");
                    } catch (error) {
                      setStatus((error as Error).message);
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>

              {status && <p className="mt-3 text-xs ui-muted">{status}</p>}
            </div>

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
