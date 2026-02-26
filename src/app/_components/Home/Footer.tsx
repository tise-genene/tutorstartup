"use client";

import Link from "next/link";
import { BRAND_NAME, SUPPORT_EMAIL } from "../../../lib/brand";
import { useI18n } from "../../providers";

function MailIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-[var(--border)] mt-20 bg-[var(--background)]">
      <div className="max-w-[1400px] mx-auto px-6 py-16">
        <div className="grid gap-12 md:grid-cols-3">
          {/* Brand Column */}
          <div className="space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="text-lg font-bold">{BRAND_NAME}</span>
            </div>
            <p className="text-sm text-[var(--foreground)]/60 max-w-xs">
              {t("home.footer.copy")}
            </p>
            <div className="flex gap-2">
              <a href={`mailto:${SUPPORT_EMAIL}`} className="ui-btn ui-btn-ghost h-9 px-3">
                <MailIcon />
              </a>
              <a href="tel:+251110000000" className="ui-btn ui-btn-ghost h-9 px-3">
                <PhoneIcon />
              </a>
              <Link href="/support" className="ui-btn ui-btn-ghost h-9 px-3">
                <MessageIcon />
              </Link>
            </div>
          </div>

          {/* Contact Column */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/50 mb-4">
              Contact
            </p>
            <div className="space-y-3">
              <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-3 text-sm hover:text-[var(--accent)] transition-colors">
                <MailIcon />
                {t("home.footer.email")}
              </a>
              <a href="tel:+251110000000" className="flex items-center gap-3 text-sm hover:text-[var(--accent)] transition-colors">
                <PhoneIcon />
                {t("home.footer.phone")}
              </a>
              <Link href="/support" className="flex items-center gap-3 text-sm hover:text-[var(--accent)] transition-colors">
                <MessageIcon />
                {t("home.footer.support")}
              </Link>
            </div>
          </div>

          {/* Links Column */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/50 mb-4">
              Quick Links
            </p>
            <div className="space-y-3">
              <Link href="/tutors/search" className="flex items-center gap-3 text-sm hover:text-[var(--accent)] transition-colors">
                <SearchIcon />
                Find a Tutor
              </Link>
              <Link href="/tutor/profile" className="flex items-center gap-3 text-sm hover:text-[var(--accent)] transition-colors">
                <UserIcon />
                Become a Tutor
              </Link>
              <Link href="/auth/login" className="flex items-center gap-3 text-sm hover:text-[var(--accent)] transition-colors">
                Login
              </Link>
              <div className="pt-2 flex gap-4">
                <Link href="/privacy" className="text-xs text-[var(--foreground)]/50 hover:text-[var(--accent)]">Privacy</Link>
                <Link href="/terms" className="text-xs text-[var(--foreground)]/50 hover:text-[var(--accent)]">Terms</Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-[var(--foreground)]/50">
          <span>© {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
