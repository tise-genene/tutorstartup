"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { AuthResponse } from "../lib/types";
import { loginUser, registerUser } from "../lib/api";
import type { LoginPayload, RegisterPayload } from "../lib/types";

type Theme = "dark" | "light";
type Locale = "en" | "am";

const THEME_KEY = "tutorstartup.theme";
const LOCALE_KEY = "tutorstartup.locale";
const AUTH_KEY = "tutorstartup.auth";

type Dictionary = Record<string, string>;

const DICTS: Record<Locale, Dictionary> = {
  en: {
    "nav.home": "Home",
    "nav.search": "Find tutors",
    "nav.profile": "Tutor profile",
    "nav.login": "Login",
    "nav.register": "Register",
    "nav.logout": "Log out",

    "home.title": "Find the right tutor, fast.",
    "home.subtitle":
      "Search tutors, review profiles, and message to start a lesson.",
    "home.cta.search": "Search tutors",
    "home.cta.tutor": "I’m a tutor",

    "auth.login.title": "Welcome back",
    "auth.login.subtitle": "Sign in to continue.",
    "auth.login.footer": "No account?",
    "auth.login.footer.link": "Register",
    "auth.register.title": "Create your account",
    "auth.register.subtitle": "Join as a student or a tutor.",
    "auth.register.footer": "Already have an account?",
    "auth.register.footer.link": "Login",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.name": "Full name",
    "auth.role": "Role",
    "auth.role.student": "Student",
    "auth.role.tutor": "Tutor",
    "auth.submit.login": "Sign in",
    "auth.submit.register": "Create account",
    "auth.login.submit": "Sign in",
    "auth.register.submit": "Create account",

    "tutor.profile.title": "Tutor profile",
    "tutor.profile.subtitle":
      "Update your profile — changes will be indexed for search.",
    "tutor.profile.bio": "Bio",
    "tutor.profile.subjects": "Subjects (comma separated)",
    "tutor.profile.languages": "Languages (comma separated)",
    "tutor.profile.hourlyRate": "Hourly rate",
    "tutor.profile.location": "Location",
    "tutor.profile.save": "Save profile",

    "profile.title": "Tutor profile",
    "profile.subtitle":
      "Update your profile — changes will be indexed for search.",
    "profile.bio": "Bio",
    "profile.subjects": "Subjects (comma separated)",
    "profile.languages": "Languages (comma separated)",
    "profile.hourlyRate": "Hourly rate",
    "profile.location": "Location",
    "profile.save": "Save profile",
    "profile.saved": "Saved. Sync queued.",
    "profile.lastUpdated": "Last updated",
    "profile.guard.login": "Please log in to edit your tutor profile.",
    "profile.guard.tutorOnly": "This page is for tutors only.",
    "profile.guard.cta.login": "Login",
    "profile.guard.cta.search": "Search tutors",

    "search.title": "Tutor search",
    "search.subtitle": "Filter by keyword, subject, and location.",
    "search.keywords": "Keywords",
    "search.keyword": "Keywords",
    "search.subjects": "Subjects (comma separated)",
    "search.location": "Location",
    "search.limit": "Limit",
    "search.page": "Page",
    "search.submit": "Search",
    "search.results": "Results",
    "search.empty": "Run a search to see matching tutors.",
    "search.noResults": "No tutors match this filter set yet.",
    "search.remote": "Remote",
    "search.customRate": "Custom rate",
    "search.noBio": "No bio yet",
    "search.meta.disabled": "Search driver disabled",
    "search.meta.cache": "Served from cache",
    "search.meta.live": "Live search hit",

    "state.loading": "Loading…",
    "common.loading": "Loading…",
    "state.loginRequired": "Login required",
    "state.tutorOnly": "This page is for tutors.",
  },
  am: {
    "nav.home": "መነሻ",
    "nav.search": "አስተማሪ ፈልግ",
    "nav.profile": "የአስተማሪ ፕሮፋይል",
    "nav.login": "ግባ",
    "nav.register": "መመዝገብ",
    "nav.logout": "ውጣ",

    "home.title": "ትክክለኛውን አስተማሪ በፍጥነት ያግኙ።",
    "home.subtitle": "አስተማሪ ፈልጉ፣ ፕሮፋይሎችን ይመልከቱ እና መልዕክት ይላኩ።",
    "home.cta.search": "አስተማሪ ፈልግ",
    "home.cta.tutor": "እኔ አስተማሪ ነኝ",

    "auth.login.title": "እንኳን ተመለሱ",
    "auth.login.subtitle": "ለመቀጠል ይግቡ።",
    "auth.login.footer": "መለያ የለዎትም?",
    "auth.login.footer.link": "መመዝገብ",
    "auth.register.title": "መለያ ፍጠር",
    "auth.register.subtitle": "እንደ ተማሪ ወይም እንደ አስተማሪ ይቀላቀሉ።",
    "auth.register.footer": "ቀድሞ መለያ አለዎት?",
    "auth.register.footer.link": "ግባ",
    "auth.email": "ኢሜይል",
    "auth.password": "የይለፍ ቃል",
    "auth.name": "ሙሉ ስም",
    "auth.role": "ሚና",
    "auth.role.student": "ተማሪ",
    "auth.role.tutor": "አስተማሪ",
    "auth.submit.login": "ግባ",
    "auth.submit.register": "መለያ ፍጠር",
    "auth.login.submit": "ግባ",
    "auth.register.submit": "መለያ ፍጠር",

    "tutor.profile.title": "የአስተማሪ ፕሮፋይል",
    "tutor.profile.subtitle": "ፕሮፋይልዎን ያዘምኑ — ለፍለጋ ይመዘገባል።",
    "tutor.profile.bio": "ማብራሪያ",
    "tutor.profile.subjects": "ርዕሶች (በኮማ ለይተው)",
    "tutor.profile.languages": "ቋንቋዎች (በኮማ ለይተው)",
    "tutor.profile.hourlyRate": "የሰዓት ክፍያ",
    "tutor.profile.location": "አካባቢ",
    "tutor.profile.save": "ፕሮፋይል አስቀምጥ",

    "profile.title": "የአስተማሪ ፕሮፋይል",
    "profile.subtitle": "ፕሮፋይልዎን ያዘምኑ — ለፍለጋ ይመዘገባል።",
    "profile.bio": "ማብራሪያ",
    "profile.subjects": "ርዕሶች (በኮማ ለይተው)",
    "profile.languages": "ቋንቋዎች (በኮማ ለይተው)",
    "profile.hourlyRate": "የሰዓት ክፍያ",
    "profile.location": "አካባቢ",
    "profile.save": "ፕሮፋይል አስቀምጥ",
    "profile.saved": "ተቀምጧል። ለፍለጋ ማስተካከያ ተላክ።",
    "profile.lastUpdated": "መጨረሻ ማዘመን",
    "profile.guard.login": "የአስተማሪ ፕሮፋይልዎን ለማስተካከል መጀመሪያ ይግቡ።",
    "profile.guard.tutorOnly": "ይህ ገጽ ለአስተማሪዎች ብቻ ነው።",
    "profile.guard.cta.login": "ግባ",
    "profile.guard.cta.search": "አስተማሪ ፈልግ",

    "search.title": "የአስተማሪ ፍለጋ",
    "search.subtitle": "በቁልፍ ቃላት፣ ርዕሶች እና አካባቢ ያጣሩ።",
    "search.keywords": "ቁልፍ ቃላት",
    "search.keyword": "ቁልፍ ቃላት",
    "search.subjects": "ርዕሶች (በኮማ ለይተው)",
    "search.location": "አካባቢ",
    "search.limit": "መጠን",
    "search.page": "ገጽ",
    "search.submit": "ፈልግ",
    "search.results": "ውጤቶች",
    "search.empty": "ተመሳሳይ አስተማሪዎችን ለማየት ፈልጉ።",
    "search.noResults": "ከእነዚህ ማጣሪያዎች ጋር የሚመሳሰል አስተማሪ የለም።",
    "search.remote": "ርቀት",
    "search.customRate": "የተለየ ክፍያ",
    "search.noBio": "ማብራሪያ የለም",
    "search.meta.disabled": "የፍለጋ አገልግሎት ተሰናክሏል",
    "search.meta.cache": "ከካሽ ተገኝቷል",
    "search.meta.live": "ቀጥታ ፍለጋ",

    "state.loading": "በመጫን ላይ…",
    "common.loading": "በመጫን ላይ…",
    "state.loginRequired": "መጀመሪያ ግባ",
    "state.tutorOnly": "ይህ ገጽ ለአስተማሪዎች ብቻ ነው።",
  },
};

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function useI18n(): I18nContextValue {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error("useI18n must be used within Providers");
  }
  return value;
}

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useTheme must be used within Providers");
  }
  return value;
}

type AuthContextValue = {
  auth: AuthResponse | null;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within Providers");
  }
  return value;
}

export function Providers({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [locale, setLocaleState] = useState<Locale>("en");
  const [auth, setAuth] = useState<AuthResponse | null>(null);

  useEffect(() => {
    const storedTheme =
      (localStorage.getItem(THEME_KEY) as Theme | null) ?? null;
    const storedLocale =
      (localStorage.getItem(LOCALE_KEY) as Locale | null) ?? null;
    const storedAuthRaw = localStorage.getItem(AUTH_KEY);

    const resolvedTheme: Theme = storedTheme ?? "dark";
    const resolvedLocale: Locale = storedLocale ?? "en";

    setThemeState(resolvedTheme);
    setLocaleState(resolvedLocale);

    if (storedAuthRaw) {
      try {
        setAuth(JSON.parse(storedAuthRaw) as AuthResponse);
      } catch {
        localStorage.removeItem(AUTH_KEY);
      }
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = locale;
    localStorage.setItem(LOCALE_KEY, locale);
  }, [locale]);

  const setTheme = useCallback((next: Theme) => setThemeState(next), []);
  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const setLocale = useCallback((next: Locale) => setLocaleState(next), []);

  const t = useCallback(
    (key: string) => {
      return DICTS[locale][key] ?? DICTS.en[key] ?? key;
    },
    [locale]
  );

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await loginUser(payload);
    setAuth(response);
    localStorage.setItem(AUTH_KEY, JSON.stringify(response));
    return response;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await registerUser(payload);
    setAuth(response);
    localStorage.setItem(AUTH_KEY, JSON.stringify(response));
    return response;
  }, []);

  const logout = useCallback(() => {
    setAuth(null);
    localStorage.removeItem(AUTH_KEY);
  }, []);

  const i18nValue = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  const themeValue = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  const authValue = useMemo<AuthContextValue>(
    () => ({ auth, login, register, logout }),
    [auth, login, register, logout]
  );

  return (
    <ThemeContext.Provider value={themeValue}>
      <I18nContext.Provider value={i18nValue}>
        <AuthContext.Provider value={authValue}>
          {children}
        </AuthContext.Provider>
      </I18nContext.Provider>
    </ThemeContext.Provider>
  );
}
