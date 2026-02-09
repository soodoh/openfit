"use client";

import { authClient } from "@/lib/auth-client";
import { createContext, type ReactNode, useContext } from "react";

// Re-export the session hook and other auth utilities
export const useSession = authClient.useSession;
export const signIn = authClient.signIn;
export const signUp = authClient.signUp;
export const signOut = authClient.signOut;

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, isPending } = useSession();

  const value = {
    isAuthenticated: !!session,
    isLoading: isPending,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
