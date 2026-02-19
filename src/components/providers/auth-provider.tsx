/* eslint-disable eslint-plugin-react(jsx-no-constructed-context-values), eslint-plugin-unicorn(filename-case), typescript-eslint(explicit-module-boundary-types) */

import { authClient } from "@/lib/auth-client";
import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

// Re-export the session hook and other auth utilities
export const useSession = authClient.useSession;
export const signIn = authClient.signIn;
export const signUp = authClient.signUp;
export const signOut = authClient.signOut;

type AuthContextType = {
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

type AuthProviderProps = {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, isPending } = useSession();

  const value = {
    isAuthenticated: Boolean(session),
    isLoading: isPending,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
