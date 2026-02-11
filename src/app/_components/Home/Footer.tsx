"use client";

import Link from "next/link";
import { BRAND_NAME, SUPPORT_EMAIL } from "../../../lib/brand";
import { useI18n } from "../../providers";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="section-shell text-sm border-t border-[var(--border)] mt-12 bg-[var(--background)]">
      <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-4">
          <p className="text-lg font-bold tracking-tight text-[var(--foreground)]">
            {BRAND_NAME}
          </p>
          <p className="text-sm ui-muted max-w-xs leading-relaxed">
            {t("home.footer.copy")}
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-bold tracking-widest ui-muted uppercase">
            {t("home.footer.contact")}
          </p>
          <div className="space-y-3">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="block text-sm text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
            >
              {t("home.footer.email")}
            </a>
            <a
              href="tel:+251110000000"
              className="block text-sm text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
            >
              {t("home.footer.phone")}
            </a>
            <Link
              href="/support"
              className="block text-sm text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
            >
              {t("home.footer.support")}
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-bold tracking-widest ui-muted uppercase">
            Links
          </p>
          <div className="space-y-3">
            <Link
              href="/tutors/search"
              className="block text-sm text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
            >
              {t("home.footer.links.search")}
            </Link>
            <Link
              href="/tutor/profile"
              className="block text-sm text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
            >
              {t("home.footer.links.profile")}
            </Link>
            <Link
              href="/auth/login"
              className="block text-sm text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
            >
              {t("home.footer.links.login")}
            </Link>
            <Link
              href="/privacy"
              className="block text-sm text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
            >
              {t("home.footer.privacy")}
            </Link>
            <Link
              href="/terms"
              className="block text-sm text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
            >
              {t("home.footer.terms")}
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-[var(--border)] text-xs ui-muted flex justify-between items-center">
        <span>© {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.</span>
      </div>
    </footer>
  );
}
