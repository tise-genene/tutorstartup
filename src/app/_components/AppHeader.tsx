"use client";

import { useEffect, useMemo, useState, useSyncExternalStore, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

function HomeIcon() {
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
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
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

function BriefcaseIcon() {
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
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
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

function BookOpenIcon() {
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
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function HelpCircleIcon() {
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
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function FileTextIcon() {
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
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  );
}

function HeartIcon() {
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
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function DollarSignIcon() {
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
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function SettingsIcon() {
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
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function LogOutIcon() {
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
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}

// Hook to close dropdowns when clicking outside
function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

export function AppHeader() {
  const { auth, sessionExpired } = useAuth();
  const { locale, setLocale, t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [workMenuOpen, setWorkMenuOpen] = useState(false);
  const [discoverMenuOpen, setDiscoverMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<number>(0);
  const hasHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const effectiveTheme = hasHydrated ? theme : "dark";

  const role = auth?.user.role ?? null;
  const isTutor = role === "TUTOR";
  const isClient = role === "PARENT" || role === "STUDENT";
  const homeHref = auth ? (isTutor ? "/work" : "/dashboard") : "/";

  const workMenuRef = useRef<HTMLDivElement>(null);
  const discoverMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useClickOutside(workMenuRef, () => setWorkMenuOpen(false));
  useClickOutside(discoverMenuRef, () => setDiscoverMenuOpen(false));
  useClickOutside(userMenuRef, () => setUserMenuOpen(false));

  const toggleMobile = () => setMobileOpen((prev) => !prev);
  const closeMenus = () => {
    setMobileOpen(false);
    setWorkMenuOpen(false);
    setDiscoverMenuOpen(false);
    setUserMenuOpen(false);
  };

  // Close menus when route changes
  useEffect(() => {
    closeMenus();
  }, [pathname]);

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

  // Subject categories for discover menu
  const subjectCategories = [
    { name: "Mathematics", href: "/tutors/search?subjects=Mathematics" },
    { name: "Physics", href: "/tutors/search?subjects=Physics" },
    { name: "Chemistry", href: "/tutors/search?subjects=Chemistry" },
    { name: "Biology", href: "/tutors/search?subjects=Biology" },
    { name: "English", href: "/tutors/search?subjects=English" },
    { name: "Programming", href: "/tutors/search?subjects=Programming" },
    { name: "SAT/ACT Prep", href: "/tutors/search?subjects=SAT" },
    { name: "IB & AP", href: "/tutors/search?subjects=IB,AP" },
  ];

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 md:px-6">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-6 focus:z-[60] focus:rounded-md focus:border focus:bg-[var(--card)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>
      {sessionExpired && !auth && (
        <div className="mx-auto mb-2 mt-2 max-w-7xl animate-slide-down">
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
      <div className="mx-auto max-w-7xl">
        <div className="relative rounded-xl border border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-lg shadow-sm">
          <div className="relative flex w-full flex-wrap items-center gap-3 md:flex-nowrap md:justify-between px-4 py-3 md:px-6">
            {/* Logo Section */}
            <div className="flex w-full items-center justify-between gap-2 md:w-auto md:gap-4">
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

            {/* Desktop Navigation */}
            <nav
              className="hidden min-w-0 flex-1 items-center justify-end gap-1 md:flex lg:gap-1"
              aria-label="Primary navigation"
            >
              {/* GUEST NAVIGATION */}
              {!auth && (
                <>
                  {/* Discover Dropdown */}
                  <div className="relative" ref={discoverMenuRef}>
                    <button
                      type="button"
                      className="ui-btn ui-btn-ghost h-10 text-sm"
                      onClick={() => setDiscoverMenuOpen((prev) => !prev)}
                      aria-expanded={discoverMenuOpen}
                      aria-haspopup="menu"
                    >
                      {t("nav.discover")}
                      <ChevronDownIcon />
                    </button>

                    {discoverMenuOpen && (
                      <div
                        className="absolute left-0 mt-2 w-64 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl animate-scale-in"
                        role="menu"
                      >
                        <div className="p-3">
                          <div className="px-2 py-1.5 text-xs font-semibold text-[var(--foreground)]/50 uppercase tracking-wider">
                            {t("nav.popularSubjects")}
                          </div>
                          <div className="mt-1 grid grid-cols-2 gap-1">
                            {subjectCategories.map((subject) => (
                              <Link
                                key={subject.name}
                                href={subject.href}
                                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] transition-colors"
                                onClick={() => setDiscoverMenuOpen(false)}
                              >
                                <BookOpenIcon />
                                {subject.name}
                              </Link>
                            ))}
                          </div>
                          <div className="mt-2 h-px bg-[var(--border)]" />
                          <Link
                            href="/tutors/search"
                            className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] transition-colors"
                            onClick={() => setDiscoverMenuOpen(false)}
                          >
                            <SearchIcon />
                            {t("nav.browseAll")}
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  <Link href="/tutors/search" className="ui-btn ui-btn-ghost h-10 text-sm">
                    <span className="flex items-center gap-1.5">
                      <SearchIcon />
                      {t("nav.search")}
                    </span>
                  </Link>

                  <Link href="/support" className="ui-btn ui-btn-ghost h-10 text-sm">
                    {t("nav.howItWorks")}
                  </Link>

                  <div className="h-6 w-px bg-[var(--border)] mx-1" />

                  <Link href="/auth/login" className="ui-btn ui-btn-ghost h-10 text-sm">
                    {t("nav.login")}
                  </Link>
                  <Link href="/auth/register" className="ui-btn ui-btn-primary h-10 text-sm">
                    {t("nav.register")}
                  </Link>
                </>
              )}

              {/* CLIENT NAVIGATION */}
              {isClient && (
                <>
                  {/* Discover Dropdown */}
                  <div className="relative" ref={discoverMenuRef}>
                    <button
                      type="button"
                      className="ui-btn ui-btn-ghost h-10 text-sm"
                      onClick={() => setDiscoverMenuOpen((prev) => !prev)}
                      aria-expanded={discoverMenuOpen}
                      aria-haspopup="menu"
                    >
                      {t("nav.findTutors")}
                      <ChevronDownIcon />
                    </button>

                    {discoverMenuOpen && (
                      <div
                        className="absolute left-0 mt-2 w-56 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl animate-scale-in"
                        role="menu"
                      >
                        <div className="flex flex-col p-1.5">
                          <Link
                            href="/tutors/search"
                            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] transition-colors"
                            onClick={() => setDiscoverMenuOpen(false)}
                          >
                            <SearchIcon />
                            {t("nav.browseAll")}
                          </Link>
                          <div className="h-px bg-[var(--border)] my-1" />
                          <div className="px-3 py-1.5 text-xs font-semibold text-[var(--foreground)]/50 uppercase">
                            {t("nav.bySubject")}
                          </div>
                          {subjectCategories.slice(0, 5).map((subject) => (
                            <Link
                              key={subject.name}
                              href={subject.href}
                              className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] transition-colors"
                              onClick={() => setDiscoverMenuOpen(false)}
                            >
                              <BookOpenIcon />
                              {subject.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <Link href="/jobs/post" className="ui-btn ui-btn-ghost h-10 text-sm">
                    <span className="flex items-center gap-1.5">
                      <FileTextIcon />
                      {t("nav.postJob")}
                    </span>
                  </Link>

                  <Link href="/jobs/mine" className="ui-btn ui-btn-ghost h-10 text-sm">
                    {t("nav.myJobs")}
                  </Link>

                  <Link href="/contracts" className="ui-btn ui-btn-ghost h-10 text-sm">
                    <span className="flex items-center gap-1.5">
                      <BriefcaseIcon />
                      {t("nav.contracts")}
                    </span>
                  </Link>

                  <Link href="/support" className="ui-btn ui-btn-ghost h-10 text-sm">
                    <HelpCircleIcon />
                  </Link>
                </>
              )}

              {/* TUTOR NAVIGATION */}
              {isTutor && (
                <>
                  <div className="relative" ref={workMenuRef}>
                    <button
                      type="button"
                      className="ui-btn ui-btn-ghost h-10 text-sm"
                      onClick={() => setWorkMenuOpen((prev) => !prev)}
                      aria-expanded={workMenuOpen}
                      aria-haspopup="menu"
                    >
                      <span className="flex items-center gap-1.5">
                        <BriefcaseIcon />
                        {t("nav.findWork")}
                        <ChevronDownIcon />
                      </span>
                    </button>

                    {workMenuOpen && (
                      <div
                        className="absolute left-0 mt-2 w-56 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl animate-scale-in"
                        role="menu"
                      >
                        <div className="flex flex-col p-1.5">
                          <Link
                            href="/work"
                            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] transition-colors"
                            onClick={() => setWorkMenuOpen(false)}
                          >
                            <SearchIcon />
                            {t("nav.availableJobs")}
                          </Link>
                          <Link
                            href="/work/saved"
                            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] transition-colors"
                            onClick={() => setWorkMenuOpen(false)}
                          >
                            <HeartIcon />
                            {t("nav.savedJobs")}
                          </Link>
                          <Link
                            href="/work/proposals"
                            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] transition-colors"
                            onClick={() => setWorkMenuOpen(false)}
                          >
                            <FileTextIcon />
                            {t("nav.myProposals")}
                          </Link>
                          <div className="h-px bg-[var(--border)] my-1" />
                          <Link
                            href="/contracts"
                            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] transition-colors"
                            onClick={() => setWorkMenuOpen(false)}
                          >
                            <BriefcaseIcon />
                            {t("nav.myContracts")}
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  <Link href="/tutor/profile" className="ui-btn ui-btn-ghost h-10 text-sm">
                    <span className="flex items-center gap-1.5">
                      <UserIcon />
                      {t("nav.profile")}
                    </span>
                  </Link>

                  <Link href="/tutor/requests" className="ui-btn ui-btn-ghost h-10 text-sm relative">
                    <span className="flex items-center gap-1.5">
                      <span className="relative">
                        {t("nav.requests")}
                        {pendingRequests > 0 && (
                          <span className="absolute -right-2.5 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse-soft">
                            {pendingRequests > 9 ? "9+" : pendingRequests}
                          </span>
                        )}
                      </span>
                    </span>
                  </Link>

                  <Link href="/support" className="ui-btn ui-btn-ghost h-10 text-sm">
                    <HelpCircleIcon />
                  </Link>
                </>
              )}

              {/* Common: Theme & Language Toggle */}
              <div className="h-6 w-px bg-[var(--border)] mx-1" />

              {/* User Menu (when authenticated) */}
              {auth && (
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    className="ui-btn ui-btn-ghost px-2 h-10"
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    aria-haspopup="menu"
                    aria-expanded={userMenuOpen}
                    title={t("nav.account")}
                  >
                    <span className="relative block h-8 w-8 overflow-hidden rounded-full border border-[var(--border)] bg-[var(--input)] ring-2 ring-transparent hover:ring-[var(--accent)]/30 transition-all">
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
                      className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl animate-scale-in"
                      role="menu"
                    >
                      <div className="flex flex-col p-2">
                        {/* User Info Header */}
                        <div className="px-3 py-3 border-b border-[var(--border)] mb-1">
                          <div className="font-semibold text-sm truncate">
                            {auth.user.name}
                          </div>
                          <div className="text-xs text-[var(--foreground)]/60 truncate">
                            {auth.user.email}
                          </div>
                          <div className="mt-1.5">
                            <span className="inline-flex items-center rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
                              {role === "TUTOR" ? t("nav.roleTutor") : t("nav.roleClient")}
                            </span>
                          </div>
                        </div>

                        <Link
                          href="/account"
                          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <SettingsIcon />
                          {t("nav.accountSettings")}
                        </Link>

                        {isTutor && (
                          <Link
                            href="/tutor/profile"
                            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <UserIcon />
                            {t("nav.editProfile")}
                          </Link>
                        )}

                        <Link
                          href="/contracts"
                          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <BriefcaseIcon />
                          {t("nav.myContracts")}
                        </Link>

                        <div className="h-px w-full bg-[var(--border)] my-1.5" />

                        <Link
                          href="/auth/logout"
                          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <LogOutIcon />
                          {t("nav.logout")}
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Theme Toggle */}
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

              {/* Language Toggle */}
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

            {/* Mobile Navigation */}
            {mobileOpen && (
              <div className="md:hidden">
                <div
                  className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in"
                  aria-hidden
                  onClick={closeMenus}
                />
                <div className="fixed left-0 top-0 z-50 h-full w-80 max-w-[85vw] border-r border-[var(--border)] bg-[var(--card)] shadow-2xl animate-slide-in-left">
                  {/* Mobile Header */}
                  <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                    <span className="text-lg font-bold">{BRAND_NAME}</span>
                    <button
                      type="button"
                      onClick={closeMenus}
                      className="ui-btn ui-btn-ghost p-2"
                      aria-label="Close menu"
                    >
                      <CloseIcon />
                    </button>
                  </div>

                  {/* Mobile Menu Content */}
                  <div className="flex flex-col gap-1 p-4 overflow-y-auto max-h-[calc(100vh-80px)]">
                    {/* GUEST MOBILE NAV */}
                    {!auth && (
                      <>
                        <Link
                          href="/"
                          className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-[var(--accent)]/10 transition-colors"
                          onClick={closeMenus}
                        >
                          <HomeIcon />
                          {t("nav.home")}
                        </Link>

                        <div className="mt-2 px-3 text-xs font-semibold text-[var(--foreground)]/50 uppercase tracking-wider">
                          {t("nav.popularSubjects")}
                        </div>
                        {subjectCategories.map((subject) => (
                          <Link
                            key={subject.name}
                            href={subject.href}
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-[var(--accent)]/10 transition-colors"
                            onClick={closeMenus}
                          >
                            <BookOpenIcon />
                            {subject.name}
                          </Link>
                        ))}

                        <div className="h-px w-full bg-[var(--border)] my-3" />

                        <Link
                          href="/tutors/search"
                          className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-[var(--accent)]/10 transition-colors"
                          onClick={closeMenus}
                        >
                          <SearchIcon />
                          {t("nav.browseAll")}
                        </Link>

                        <Link
                          href="/support"
                          className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-[var(--accent)]/10 transition-colors"
                          onClick={closeMenus}
                        >
                          <HelpCircleIcon />
                          {t("nav.howItWorks")}
                        </Link>

                        <div className="h-px w-full bg-[var(--border)] my-3" />

                        <Link
                          href="/auth/login"
                          className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-[var(--accent)]/10 transition-colors"
                          onClick={closeMenus}
                        >
                          {t("nav.login")}
                        </Link>
                        <Link
                          href="/auth/register"
                          className="flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] text-white px-3 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
                          onClick={closeMenus}
                        >
                          {t("nav.register")}
                        </Link>
                      </>
                    )}

                    {/* CLIENT MOBILE NAV */}
                    {isClient && (
                      <>
                        <div className="mb-2 px-3 py-2 bg-[var(--accent)]/5 rounded-lg">
                          <div className="font-semibold text-sm">{auth?.user.name}</div>
                          <div className="text-xs text-[var(--foreground)]/60">{auth?.user.email}</div>
                        </div>

                        <Link
                          href="/dashboard"
                          className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-[var(--accent)]/10 transition-colors"
                          onClick={closeMenus}
                        >
                          <HomeIcon />
                          {t("nav.dashboard")}
                        </Link>

                        <Link
                          href="/tutors/search"
                          className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-[var(--accent)]/10 transition-colors"
                          onClick={closeMenus}
                        >
                          <SearchIcon />
                          {t("nav.findTutors")}
                        </Link>

                        <Link
                          href="/jobs/post"
                          className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-[var(--accent)]/10 transition-colors"
                          onClick={closeMenus}
                        >
                          <FileTextIcon />
                          {t("nav.postJob")}
                        </Link>

                        <Link
                          href="/jobs/mine"
                          className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-[var(--accent)]/10 transition-colors"
                          onClick={closeMenus}
                        >
                          <BriefcaseIcon />
                          {t("nav.myJobs")}
                        </Link>

                        <Link
                          href="/contracts"
                          className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-[var(--accent)]/10 transition-colors"
                          onClick={closeMenus}
                        >
                          <DollarSignIcon />
                          {t("nav.contracts")}
                        </Link>

                        <div className="h-px w-full bg-[var(--border)] my-3" />

                        <Link
                          href="/account"
                          className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-[var(--accent)]/10 transition-colors"
                          onClick={closeMenus}
                        >
                          <SettingsIcon />
                          {t("nav.account")}
                        </Link>

                        <Link
                          href="/support"
                          className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-[var(--accent)]/10 transition-colors"
                          onClick={closeMenus}
                        >
                          <HelpCircleIcon />
                          {t("nav.support")}
                        </Link>

                        <div className="h-px w-full bg-[var(--border)] my-3" />

                        <Link
                          href="/auth/logout"
                          className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          onClick={closeMenus}
                        >
                          <LogOutIcon />
                          {t("nav.logout")}
                        </Link>
                      </>
                    )}

                    {/* TUTOR MOBILE NAV */}
                    {isTutor && (
                      <>
                        <div className="mb-2 px-3 py-2 bg-[var(--accent)]/5 rounded-lg">
                          <div className="font-semibold text-sm">{auth?.user.name}</div>
                          <div className="text-xs text-[var(--foreground)]/60">{auth?.user.email}</div>
                        </div>

                        <Link
                          href="/work"
                          className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-[var(--accent)]/10 transition-colors"
                          onClick={closeMenus}
                        >
                          <BriefcaseIcon />
                          {t("nav.findWork")}
                        </Link>

                        <Link
                          href="/work/proposals"
                          className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-[var(--accent)]/10 transition-colors"
                          onClick={closeMenus}
                        >
                          <FileTextIcon />
                          {t("nav.proposals")}
                        </Link>

                        <Link
                          href="/work/saved"
                          className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-[var(--accent)]/10 transition-colors"
                          onClick={closeMenus}
                        >
                          <HeartIcon />
                          {t("nav.savedJobs")}
                        </Link>

                        <Link
                          href="/contracts"
                          className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-[var(--accent)]/10 transition-colors"
                          onClick={closeMenus}
                        >
                          <DollarSignIcon />
                          {t("nav.contracts")}
                        </Link>

                        <div className="h-px w-full bg-[var(--border)] my-3" />

                        <Link
                          href="/tutor/profile"
                          className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-[var(--accent)]/10 transition-colors"
                          onClick={closeMenus}
                        >
                          <UserIcon />
                          {t("nav.profile")}
                        </Link>

                        <Link
                          href="/tutor/requests"
                          className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-[var(--accent)]/10 transition-colors"
                          onClick={closeMenus}
                        >
                          <span className="relative">
                            {t("nav.requests")}
                            {pendingRequests > 0 && (
                              <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1.5">
                                {pendingRequests}
                              </span>
                            )}
                          </span>
                        </Link>

                        <div className="h-px w-full bg-[var(--border)] my-3" />

                        <Link
                          href="/account"
                          className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-[var(--accent)]/10 transition-colors"
                          onClick={closeMenus}
                        >
                          <SettingsIcon />
                          {t("nav.account")}
                        </Link>

                        <Link
                          href="/support"
                          className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-[var(--accent)]/10 transition-colors"
                          onClick={closeMenus}
                        >
                          <HelpCircleIcon />
                          {t("nav.support")}
                        </Link>

                        <div className="h-px w-full bg-[var(--border)] my-3" />

                        <Link
                          href="/auth/logout"
                          className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          onClick={closeMenus}
                        >
                          <LogOutIcon />
                          {t("nav.logout")}
                        </Link>
                      </>
                    )}

                    {/* Mobile Settings */}
                    <div className="mt-4 pt-4 border-t border-[var(--border)]">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            toggleTheme();
                          }}
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm hover:bg-[var(--accent)]/5 transition-colors"
                        >
                          {effectiveTheme === "dark" ? <MoonIcon /> : <SunIcon />}
                          {effectiveTheme === "dark" ? t("nav.darkMode") : t("nav.lightMode")}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setLocale(locale === "en" ? "am" : "en");
                          }}
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm hover:bg-[var(--accent)]/5 transition-colors"
                        >
                          <GlobeIcon />
                          {locale === "en" ? "Amharic" : "English"}
                        </button>
                      </div>
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
