import { createAuthClient } from "better-auth/react";

export function resolveAuthBaseUrl(
	configuredAppUrl?: string,
	locationOrigin?: string,
): string {
	return String(locationOrigin ?? configuredAppUrl ?? "http://localhost:3000");
}

const appBaseURL = resolveAuthBaseUrl(
	import.meta.env.VITE_APP_URL,
	globalThis.location?.origin,
);

export const authClient = createAuthClient({
	baseURL: appBaseURL,
});

export const {
	signIn,
	signUp,
	signOut,
	useSession,
	getSession,
	// Social sign in
} = authClient;
