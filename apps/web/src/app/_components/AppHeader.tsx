"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth, useI18n, useTheme } from "../providers";

function SunIcon() {
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
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M4.93 4.93l1.41 1.41" />
      <path d="M17.66 17.66l1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M4.93 19.07l1.41-1.41" />
      <path d="M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
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
      <path d="M21 12.8A8.5 8.5 0 0 1 11.2 3a7 7 0 1 0 9.8 9.8Z" />
    </svg>
  );
}

function GlobeIcon() {
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
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15 15 0 0 1 0 20" />
      <path d="M12 2a15 15 0 0 0 0 20" />
    </svg>
  );
}

export function AppHeader() {
  const { auth, logout } = useAuth();
  const { locale, setLocale, t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 md:px-8">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-6 focus:z-[60] focus:rounded-xl focus:border focus:bg-[var(--card)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
        style={{ borderColor: "var(--divider)", color: "var(--foreground)" }}
      >
        Skip to content
      </a>
      <div className="mx-auto max-w-6xl">
        <div
          className="relative overflow-hidden rounded-2xl border px-4 py-3 backdrop-blur-xl md:px-6"
          style={{
            borderColor: "var(--divider)",
            background:
              "color-mix(in srgb, var(--background) 75%, transparent)",
            boxShadow: "var(--section-shadow)",
          }}
        >
          <span
            className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
            style={{ opacity: theme === "light" ? 0.18 : 0.35 }}
          />
          <div className="relative flex flex-wrap items-center gap-3 md:flex-nowrap md:justify-between">
            <Link href="/" className="flex shrink-0 items-center gap-3">
              <span className="pill font-extrabold">Tutorstartup</span>
            </Link>

            <button
              type="button"
              className="ui-btn md:hidden"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Toggle navigation"
              aria-expanded={mobileOpen}
            >
              <span className="text-sm font-semibold">
                {mobileOpen ? "Close" : "Menu"}
              </span>
            </button>

            <nav
              className={`flex min-w-0 flex-col gap-2 overflow-hidden transition-all duration-300 md:flex-row md:flex-nowrap md:items-center md:gap-2 md:overflow-visible md:whitespace-nowrap md:rounded-none md:bg-transparent md:p-0 md:opacity-100 md:shadow-none md:transition-none md:justify-end ${mobileOpen ? "mt-4 max-h-[480px] opacity-100" : "max-h-0 opacity-0 pointer-events-none md:max-h-none md:pointer-events-auto"}`}
              aria-label="Primary"
            >
              <Link href="/tutors/search" className="ui-btn">
                {t("nav.search")}
              </Link>
              <Link href="/tutor/profile" className="ui-btn">
                {t("nav.profile")}
              </Link>
              {auth?.user.role === "TUTOR" && (
                <Link href="/tutor/requests" className="ui-btn">
                  {t("nav.requests")}
                </Link>
              )}

              {!auth ? (
                <>
                  <Link href="/auth/login" className="ui-btn">
                    {t("nav.login")}
                  </Link>
                  <Link href="/auth/register" className="ui-btn ui-btn-primary">
                    {t("nav.register")}
                  </Link>
                </>
              ) : (
                <button type="button" onClick={logout} className="ui-btn">
                  {t("nav.logout")}
                </button>
              )}

              <button
                type="button"
                onClick={toggleTheme}
                className="ui-btn ui-icon-btn"
                aria-label={
                  theme === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
                title={theme === "dark" ? "Light mode" : "Dark mode"}
              >
                <span className="block opacity-85 hover:opacity-100">
                  {theme === "dark" ? <MoonIcon /> : <SunIcon />}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setLocale(locale === "en" ? "am" : "en")}
                className="ui-btn"
                aria-label={
                  locale === "en" ? "Switch to Amharic" : "Switch to English"
                }
                title={locale === "en" ? "AMH" : "ENG"}
              >
                <span className="opacity-85">
                  <GlobeIcon />
                </span>
                <span className="text-xs font-semibold tracking-wide opacity-90">
                  {locale === "en" ? "ENG" : "AMH"}
                </span>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
