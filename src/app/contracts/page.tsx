"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageShell } from "../_components/PageShell";
import { Pagination } from "../_components/Pagination";
import { createClient } from "../../lib/supabase";
import type { Contract } from "../../lib/types";
import { useAuth, useI18n } from "../providers";

export default function ContractsPage() {
  const { t } = useI18n();
  const { auth } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const isParentOrTutor =
    auth?.user.role === "PARENT" || auth?.user.role === "TUTOR";

  const [items, setItems] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const LIMIT = 10;

  const helper = useMemo(() => {
    if (!auth) return t("state.loginRequired");
    if (!isParentOrTutor) return "This page is for parents and tutors only.";
    return null;
  }, [auth, isParentOrTutor, t]);

  useEffect(() => {
    const run = async () => {
      if (!auth?.user.id || !isParentOrTutor) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setStatus(null);
      try {
        const offset = (page - 1) * LIMIT;
        const role = auth.user.role;
        const column = role === "PARENT" ? "parent_id" : "tutor_id";
        const otherRole = role === "PARENT" ? "tutor:tutor_id(id, name)" : "parent:parent_id(id, name)";

        const { data, error } = await supabase
          .from("contracts")
          .select(`
            *,
            job_posts!inner(title),
            ${otherRole}
          `)
          .eq(column, auth.user.id)
          .order("created_at", { ascending: false })
          .range(offset, offset + LIMIT - 1);

        if (error) throw error;
        setItems((data || []).map((c: any) => ({
          ...c,
          jobPost: c.job_posts,
          tutor: c.tutor,
          parent: c.parent,
        })) as any);
      } catch (e) {
        setStatus((e as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [auth?.user.id, isParentOrTutor, page]);

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl">
        <div className="glass-panel p-8 sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">{t("nav.contracts")}</h1>
              <p className="mt-1 text-sm ui-muted">
                Your active and past work.
              </p>
            </div>
            <Link href="/" className="ui-btn">
              Back
            </Link>
          </div>

          {helper && <p className="mt-6 text-sm ui-muted">{helper}</p>}
          {status && <p className="mt-6 text-sm ui-muted">{status}</p>}
          {loading && (
            <p className="mt-6 text-sm ui-muted">{t("common.loading")}</p>
          )}

          {!loading && isParentOrTutor && items.length === 0 && (
            <p className="mt-6 text-sm ui-muted">No contracts yet.</p>
          )}

          {!loading && isParentOrTutor && items.length > 0 && (
            <div className="mt-6 space-y-4">
              {items.map((c) => (
                <Link
                  key={c.id}
                  href={`/contracts/${c.id}`}
                  className="surface-card surface-card--quiet block p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p
                        className="text-lg font-semibold"
                        style={{ color: "var(--foreground)" }}
                      >
                        {c.jobPost?.title ?? "Contract"}
                      </p>
                      <p className="mt-1 text-sm ui-muted">
                        {auth?.user.role === "PARENT"
                          ? `Tutor: ${c.tutor?.name ?? c.tutorId}`
                          : `Parent: ${c.parent?.name ?? c.parentId}`}
                      </p>
                    </div>
                    <span className="pill text-xs">{c.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!loading && isParentOrTutor && (
            <Pagination
              page={page}
              onPageChange={setPage}
              hasMore={items.length === LIMIT}
            />
          )}
        </div>
      </div>
    </PageShell>
  );
}
