"use client";

import { useState, type FormEvent } from "react";
import { PageShell } from "../../_components/PageShell";
import { searchTutors } from "../../../lib/api";
import type { TutorSearchResult } from "../../../lib/types";
import { parseCsv } from "../../../lib/form";
import { useI18n } from "../../providers";

export default function TutorSearchPage() {
  const { t } = useI18n();

  const [form, setForm] = useState({
    q: "",
    subjects: "",
    location: "",
    limit: 20,
    page: 1,
  });
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<TutorSearchResult | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus(null);
    setBusy(true);

    try {
      const payload = {
        query: form.q.trim() || undefined,
        subjects: parseCsv(form.subjects),
        location: form.location.trim() || undefined,
        limit: form.limit,
        page: form.page,
      };

      const response = await searchTutors(payload);
      setResult(response);
      if (!response.meta.searchEnabled) {
        setStatus(t("search.meta.disabled"));
      } else {
        setStatus(
          response.meta.cacheHit
            ? t("search.meta.cache")
            : t("search.meta.live")
        );
      }
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell>
      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <div className="glass-panel p-8">
          <h1 className="text-2xl font-semibold">{t("search.title")}</h1>
          <p className="mt-1 text-sm ui-muted">{t("search.subtitle")}</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <input
              className="ui-field"
              placeholder={t("search.keyword")}
              value={form.q}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, q: event.target.value }))
              }
            />
            <input
              className="ui-field"
              placeholder={t("search.subjects")}
              value={form.subjects}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, subjects: event.target.value }))
              }
            />
            <input
              className="ui-field"
              placeholder={t("search.location")}
              value={form.location}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, location: event.target.value }))
              }
            />

            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm ui-muted">
                {t("search.limit")}
                <input
                  className="ui-field mt-1"
                  type="number"
                  min={1}
                  max={50}
                  value={form.limit}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      limit: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label className="text-sm ui-muted">
                {t("search.page")}
                <input
                  className="ui-field mt-1"
                  type="number"
                  min={1}
                  value={form.page}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      page: Number(event.target.value),
                    }))
                  }
                />
              </label>
            </div>

            <button
              className="ui-btn ui-btn-primary ui-btn-block disabled:opacity-50"
              disabled={busy}
            >
              {busy ? t("common.loading") : t("search.submit")}
            </button>

            {status && <p className="text-sm ui-muted">{status}</p>}
          </form>
        </div>

        <div className="glass-panel p-8">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-semibold">{t("search.results")}</h2>
            {result && (
              <p className="text-sm ui-muted">
                {result.data.length} / {result.meta.total}
              </p>
            )}
          </div>

          {!result && (
            <p className="mt-6 text-sm ui-muted">{t("search.empty")}</p>
          )}

          {result && result.data.length === 0 && (
            <p className="mt-6 text-sm ui-muted">{t("search.noResults")}</p>
          )}

          {result && result.data.length > 0 && (
            <div className="mt-6 space-y-3">
              {result.data.map((hit) => (
                <div
                  key={hit.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <p className="text-base font-semibold">{hit.name}</p>
                    <p className="text-sm ui-muted">
                      {hit.location || t("search.remote")} ·{" "}
                      {hit.hourlyRate
                        ? `$${hit.hourlyRate}/hr`
                        : t("search.customRate")}
                    </p>
                  </div>
                  <p
                    className="mt-2 text-sm"
                    style={{
                      color: "var(--muted)",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {hit.bio || t("search.noBio")}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {hit.subjects.map((subject) => (
                      <span
                        key={`${hit.id}-${subject}`}
                        className="rounded-full border border-white/10 px-2 py-0.5 text-xs"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
