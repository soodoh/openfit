import { authClient } from "@/lib/auth-client";
import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
// Re-export the session hook and other auth utilities
export const useSession = authClient.useSession;
export const signIn = authClient.signIn;
export const signUp = authClient.signUp;
export const signOut = authClient.signOut;
type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
};
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
});
export function useAuth(): any {
  return useContext(AuthContext);
}
type AuthProviderProps = {
  children: ReactNode;
};
export function AuthProvider({ children }: AuthProviderProps): any {
  const { data: session, isPending } = useSession();
  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(session),
      isLoading: isPending,
    }),
    [session, isPending],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
