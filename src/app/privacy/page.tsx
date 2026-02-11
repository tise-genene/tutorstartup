"use client";

import { useI18n } from "../providers";
import { PageShell } from "../_components/PageShell";

export default function PrivacyPage() {
  const { t } = useI18n();

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="glass-panel p-8 sm:p-12">
          <h1 className="text-3xl font-semibold sm:text-4xl">
            {t("privacy.title")}
          </h1>
          <p className="mt-2 text-base ui-muted">{t("privacy.subtitle")}</p>
          <div className="mt-8 space-y-6 text-sm leading-7 ui-muted">
            <p>{t("privacy.body")}</p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
