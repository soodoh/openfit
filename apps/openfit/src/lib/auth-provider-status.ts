import { z } from "zod";

export const AuthProviderStatusSchema = z
	.object({
		emailPassword: z.object({
			signInEnabled: z.boolean(),
			registrationEnabled: z.boolean(),
		}),
		bootstrapAvailable: z.boolean(),
		providers: z.array(
			z.object({
				id: z.string().min(1),
				name: z.string().min(1),
				type: z.enum(["social", "oidc"]),
				allowAccountCreation: z.boolean().optional(),
				requestSignUp: z.boolean(),
			}),
		),
	})
	.refine(
		(status) =>
			!status.bootstrapAvailable || status.emailPassword.registrationEnabled,
	);

export type AuthProviderStatus = z.infer<typeof AuthProviderStatusSchema>;
export type AuthProvider = AuthProviderStatus["providers"][number];
