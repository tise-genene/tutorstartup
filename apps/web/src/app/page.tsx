"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  fetchTutorProfile,
  loginUser,
  registerUser,
  searchTutors,
  upsertTutorProfile,
} from "../lib/api";
import type {
  AuthResponse,
  RegisterPayload,
  TutorProfile,
  TutorSearchResult,
  UserRole,
} from "../lib/types";

const subjectLibrary = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Writing",
  "SAT Prep",
];

const initialProfileForm = {
  bio: "",
  subjects: "Mathematics, Physics",
  languages: "English",
  hourlyRate: "",
  location: "Addis Ababa",
};

const initialSearchForm = {
  q: "",
  subjects: "Mathematics",
  location: "",
  limit: 20,
  page: 1,
};

const panelTitleStyles = "text-lg font-semibold tracking-tight";

export default function Home() {
  const [auth, setAuth] = useState<AuthResponse | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [registerForm, setRegisterForm] = useState<
    RegisterPayload & {
      role: UserRole;
    }
  >({
    name: "",
    email: "",
    password: "",
    role: "STUDENT",
  });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [profileForm, setProfileForm] = useState(initialProfileForm);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [tutorProfile, setTutorProfile] = useState<TutorProfile | null>(null);
  const [searchForm, setSearchForm] = useState(initialSearchForm);
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<TutorSearchResult | null>(
    null
  );

  const token = auth?.accessToken ?? null;
  const isTutor = useMemo(() => auth?.user.role === "TUTOR", [auth?.user.role]);

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();
    setAuthMessage("Creating account...");
    try {
      const response = await registerUser(registerForm);
      setAuth(response);
      setAuthMessage("Welcome aboard! Access token ready.");
      if (response.user.role === "TUTOR") {
        await hydrateTutorProfile(response.accessToken);
      } else {
        setTutorProfile(null);
      }
    } catch (error) {
      setAuth(null);
      setAuthMessage((error as Error).message);
    }
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setAuthMessage("Signing in...");
    try {
      const response = await loginUser(loginForm);
      setAuth(response);
      setAuthMessage("Authenticated. Tokens refreshed.");
      if (response.user.role === "TUTOR") {
        await hydrateTutorProfile(response.accessToken);
      } else {
        setTutorProfile(null);
      }
    } catch (error) {
      setAuth(null);
      setAuthMessage((error as Error).message);
    }
  };

  const hydrateTutorProfile = async (accessToken: string) => {
    try {
      const profile = await fetchTutorProfile(accessToken);
      setTutorProfile(profile);
      setProfileForm({
        bio: profile.bio ?? "",
        subjects: profile.subjects.join(", "),
        languages: profile.languages.join(", ") || "English",
        hourlyRate: profile.hourlyRate?.toString() ?? "",
        location: profile.location ?? "",
      });
    } catch (error) {
      setProfileStatus((error as Error).message);
    }
  };

  const handleUpsertProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) {
      setProfileStatus("Login required");
      return;
    }
    setProfileStatus("Saving profile...");
    try {
      const payload = {
        bio: profileForm.bio.trim() || undefined,
        subjects: parseCsv(profileForm.subjects),
        languages: parseCsv(profileForm.languages),
        hourlyRate: parseNumber(profileForm.hourlyRate),
        location: profileForm.location.trim() || undefined,
      };
      const updated = await upsertTutorProfile(token, payload);
      setTutorProfile(updated);
      setProfileStatus("Profile synced to Meilisearch queue.");
    } catch (error) {
      setProfileStatus((error as Error).message);
    }
  };

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    setSearchStatus("Searching tutors...");
    try {
      const payload = {
        query: searchForm.q.trim() || undefined,
        location: searchForm.location.trim() || undefined,
        limit: searchForm.limit,
        page: searchForm.page,
        subjects: parseCsv(searchForm.subjects),
      };
      const result = await searchTutors(payload);
      setSearchResult(result);
      setSearchStatus(
        result.meta.searchEnabled
          ? result.meta.cacheHit
            ? "Served from cache"
            : "Live search hit"
          : "Search driver disabled"
      );
    } catch (error) {
      setSearchStatus((error as Error).message);
    }
  };

  const handleLogout = () => {
    setAuth(null);
    setTutorProfile(null);
    setAuthMessage("Session cleared");
  };

  return (
    <div className="min-h-screen px-4 py-10 text-white md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <section className="glass-panel p-10">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex flex-1 flex-col gap-4">
              <span className="pill bg-white/5 text-xs text-white/80">
                Tutorstartup playground
              </span>
              <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
                Wire up auth, tutor profiles & search without leaving this page.
              </h1>
              <p className="text-base text-white/70">
                The forms below talk directly to the NestJS API. Every
                registration fires a welcome-email job, tutor updates enqueue a
                Meilisearch sync, and search queries hit Redis-backed caching.
              </p>
            </div>
            <div className="glass-panel flex flex-col gap-3 rounded-2xl border-white/20 bg-white/10 px-6 py-5 sm:w-64">
              <p className="text-sm uppercase tracking-[0.2em] text-white/60">
                Active user
              </p>
              {auth ? (
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-white">
                    {auth.user.name}
                  </p>
                  <p className="text-sm text-white/70">{auth.user.email}</p>
                  <p className="text-sm text-white/60">
                    Role: {auth.user.role}
                  </p>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-white/80 underline underline-offset-4"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <p className="text-sm text-white/60">
                  Not authenticated — use the forms below to register or sign
                  in.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-3">
          <article className="glass-panel flex flex-col gap-8 p-8">
            <header>
              <h2 className={panelTitleStyles}>Register</h2>
              <p className="text-sm text-white/60">
                Creates a user and queues a welcome email job.
              </p>
            </header>
            <form className="space-y-4" onSubmit={handleRegister}>
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40"
                placeholder="Full name"
                value={registerForm.name}
                onChange={(event) =>
                  setRegisterForm({ ...registerForm, name: event.target.value })
                }
                required
              />
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40"
                placeholder="Email"
                type="email"
                value={registerForm.email}
                onChange={(event) =>
                  setRegisterForm({
                    ...registerForm,
                    email: event.target.value,
                  })
                }
                required
              />
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40"
                placeholder="Password (min 8 chars)"
                type="password"
                value={registerForm.password}
                onChange={(event) =>
                  setRegisterForm({
                    ...registerForm,
                    password: event.target.value,
                  })
                }
                required
                minLength={8}
              />
              <label className="flex flex-col gap-1 text-sm text-white/70">
                Role
                <select
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white"
                  value={registerForm.role}
                  onChange={(event) =>
                    setRegisterForm({
                      ...registerForm,
                      role: event.target.value as UserRole,
                    })
                  }
                >
                  <option value="STUDENT">Student</option>
                  <option value="TUTOR">Tutor</option>
                </select>
              </label>
              <button className="w-full rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-slate-900 transition hover:opacity-90">
                Create account
              </button>
            </form>
            <div className="text-xs text-white/60">{authMessage}</div>

            <div className="h-px w-full bg-white/10" />

            <header>
              <h2 className={panelTitleStyles}>Login</h2>
              <p className="text-sm text-white/60">
                Retrieves new tokens and loads the tutor profile when relevant.
              </p>
            </header>
            <form className="space-y-4" onSubmit={handleLogin}>
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40"
                placeholder="Email"
                type="email"
                value={loginForm.email}
                onChange={(event) =>
                  setLoginForm({ ...loginForm, email: event.target.value })
                }
                required
              />
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40"
                placeholder="Password"
                type="password"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm({ ...loginForm, password: event.target.value })
                }
                required
                minLength={8}
              />
              <button className="w-full rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
                Sign in
              </button>
            </form>
          </article>

          <article className="glass-panel flex flex-col gap-6 p-8">
            <header>
              <h2 className={panelTitleStyles}>Tutor profile</h2>
              <p className="text-sm text-white/60">
                Available once a tutor is logged in. Saves the profile and
                triggers the BullMQ search queue.
              </p>
            </header>
            <form className="space-y-4" onSubmit={handleUpsertProfile}>
              <textarea
                className="h-24 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40"
                placeholder="Bio"
                value={profileForm.bio}
                disabled={!isTutor}
                onChange={(event) =>
                  setProfileForm({ ...profileForm, bio: event.target.value })
                }
              />
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40"
                placeholder="Subjects (comma separated)"
                value={profileForm.subjects}
                disabled={!isTutor}
                onChange={(event) =>
                  setProfileForm({
                    ...profileForm,
                    subjects: event.target.value,
                  })
                }
              />
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40"
                placeholder="Languages"
                value={profileForm.languages}
                disabled={!isTutor}
                onChange={(event) =>
                  setProfileForm({
                    ...profileForm,
                    languages: event.target.value,
                  })
                }
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40"
                  placeholder="Hourly rate"
                  value={profileForm.hourlyRate}
                  disabled={!isTutor}
                  onChange={(event) =>
                    setProfileForm({
                      ...profileForm,
                      hourlyRate: event.target.value,
                    })
                  }
                />
                <input
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40"
                  placeholder="Location"
                  value={profileForm.location}
                  disabled={!isTutor}
                  onChange={(event) =>
                    setProfileForm({
                      ...profileForm,
                      location: event.target.value,
                    })
                  }
                />
              </div>
              <button
                className="w-full rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!isTutor}
              >
                Save profile
              </button>
              <p className="text-xs text-white/60">{profileStatus}</p>
            </form>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                Quick subject chips
              </p>
              <div className="flex flex-wrap gap-2">
                {subjectLibrary.map((subject) => (
                  <button
                    key={subject}
                    className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/80"
                    type="button"
                    disabled={!isTutor}
                    onClick={() =>
                      setProfileForm((prev) => ({
                        ...prev,
                        subjects: upsertCsv(prev.subjects, subject),
                      }))
                    }
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>

            {tutorProfile && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/70">
                <p>
                  Last synced:{" "}
                  {new Date(tutorProfile.updatedAt).toLocaleString()}
                </p>
                <p>Subjects: {tutorProfile.subjects.join(", ") || "—"}</p>
              </div>
            )}
            {!isTutor && (
              <p className="text-sm text-white/60">
                Switch your role to Tutor during registration to unlock this
                panel.
              </p>
            )}
          </article>

          <article className="glass-panel flex flex-col gap-6 p-8">
            <header>
              <h2 className={panelTitleStyles}>Tutor search</h2>
              <p className="text-sm text-white/60">
                Calls{" "}
                <code className="font-mono text-xs">/v1/tutors/search</code> and
                highlights cache hits.
              </p>
            </header>
            <form className="space-y-4" onSubmit={handleSearch}>
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40"
                placeholder="Keywords"
                value={searchForm.q}
                onChange={(event) =>
                  setSearchForm({ ...searchForm, q: event.target.value })
                }
              />
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40"
                placeholder="Subjects"
                value={searchForm.subjects}
                onChange={(event) =>
                  setSearchForm({ ...searchForm, subjects: event.target.value })
                }
              />
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40"
                placeholder="Location"
                value={searchForm.location}
                onChange={(event) =>
                  setSearchForm({ ...searchForm, location: event.target.value })
                }
              />
              <div className="grid grid-cols-2 gap-4 text-sm text-white/60">
                <label className="flex flex-col gap-1">
                  Limit
                  <input
                    type="number"
                    min={1}
                    max={50}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                    value={searchForm.limit}
                    onChange={(event) =>
                      setSearchForm({
                        ...searchForm,
                        limit: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  Page
                  <input
                    type="number"
                    min={1}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                    value={searchForm.page}
                    onChange={(event) =>
                      setSearchForm({
                        ...searchForm,
                        page: Number(event.target.value),
                      })
                    }
                  />
                </label>
              </div>
              <button className="w-full rounded-xl bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white">
                Search
              </button>
              <p className="text-xs text-white/60">{searchStatus}</p>
            </form>

            {searchResult && (
              <div className="space-y-4">
                <div className="flex items-baseline justify-between text-xs text-white/60">
                  <span>
                    {searchResult.data.length} of {searchResult.meta.total}{" "}
                    matches
                  </span>
                  <span>
                    {searchResult.meta.cacheHit ? "Cache hit" : "Fresh query"} ·
                    page {searchResult.meta.page}
                  </span>
                </div>
                <div className="space-y-3">
                  {searchResult.data.map((hit) => (
                    <div
                      key={hit.id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <p className="text-base font-semibold text-white">
                        {hit.name}
                      </p>
                      <p className="text-sm text-white/70">
                        {hit.location || "Remote"} ·{" "}
                        {hit.hourlyRate
                          ? `$${hit.hourlyRate}/hr`
                          : "Custom rate"}
                      </p>
                      <p
                        className="mt-2 text-sm text-white/70"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {hit.bio || "No bio yet"}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/80">
                        {hit.subjects.map((subject) => (
                          <span
                            key={`${hit.id}-${subject}`}
                            className="rounded-full border border-white/15 px-2 py-0.5"
                          >
                            {subject}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {searchResult.data.length === 0 && (
                    <p className="text-sm text-white/60">
                      No tutors match this filter set yet.
                    </p>
                  )}
                </div>
              </div>
            )}
          </article>
        </section>
      </div>
    </div>
  );
}

function parseCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function upsertCsv(existing: string, nextValue: string): string {
  const values = new Set(parseCsv(existing));
  values.add(nextValue);
  return Array.from(values).join(", ");
}

function parseNumber(value: string): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
