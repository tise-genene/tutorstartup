"use client";

import { useState, useSyncExternalStore } from "react";
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

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function AppHeader() {
  const { auth } = useAuth();
  const { locale, setLocale, t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const hasHydrated = useSyncExternalStore(
    () => () => {
      // no-op
    },
    () => true,
    () => false
  );

  const effectiveTheme = hasHydrated ? theme : "dark";

  const toggleMobile = () => setMobileOpen((prev) => !prev);
  const closeMobile = () => setMobileOpen(false);

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
          className="relative overflow-visible rounded-2xl border px-4 py-3 backdrop-blur-xl md:px-6"
          style={{
            borderColor: "var(--divider)",
            background:
              "color-mix(in srgb, var(--background) 75%, transparent)",
            boxShadow: "var(--section-shadow)",
          }}
        >
          <span
            className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
            style={{ opacity: effectiveTheme === "light" ? 0.18 : 0.35 }}
          />
          <div className="relative flex w-full flex-wrap items-center gap-3 md:flex-nowrap md:justify-between">
            <div className="flex w-full items-center justify-between gap-2 md:w-auto md:gap-3">
              <button
                type="button"
                className="ui-btn ui-icon-btn md:hidden"
                onClick={toggleMobile}
                aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
                aria-expanded={mobileOpen}
              >
                <span className="text-base" aria-hidden>
                  {mobileOpen ? <CloseIcon /> : <MenuIcon />}
                </span>
              </button>

              <Link
                href="/"
                className="flex flex-1 items-center justify-center gap-3 md:flex-auto md:justify-start"
              >
                <span className="pill font-extrabold">Tutorstartup</span>
              </Link>
            </div>

            <nav
              className="hidden min-w-0 flex-1 items-center justify-end gap-2 md:flex"
              aria-label="Primary navigation"
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
                <Link href="/auth/logout" className="ui-btn">
                  {t("nav.logout")}
                </Link>
              )}

              <button
                type="button"
                onClick={toggleTheme}
                className="ui-btn ui-icon-btn"
                aria-label={
                  effectiveTheme === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
                title={effectiveTheme === "dark" ? "Light mode" : "Dark mode"}
              >
                <span className="block opacity-85 hover:opacity-100">
                  {effectiveTheme === "dark" ? <MoonIcon /> : <SunIcon />}
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

            {mobileOpen && (
              <div className="md:hidden">
                <div
                  className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm"
                  aria-hidden
                  onClick={closeMobile}
                />
                <div
                  className="fixed left-4 top-24 z-50 w-[88vw] max-w-xs rounded-[32px] border p-5 shadow-[0_25px_80px_rgba(0,0,0,0.45)]"
                  style={{
                    borderColor: "var(--divider)",
                    background:
                      "linear-gradient(165deg, color-mix(in srgb, var(--panel-surface) 90%, transparent), color-mix(in srgb, var(--background) 70%, transparent))",
                  }}
                >
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/tutors/search"
                      className="ui-btn ui-btn-block"
                      onClick={closeMobile}
                    >
                      {t("nav.search")}
                    </Link>
                    <Link
                      href="/tutor/profile"
                      className="ui-btn ui-btn-block"
                      onClick={closeMobile}
                    >
                      {t("nav.profile")}
                    </Link>
                    {auth?.user.role === "TUTOR" && (
                      <Link
                        href="/tutor/requests"
                        className="ui-btn ui-btn-block"
                        onClick={closeMobile}
                      >
                        {t("nav.requests")}
                      </Link>
                    )}

                    {!auth ? (
                      <>
                        <Link
                          href="/auth/login"
                          className="ui-btn ui-btn-block"
                          onClick={closeMobile}
                        >
                          {t("nav.login")}
                        </Link>
                        <Link
                          href="/auth/register"
                          className="ui-btn ui-btn-primary ui-btn-block"
                          onClick={closeMobile}
                        >
                          {t("nav.register")}
                        </Link>
                      </>
                    ) : (
                      <Link
                        href="/auth/logout"
                        className="ui-btn ui-btn-block"
                        onClick={closeMobile}
                      >
                        {t("nav.logout")}
                      </Link>
                    )}

                    <div className="mt-3 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          toggleTheme();
                          closeMobile();
                        }}
                        className="ui-btn ui-btn-block"
                      >
                        <span className="inline-flex items-center gap-2">
                          {effectiveTheme === "dark" ? (
                            <MoonIcon />
                          ) : (
                            <SunIcon />
                          )}
                          <span className="text-sm font-semibold">
                            {effectiveTheme === "dark" ? "Dark" : "Light"} mode
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLocale(locale === "en" ? "am" : "en");
                          closeMobile();
                        }}
                        className="ui-btn ui-btn-block"
                      >
                        <span className="inline-flex items-center gap-2">
                          <GlobeIcon />
                          <span className="text-sm font-semibold">
                            {locale === "en" ? "AMH" : "ENG"}
                          </span>
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
