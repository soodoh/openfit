import { createFileRoute } from "@tanstack/react-router";

import { getAuthConfig } from "@/lib/auth-config";
import {
	isEmailPasswordRegistrationAllowedForBootstrapState,
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
				const bootstrapAvailable = await isFirstUserBootstrapAvailable();
				const registrationEnabled =
					isEmailPasswordRegistrationAllowedForBootstrapState(
						authConfig,
						bootstrapAvailable,
					);

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
