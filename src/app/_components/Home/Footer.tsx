"use client";

import Link from "next/link";
import { BRAND_NAME, SUPPORT_EMAIL } from "../../../lib/brand";
import { useI18n } from "../../providers";

function MailIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="section-shell border-t border-[var(--border)] mt-12 bg-[var(--background)]">
      <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-5">
          <p className="text-xl font-bold tracking-tight text-[var(--foreground)]">
            {BRAND_NAME}
          </p>
          <p className="text-sm ui-muted max-w-xs leading-relaxed">
            {t("home.footer.copy")}
          </p>
          <div className="flex gap-4 pt-2">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="ui-btn ui-btn-secondary h-9 px-3"
              aria-label="Email us"
            >
              <MailIcon />
            </a>
            <a
              href="tel:+251110000000"
              className="ui-btn ui-btn-secondary h-9 px-3"
              aria-label="Call us"
            >
              <PhoneIcon />
            </a>
            <Link
              href="/support"
              className="ui-btn ui-btn-secondary h-9 px-3"
              aria-label="Get support"
            >
              <MessageIcon />
            </Link>
          </div>
        </div>

        <div className="space-y-5">
          <p className="text-xs font-bold tracking-widest ui-muted uppercase flex items-center gap-2">
            <MessageIcon />
            {t("home.footer.contact")}
          </p>
          <div className="space-y-3">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="flex items-center gap-2.5 text-sm text-[var(--foreground)] hover:text-[var(--accent)] transition-colors group"
            >
              <span className="p-1.5 rounded-md bg-[var(--input)] group-hover:bg-[var(--accent-subtle)] transition-colors">
                <MailIcon />
              </span>
              {t("home.footer.email")}
            </a>
            <a
              href="tel:+251110000000"
              className="flex items-center gap-2.5 text-sm text-[var(--foreground)] hover:text-[var(--accent)] transition-colors group"
            >
              <span className="p-1.5 rounded-md bg-[var(--input)] group-hover:bg-[var(--accent-subtle)] transition-colors">
                <PhoneIcon />
              </span>
              {t("home.footer.phone")}
            </a>
            <Link
              href="/support"
              className="flex items-center gap-2.5 text-sm text-[var(--foreground)] hover:text-[var(--accent)] transition-colors group"
            >
              <span className="p-1.5 rounded-md bg-[var(--input)] group-hover:bg-[var(--accent-subtle)] transition-colors">
                <MessageIcon />
              </span>
              {t("home.footer.support")}
            </Link>
          </div>
        </div>

        <div className="space-y-5">
          <p className="text-xs font-bold tracking-widest ui-muted uppercase flex items-center gap-2">
            <SearchIcon />
            Links
          </p>
          <div className="space-y-1">
            <Link
              href="/tutors/search"
              className="flex items-center gap-2.5 text-sm text-[var(--foreground)] hover:text-[var(--accent)] transition-colors group"
            >
              <span className="p-1 rounded-md bg-[var(--input)] group-hover:bg-[var(--accent-subtle)] transition-colors">
                <SearchIcon />
              </span>
              {t("home.footer.links.search")}
            </Link>
            <Link
              href="/tutor/profile"
              className="flex items-center gap-2.5 text-sm text-[var(--foreground)] hover:text-[var(--accent)] transition-colors group"
            >
              <span className="p-1 rounded-md bg-[var(--input)] group-hover:bg-[var(--accent-subtle)] transition-colors">
                <UserIcon />
              </span>
              {t("home.footer.links.profile")}
            </Link>
            <Link
              href="/auth/login"
              className="flex items-center gap-2.5 text-sm text-[var(--foreground)] hover:text-[var(--accent)] transition-colors group"
            >
              <span className="p-1 rounded-md bg-[var(--input)] group-hover:bg-[var(--accent-subtle)] transition-colors">
                <LockIcon />
              </span>
              {t("home.footer.links.login")}
            </Link>
            <div className="h-px bg-[var(--border)] my-3" />
            <Link
              href="/privacy"
              className="flex items-center gap-2.5 text-sm text-[var(--foreground)] hover:text-[var(--accent)] transition-colors group"
            >
              <span className="p-1 rounded-md bg-[var(--input)] group-hover:bg-[var(--accent-subtle)] transition-colors">
                <ShieldIcon />
              </span>
              {t("home.footer.privacy")}
            </Link>
            <Link
              href="/terms"
              className="flex items-center gap-2.5 text-sm text-[var(--foreground)] hover:text-[var(--accent)] transition-colors group"
            >
              <span className="p-1 rounded-md bg-[var(--input)] group-hover:bg-[var(--accent-subtle)] transition-colors">
                <FileIcon />
              </span>
              {t("home.footer.terms")}
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-[var(--border)] text-sm ui-muted flex flex-col sm:flex-row justify-between items-center gap-4">
        <span>© {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.</span>
        <div className="flex items-center gap-2">
          <span className="text-xs">Powered by</span>
          <span className="font-semibold text-[var(--accent)]">{BRAND_NAME}</span>
        </div>
      </div>
    </footer>
  );
}
