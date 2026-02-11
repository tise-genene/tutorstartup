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
import type { AuthenticatedUser, AuthResponse, LoginPayload, RegisterPayload } from "../lib/types";
import { createClient } from "../lib/supabase";

type AuthContextValue = {
    auth: AuthResponse | null;
    login: (payload: LoginPayload) => Promise<AuthResponse>;
    register: (payload: RegisterPayload) => Promise<{ ok: true }>;
    logout: () => Promise<void>;
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
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                const user: AuthenticatedUser = {
                    id: session.user.id,
                    email: session.user.email!,
                    name: session.user.user_metadata.name || session.user.email!.split("@")[0],
                    role: session.user.user_metadata.role || "STUDENT",
                    isVerified: !!session.user.email_confirmed_at,
                    avatarUrl: session.user.user_metadata.avatarUrl || null,
                };
                setAuth({ accessToken: session.access_token, user });
                setSessionExpired(false);
            } else {
                setAuth(null);
                if (event === "SIGNED_OUT") {
                    setSessionExpired(false);
                }
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase]);

    const login = useCallback(
        async (payload: LoginPayload) => {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: payload.email,
                password: payload.password,
            });

            if (error) throw error;

            if (!data.session) {
                throw new Error("Login failed: No session returned");
            }

            const user: AuthenticatedUser = {
                id: data.session.user.id,
                email: data.session.user.email!,
                name: data.session.user.user_metadata.name || data.session.user.email!.split("@")[0],
                role: data.session.user.user_metadata.role || "STUDENT",
                isVerified: !!data.session.user.email_confirmed_at,
                avatarUrl: data.session.user.user_metadata.avatarUrl || null,
            };

            const response: AuthResponse = {
                accessToken: data.session.access_token,
                user,
            };

            setAuth(response);
            return response;
        },
        [supabase],
    );

    const register = useCallback(
        async (payload: RegisterPayload) => {
            console.log("Registering with:", {
                email: payload.email,
                options: {
                    data: {
                        name: payload.name,
                        role: payload.role || "STUDENT",
                    },
                },
            });
            const { error } = await supabase.auth.signUp({
                email: payload.email,
                password: payload.password,
                options: {
                    data: {
                        name: payload.name,
                        role: payload.role || "STUDENT",
                    },
                },
            });

            if (error) {
                console.error("Supabase SignUp Error:", error);
                throw error;
            }

            return { ok: true as const };
        },
        [supabase],
    );

    const logout = useCallback(async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setAuth(null);
    }, [supabase]);

    const authValue = useMemo<AuthContextValue>(
        () => ({
            auth,
            login,
            register,
            logout,
            sessionExpired,
        }),
        [auth, login, register, logout, sessionExpired],
    );

    return (
        <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
    );
}
