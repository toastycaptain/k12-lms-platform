"use client";

import { createContext, useCallback, useContext } from "react";
import { apiFetch, type CurrentUser } from "@/lib/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  error: null,
  signOut: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: swrUser, error: swrError, isLoading, mutate: mutateCurrentUser } = useCurrentUser();

  const refresh = useCallback(async () => {
    await mutateCurrentUser();
  }, [mutateCurrentUser]);

  const signOut = useCallback(async () => {
    try {
      await apiFetch("/api/v1/session", { method: "DELETE" });
    } finally {
      await mutateCurrentUser(undefined, false);
    }
  }, [mutateCurrentUser]);

  const user = swrUser ?? null;
  const loading = isLoading;
  const error = swrError?.message || null;

  return (
    <AuthContext.Provider value={{ user, loading, error, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
