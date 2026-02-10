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
import type { AuthResponse, LoginPayload, RegisterPayload } from "../lib/types";
import {
  fetchMe,
  loginUser,
  logoutSession,
  refreshSession,
  registerUser,
} from "../lib/api";
import { STORAGE_PREFIX } from "../lib/brand";

export const WAS_LOGGED_KEY = `${STORAGE_PREFIX}.wasLoggedIn`;

type AuthContextValue = {
  auth: AuthResponse | null;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<{ ok: true }>;
  logout: () => Promise<void>;
  consumeAccessToken: (accessToken: string) => Promise<AuthResponse>;
  sessionExpired: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthResponse | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const run = async () => {
      const wasLoggedInBefore =
        typeof window !== "undefined" &&
        window.localStorage.getItem(WAS_LOGGED_KEY) === "1";

      try {
        const refreshed = await refreshSession();
        setAuth(refreshed);
        setSessionExpired(false);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(WAS_LOGGED_KEY, "1");
        }
      } catch {
        if (wasLoggedInBefore) {
          setSessionExpired(true);
        }
      }
    };

    void run();
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await loginUser(payload);
    setAuth(response);
    setSessionExpired(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(WAS_LOGGED_KEY, "1");
    }
    return response;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const result = await registerUser(payload);
    return result;
  }, []);

  const consumeAccessToken = useCallback(async (accessToken: string) => {
    const user = await fetchMe(accessToken);
    const response: AuthResponse = { accessToken, user };
    setAuth(response);
    setSessionExpired(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(WAS_LOGGED_KEY, "1");
    }
    return response;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutSession();
    } catch {
      // Ignore API errors on logout
    } finally {
      setAuth(null);
      setSessionExpired(false);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(WAS_LOGGED_KEY);
      }
    }
  }, []);

  const authValue = useMemo<AuthContextValue>(
    () => ({
      auth,
      login,
      register,
      logout,
      consumeAccessToken,
      sessionExpired,
    }),
    [auth, login, register, logout, consumeAccessToken, sessionExpired],
  );

  return (
    <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
  );
}
