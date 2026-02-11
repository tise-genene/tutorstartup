"use client";

import { useI18n } from "../providers";

interface PaginationProps {
  page: number;
  onPageChange: (newPage: number) => void;
  hasMore?: boolean;
}

export function Pagination({ page, onPageChange, hasMore }: PaginationProps) {
  const { t } = useI18n();

  if (page === 1 && !hasMore) {
    return null;
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-4">
      <button
        type="button"
        className="ui-btn ui-btn--quiet"
        disabled={page === 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
      >
        Previous
      </button>
      <span className="text-sm font-medium ui-muted">Page {page}</span>
      <button
        type="button"
        className="ui-btn ui-btn--quiet"
        disabled={!hasMore}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}
