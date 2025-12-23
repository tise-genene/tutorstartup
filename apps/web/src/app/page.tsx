"use client";

import Link from "next/link";
import { PageShell } from "./_components/PageShell";
import { useI18n } from "./providers";

export default function HomePage() {
  const { t } = useI18n();

  return (
    <PageShell>
      <section className="glass-panel p-10">
        <div className="flex flex-col gap-5">
          <span className="pill bg-white/5 ui-muted">Tutorstartup</span>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            {t("home.title")}
          </h1>
          <p className="text-base ui-muted">{t("home.subtitle")}</p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/tutors/search" className="ui-btn ui-btn-primary">
              {t("home.cta.search")}
            </Link>
            <Link href="/tutor/profile" className="ui-btn">
              {t("home.cta.tutor")}
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
