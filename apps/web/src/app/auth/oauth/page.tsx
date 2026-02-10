"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "../../_components/PageShell";
import { useAuth } from "../../providers";

export default function OAuthConsumePage() {
  const router = useRouter();
  const { consumeAccessToken } = useAuth();

  const accessToken = useMemo(() => {
    if (typeof window === "undefined") return "";
    const hash = window.location.hash || "";
    const match = /accessToken=([^&]+)/.exec(hash);
    if (!match?.[1]) return "";
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }, []);

  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!accessToken) {
        router.replace("/auth/login?oauth=0");
        return;
      }

      try {
        const auth = await consumeAccessToken(accessToken);
        router.replace(
          auth.user.role === "TUTOR" ? "/tutor/profile" : "/tutors/search",
        );
      } catch (e) {
        setStatus((e as Error).message);
        router.replace("/auth/login?oauth=0");
      }
    };

    void run();
  }, [accessToken, consumeAccessToken, router]);

  return (
    <PageShell>
      <div className="mx-auto max-w-xl glass-panel p-8 sm:p-10">
        <h1 className="text-2xl font-semibold">Signing you in…</h1>
        <p className="mt-2 text-sm ui-muted">{status ?? "Please wait."}</p>
      </div>
    </PageShell>
  );
}
