import { genericOAuthClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_APP_URL || "http://localhost:3000",
  plugins: [genericOAuthClient()],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  // Social sign in
} = authClient;
