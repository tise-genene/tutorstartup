"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { fetchPendingLessonRequestCount } from "../../lib/api";
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
  const [workMenuOpen, setWorkMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<number>(0);
  const hasHydrated = useSyncExternalStore(
    () => () => {
      // no-op
    },
    () => true,
    () => false
  );

  const effectiveTheme = hasHydrated ? theme : "dark";

  const role = auth?.user.role ?? null;
  const token = auth?.accessToken ?? null;
  const isTutor = role === "TUTOR";
  const isClient = role === "PARENT" || role === "STUDENT";
  const homeHref = auth ? (isTutor ? "/work" : "/dashboard") : "/";

  const toggleMobile = () => setMobileOpen((prev) => !prev);
  const closeMenus = () => {
    setMobileOpen(false);
    setWorkMenuOpen(false);
    setUserMenuOpen(false);
  };

  useEffect(() => {
    const run = async () => {
      if (!token || !isTutor) {
        setPendingRequests(0);
        return;
      }

      try {
        const res = await fetchPendingLessonRequestCount(token);
        setPendingRequests(res.pending);
      } catch {
        setPendingRequests(0);
      }
    };

    void run();
  }, [token, isTutor]);

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
                href={homeHref}
                className="flex flex-1 items-center justify-center gap-3 md:flex-auto md:justify-start"
              >
                <span className="pill font-extrabold">Tutorstartup</span>
              </Link>
            </div>

            <nav
              className="hidden min-w-0 flex-1 items-center justify-end gap-2 md:flex"
              aria-label="Primary navigation"
            >
              {isTutor ? (
                <div className="relative">
                  <button
                    type="button"
                    className="ui-btn"
                    onClick={() => setWorkMenuOpen((prev) => !prev)}
                    aria-expanded={workMenuOpen}
                    aria-haspopup="menu"
                  >
                    {t("nav.findWork")}
                  </button>

                  {workMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border"
                      style={{
                        borderColor: "var(--divider)",
                        background: "var(--panel-surface)",
                        boxShadow: "var(--tile-shadow)",
                      }}
                      role="menu"
                    >
                      <div className="flex flex-col p-2">
                        <Link
                          href="/work"
                          className="ui-btn ui-btn-block"
                          onClick={() => setWorkMenuOpen(false)}
                        >
                          {t("nav.jobs")}
                        </Link>
                        <Link
                          href="/work/saved"
                          className="ui-btn ui-btn-block"
                          onClick={() => setWorkMenuOpen(false)}
                        >
                          {t("nav.savedJobs")}
                        </Link>
                        <Link
                          href="/work/proposals"
                          className="ui-btn ui-btn-block"
                          onClick={() => setWorkMenuOpen(false)}
                        >
                          {t("nav.proposals")}
                        </Link>
                        <Link
                          href="/contracts"
                          className="ui-btn ui-btn-block"
                          onClick={() => setWorkMenuOpen(false)}
                        >
                          {t("nav.contracts")}
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/tutors/search" className="ui-btn">
                  {t("nav.search")}
                </Link>
              )}

              {isClient && (
                <>
                  <Link href="/jobs/post" className="ui-btn">
                    {t("nav.postJob")}
                  </Link>
                  <Link href="/jobs/mine" className="ui-btn">
                    {t("nav.myJobs")}
                  </Link>
                  <Link href="/contracts" className="ui-btn">
                    {t("nav.contracts")}
                  </Link>
                </>
              )}

              {isTutor && (
                <Link href="/tutor/profile" className="ui-btn">
                  {t("nav.profile")}
                </Link>
              )}

              {isTutor && (
                <Link href="/tutor/requests" className="ui-btn relative">
                  {t("nav.requests")}
                  {pendingRequests > 0 && (
                    <span
                      aria-label="New requests"
                      className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full"
                      style={{ background: "var(--accent)" }}
                    />
                  )}
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
                <div className="relative">
                  <button
                    type="button"
                    className="ui-btn ui-icon-btn"
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    aria-haspopup="menu"
                    aria-expanded={userMenuOpen}
                    title={t("nav.account")}
                  >
                    <span
                      className="relative block h-7 w-7 overflow-hidden rounded-full border"
                      style={{
                        borderColor: "var(--divider)",
                        background: "var(--panel-surface)",
                      }}
                    >
                      {auth.user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={auth.user.avatarUrl}
                          alt="Profile"
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-xs font-bold">
                          {auth.user.name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </span>
                  </button>

                  {userMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border"
                      style={{
                        borderColor: "var(--divider)",
                        background: "var(--panel-surface)",
                        boxShadow: "var(--tile-shadow)",
                      }}
                      role="menu"
                    >
                      <div className="flex flex-col p-2">
                        <Link
                          href="/account"
                          className="ui-btn ui-btn-block"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          {t("nav.account")}
                        </Link>

                        {isTutor && (
                          <Link
                            href="/tutor/profile"
                            className="ui-btn ui-btn-block"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            {t("nav.profile")}
                          </Link>
                        )}

                        {isClient && (
                          <Link
                            href="/jobs/mine"
                            className="ui-btn ui-btn-block"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            {t("nav.myJobs")}
                          </Link>
                        )}

                        <Link
                          href="/contracts"
                          className="ui-btn ui-btn-block"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          {t("nav.contracts")}
                        </Link>

                        <Link
                          href="/auth/logout"
                          className="ui-btn ui-btn-block"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          {t("nav.logout")}
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
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
                  onClick={closeMenus}
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
                    {isTutor ? (
                      <>
                        <Link
                          href="/work"
                          className="ui-btn ui-btn-block"
                          onClick={closeMenus}
                        >
                          {t("nav.findWork")}
                        </Link>
                        <Link
                          href="/work/saved"
                          className="ui-btn ui-btn-block"
                          onClick={closeMenus}
                        >
                          {t("nav.savedJobs")}
                        </Link>
                        <Link
                          href="/work/proposals"
                          className="ui-btn ui-btn-block"
                          onClick={closeMenus}
                        >
                          {t("nav.proposals")}
                        </Link>
                        <Link
                          href="/contracts"
                          className="ui-btn ui-btn-block"
                          onClick={closeMenus}
                        >
                          {t("nav.contracts")}
                        </Link>
                      </>
                    ) : (
                      <Link
                        href="/tutors/search"
                        className="ui-btn ui-btn-block"
                        onClick={closeMenus}
                      >
                        {t("nav.search")}
                      </Link>
                    )}

                    {isClient && (
                      <>
                        <Link
                          href="/jobs/post"
                          className="ui-btn ui-btn-block"
                          onClick={closeMenus}
                        >
                          {t("nav.postJob")}
                        </Link>
                        <Link
                          href="/jobs/mine"
                          className="ui-btn ui-btn-block"
                          onClick={closeMenus}
                        >
                          {t("nav.myJobs")}
                        </Link>
                        <Link
                          href="/contracts"
                          className="ui-btn ui-btn-block"
                          onClick={closeMenus}
                        >
                          {t("nav.contracts")}
                        </Link>
                      </>
                    )}
                    {isTutor && (
                      <>
                        <Link
                          href="/tutor/profile"
                          className="ui-btn ui-btn-block"
                          onClick={closeMenus}
                        >
                          {t("nav.profile")}
                        </Link>
                        <Link
                          href="/tutor/requests"
                          className="ui-btn ui-btn-block"
                          onClick={closeMenus}
                        >
                          {t("nav.requests")}
                          {pendingRequests > 0 ? ` (${pendingRequests})` : ""}
                        </Link>
                      </>
                    )}

                    {!auth ? (
                      <>
                        <Link
                          href="/auth/login"
                          className="ui-btn ui-btn-block"
                          onClick={closeMenus}
                        >
                          {t("nav.login")}
                        </Link>
                        <Link
                          href="/auth/register"
                          className="ui-btn ui-btn-primary ui-btn-block"
                          onClick={closeMenus}
                        >
                          {t("nav.register")}
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/account"
                          className="ui-btn ui-btn-block"
                          onClick={closeMenus}
                        >
                          {t("nav.account")}
                        </Link>
                        <Link
                          href="/auth/logout"
                          className="ui-btn ui-btn-block"
                          onClick={closeMenus}
                        >
                          {t("nav.logout")}
                        </Link>
                      </>
                    )}

                    <div className="mt-3 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          toggleTheme();
                          closeMenus();
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
                          closeMenus();
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
