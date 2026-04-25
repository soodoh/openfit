import { createFileRoute } from "@tanstack/react-router";

import { getAuthConfig } from "@/lib/auth-config";
import {
	isEmailPasswordRegistrationAllowed,
	isFirstUserBootstrapAvailable,
} from "@/lib/auth-policy";

const socialProviderNames = {
	google: "Google",
	github: "GitHub",
	discord: "Discord",
} as const;

export const Route = createFileRoute("/api/auth/providers")({
	server: {
		handlers: {
			GET: async () => {
				const authConfig = getAuthConfig(process.env);
				const [registrationEnabled, bootstrapAvailable] = await Promise.all([
					isEmailPasswordRegistrationAllowed(authConfig),
					isFirstUserBootstrapAvailable(),
				]);

				return Response.json({
					emailPassword: {
						signInEnabled: authConfig.emailPassword.enabled,
						registrationEnabled,
					},
					bootstrapAvailable,
					providers: [
						...Object.keys(authConfig.socialProviders).map((id) => ({
							id,
							name: socialProviderNames[id as keyof typeof socialProviderNames],
							type: "social" as const,
						})),
						...authConfig.oidcProviders.map((provider) => ({
							id: provider.providerId,
							name: provider.displayName,
							type: "oidc" as const,
							allowAccountCreation: provider.allowAccountCreation,
						})),
					],
				});
			},
		},
	},
});

export default Route;
