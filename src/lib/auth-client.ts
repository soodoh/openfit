import { genericOAuthClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const appBaseURL =
  import.meta.env.VITE_APP_URL ||
  globalThis.location?.origin ||
  "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL: appBaseURL,
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
