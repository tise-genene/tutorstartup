"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, useI18n } from "../../providers";

export default function LogoutPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { logout } = useAuth();

  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setStatus(null);
      try {
        await logout();
      } catch (error) {
        setStatus((error as Error).message);
      } finally {
        router.replace("/");
      }
    };

    void run();
  }, [logout, router]);

  return (
    <div className="min-h-screen">
      <main id="main" className="px-4 pb-16 pt-10 md:px-10">
        <div className="mx-auto max-w-xl glass-panel p-8 sm:p-10">
          <div className="mb-3">
            <h1 className="text-2xl font-semibold">{t("auth.logout.title")}</h1>
            <p className="text-sm ui-muted">{t("auth.logout.subtitle")}</p>
          </div>

          {status && <p className="text-sm ui-muted">{status}</p>}

          <p className="mt-4 text-sm ui-muted">
            <Link href="/" className="underline underline-offset-4">
              {t("nav.home")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
