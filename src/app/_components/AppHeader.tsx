"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase";
import { useAuth, useI18n, useTheme } from "../providers";
import { BRAND_NAME } from "../../lib/brand";

function SunIcon() {
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
      width="18"
      height="18"
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
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="20"
      height="20"
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
      width="20"
      height="20"
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

function ChevronDownIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function AlertIcon() {
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
      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

export function AppHeader() {
  const { auth, sessionExpired } = useAuth();
  const { locale, setLocale, t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const supabase = useMemo(() => createClient(), []);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [workMenuOpen, setWorkMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<number>(0);
  const hasHydrated = useSyncExternalStore(
    () => () => {
      // no-op
    },
    () => true,
    () => false,
  );

  const effectiveTheme = hasHydrated ? theme : "dark";

  const role = auth?.user.role ?? null;
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
      if (!auth?.user.id || !isTutor) {
        setPendingRequests(0);
        return;
      }

      try {
        const { count, error } = await supabase
          .from("lesson_requests")
          .select("*", { count: "exact", head: true })
          .eq("tutor_id", auth.user.id)
          .eq("status", "PENDING");

        if (error) throw error;
        setPendingRequests(count || 0);
      } catch {
        setPendingRequests(0);
      }
    };

    void run();
  }, [auth?.user.id, isTutor, supabase]);

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 md:px-6">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-6 focus:z-[60] focus:rounded-md focus:border focus:bg-[var(--card)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>
      {sessionExpired && !auth && (
        <div className="mx-auto mb-2 mt-2 max-w-6xl animate-slide-down">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-xs font-medium text-amber-500 md:text-sm">
            <span className="flex items-center gap-2">
              <AlertIcon />
              Your session has expired. Please log in again.
            </span>
            <Link
              href="/auth/login"
              className="ui-btn ui-btn-primary h-8 px-4 text-xs whitespace-nowrap"
            >
              Log in
            </Link>
          </div>
        </div>
      )}
      <div className="mx-auto max-w-6xl">
        <div className="relative rounded-xl border border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-md shadow-sm">
          <div className="relative flex w-full flex-wrap items-center gap-3 md:flex-nowrap md:justify-between px-4 py-3 md:px-6">
            <div className="flex w-full items-center justify-between gap-2 md:w-auto md:gap-3">
              <button
                type="button"
                className="ui-btn ui-btn-ghost md:hidden px-2.5"
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
                className="flex flex-1 items-center justify-center gap-2 md:flex-auto md:justify-start group"
              >
                <span className="text-xl font-bold tracking-tight group-hover:text-[var(--accent)] transition-colors">
                  {BRAND_NAME}
                </span>
              </Link>
            </div>

            <nav
              className="hidden min-w-0 flex-1 items-center justify-end gap-1 md:flex lg:gap-2"
              aria-label="Primary navigation"
            >
              {isTutor ? (
                <div className="relative">
                  <button
                    type="button"
                    className="ui-btn ui-btn-ghost h-10"
                    onClick={() => setWorkMenuOpen((prev) => !prev)}
                    aria-expanded={workMenuOpen}
                    aria-haspopup="menu"
                  >
                    {t("nav.findWork")}
                    <ChevronDownIcon />
                  </button>

                  {workMenuOpen && (
                    <div
                      className="absolute right-0 mt-1 w-56 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg animate-scale-in"
                      role="menu"
                    >
                      <div className="flex flex-col p-1.5">
                        <Link
                          href="/work"
                          className="ui-btn ui-btn-ghost w-full justify-start h-10"
                          onClick={() => setWorkMenuOpen(false)}
                        >
                          {t("nav.jobs")}
                        </Link>
                        <Link
                          href="/work/saved"
                          className="ui-btn ui-btn-ghost w-full justify-start h-10"
                          onClick={() => setWorkMenuOpen(false)}
                        >
                          {t("nav.savedJobs")}
                        </Link>
                        <Link
                          href="/work/proposals"
                          className="ui-btn ui-btn-ghost w-full justify-start h-10"
                          onClick={() => setWorkMenuOpen(false)}
                        >
                          {t("nav.proposals")}
                        </Link>
                        <div className="h-px bg-[var(--border)] my-1" />
                        <Link
                          href="/contracts"
                          className="ui-btn ui-btn-ghost w-full justify-start h-10"
                          onClick={() => setWorkMenuOpen(false)}
                        >
                          {t("nav.contracts")}
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/tutors/search" className="ui-btn ui-btn-ghost h-10">
                  {t("nav.search")}
                </Link>
              )}

              {isClient && (
                <>
                  <Link href="/jobs/post" className="ui-btn ui-btn-ghost h-10">
                    {t("nav.postJob")}
                  </Link>
                  <Link href="/jobs/mine" className="ui-btn ui-btn-ghost h-10">
                    {t("nav.myJobs")}
                  </Link>
                  <Link href="/contracts" className="ui-btn ui-btn-ghost h-10">
                    {t("nav.contracts")}
                  </Link>
                </>
              )}

              {isTutor && (
                <Link href="/tutor/profile" className="ui-btn ui-btn-ghost h-10">
                  {t("nav.profile")}
                </Link>
              )}

              {isTutor && (
                <Link href="/tutor/requests" className="ui-btn ui-btn-ghost h-10 relative">
                  {t("nav.requests")}
                  {pendingRequests > 0 && (
                    <span
                      aria-label="New requests"
                      className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse-soft"
                    />
                  )}
                </Link>
              )}

              <div className="h-6 w-px bg-[var(--border)] mx-2" />

              {!auth ? (
                <>
                  <Link href="/auth/login" className="ui-btn ui-btn-ghost h-10">
                    {t("nav.login")}
                  </Link>
                  <Link href="/auth/register" className="ui-btn ui-btn-primary h-10">
                    {t("nav.register")}
                  </Link>
                </>
              ) : (
                <div className="relative">
                  <button
                    type="button"
                    className="ui-btn ui-btn-ghost px-2 h-10"
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    aria-haspopup="menu"
                    aria-expanded={userMenuOpen}
                    title={t("nav.account")}
                  >
                    <span className="relative block h-8 w-8 overflow-hidden rounded-full border border-[var(--border)] bg-[var(--input)]">
                      {auth.user.avatarUrl ? (
                        <img
                          src={auth.user.avatarUrl}
                          alt="Profile"
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-sm font-bold">
                          {auth.user.name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </span>
                  </button>

                  {userMenuOpen && (
                    <div
                      className="absolute right-0 mt-1 w-56 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg animate-scale-in"
                      role="menu"
                    >
                      <div className="flex flex-col p-1.5">
                        <div className="px-3 py-2.5 text-xs text-[var(--foreground)] opacity-60 truncate">
                          {auth.user.email}
                        </div>
                        <div className="h-px w-full bg-[var(--border)] my-1" />
                        <Link
                          href="/account"
                          className="ui-btn ui-btn-ghost w-full justify-start h-10"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          {t("nav.account")}
                        </Link>

                        {isTutor && (
                          <Link
                            href="/tutor/profile"
                            className="ui-btn ui-btn-ghost w-full justify-start h-10"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            {t("nav.profile")}
                          </Link>
                        )}

                        {isClient && (
                          <Link
                            href="/jobs/mine"
                            className="ui-btn ui-btn-ghost w-full justify-start h-10"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            {t("nav.myJobs")}
                          </Link>
                        )}

                        <Link
                          href="/contracts"
                          className="ui-btn ui-btn-ghost w-full justify-start h-10"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          {t("nav.contracts")}
                        </Link>

                        <div className="h-px w-full bg-[var(--border)] my-1" />

                        <Link
                          href="/auth/logout"
                          className="ui-btn ui-btn-ghost w-full justify-start h-10 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
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
                className="ui-btn ui-btn-ghost px-2.5 h-10"
                aria-label={
                  effectiveTheme === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
                title={effectiveTheme === "dark" ? "Light mode" : "Dark mode"}
              >
                <span className="opacity-85 hover:opacity-100 transition-opacity">
                  {effectiveTheme === "dark" ? <MoonIcon /> : <SunIcon />}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setLocale(locale === "en" ? "am" : "en")}
                className="ui-btn ui-btn-ghost px-2.5 h-10"
                aria-label={
                  locale === "en" ? "Switch to Amharic" : "Switch to English"
                }
                title={locale === "en" ? "AMH" : "ENG"}
              >
                <span className="opacity-85">
                  <GlobeIcon />
                </span>
                <span className="text-xs font-bold tracking-wide opacity-90 ml-1.5">
                  {locale === "en" ? "EN" : "AM"}
                </span>
              </button>
            </nav>

            {mobileOpen && (
              <div className="md:hidden">
                <div
                  className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in"
                  aria-hidden
                  onClick={closeMenus}
                />
                <div
                  className="fixed left-4 top-20 z-50 w-[88vw] max-w-xs rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-xl animate-slide-down"
                >
                  <div className="flex flex-col gap-1">
                    {isTutor ? (
                      <>
                        <Link
                          href="/work"
                          className="ui-btn ui-btn-ghost w-full justify-start h-11"
                          onClick={closeMenus}
                        >
                          {t("nav.findWork")}
                        </Link>
                        <Link
                          href="/work/saved"
                          className="ui-btn ui-btn-ghost w-full justify-start h-11"
                          onClick={closeMenus}
                        >
                          {t("nav.savedJobs")}
                        </Link>
                        <Link
                          href="/work/proposals"
                          className="ui-btn ui-btn-ghost w-full justify-start h-11"
                          onClick={closeMenus}
                        >
                          {t("nav.proposals")}
                        </Link>
                        <Link
                          href="/contracts"
                          className="ui-btn ui-btn-ghost w-full justify-start h-11"
                          onClick={closeMenus}
                        >
                          {t("nav.contracts")}
                        </Link>
                      </>
                    ) : (
                      <Link
                        href="/tutors/search"
                        className="ui-btn ui-btn-ghost w-full justify-start h-11"
                        onClick={closeMenus}
                      >
                        {t("nav.search")}
                      </Link>
                    )}

                    {isClient && (
                      <>
                        <Link
                          href="/jobs/post"
                          className="ui-btn ui-btn-ghost w-full justify-start h-11"
                          onClick={closeMenus}
                        >
                          {t("nav.postJob")}
                        </Link>
                        <Link
                          href="/jobs/mine"
                          className="ui-btn ui-btn-ghost w-full justify-start h-11"
                          onClick={closeMenus}
                        >
                          {t("nav.myJobs")}
                        </Link>
                        <Link
                          href="/contracts"
                          className="ui-btn ui-btn-ghost w-full justify-start h-11"
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
                          className="ui-btn ui-btn-ghost w-full justify-start h-11"
                          onClick={closeMenus}
                        >
                          {t("nav.profile")}
                        </Link>
                        <Link
                          href="/tutor/requests"
                          className="ui-btn ui-btn-ghost w-full justify-start h-11"
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
                          className="ui-btn ui-btn-ghost w-full justify-start h-11"
                          onClick={closeMenus}
                        >
                          {t("nav.login")}
                        </Link>
                        <Link
                          href="/auth/register"
                          className="ui-btn ui-btn-primary w-full justify-center h-11 mt-2"
                          onClick={closeMenus}
                        >
                          {t("nav.register")}
                        </Link>
                      </>
                    ) : (
                      <>
                        <div className="h-px w-full bg-[var(--border)] my-2" />
                        <Link
                          href="/account"
                          className="ui-btn ui-btn-ghost w-full justify-start h-11"
                          onClick={closeMenus}
                        >
                          {t("nav.account")}
                        </Link>
                        <Link
                          href="/auth/logout"
                          className="ui-btn ui-btn-ghost w-full justify-start h-11 text-red-500"
                          onClick={closeMenus}
                        >
                          {t("nav.logout")}
                        </Link>
                      </>
                    )}

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          toggleTheme();
                          closeMenus();
                        }}
                        className="ui-btn ui-btn-secondary flex-1 justify-center h-10"
                      >
                        {effectiveTheme === "dark" ? (
                          <span className="flex items-center gap-2"><MoonIcon /> Dark</span>
                        ) : (
                          <span className="flex items-center gap-2"><SunIcon /> Light</span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLocale(locale === "en" ? "am" : "en");
                          closeMenus();
                        }}
                        className="ui-btn ui-btn-secondary flex-1 justify-center h-10"
                      >
                        <span className="flex items-center gap-2 font-bold">
                          <GlobeIcon />
                          {locale === "en" ? "AMH" : "ENG"}
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
