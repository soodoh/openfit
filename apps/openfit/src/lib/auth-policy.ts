import { db } from "@/db";
import type { AuthConfig, OidcProviderConfig } from "@/lib/auth-config";

export async function isFirstUserBootstrapAvailable(): Promise<boolean> {
	const existingUser = await db.query.users.findFirst();
	return !existingUser;
}

export function isEmailPasswordRegistrationAllowedForBootstrapState(
	config: AuthConfig,
	bootstrapAvailable: boolean,
): boolean {
	if (
		!config.registration.disableAll &&
		!config.registration.disableEmailPassword
	) {
		return true;
	}

	return bootstrapAvailable;
}

export async function isEmailPasswordRegistrationAllowed(
	config: AuthConfig,
): Promise<boolean> {
	if (
		!config.registration.disableAll &&
		!config.registration.disableEmailPassword
	) {
		return true;
	}

	return isEmailPasswordRegistrationAllowedForBootstrapState(
		config,
		await isFirstUserBootstrapAvailable(),
	);
}

export function getAuthProviderById(
	config: AuthConfig,
	providerId: string,
): OidcProviderConfig | undefined {
	return config.oidcProviders.find(
		(provider) => provider.providerId === providerId,
	);
}

export async function canRequestOidcAccountCreation(
	config: AuthConfig,
	providerId: string,
): Promise<boolean> {
	const provider = getAuthProviderById(config, providerId);
	if (!provider) {
		return false;
	}

	if (provider.allowAccountCreation) {
		return true;
	}

	return isFirstUserBootstrapAvailable();
}

export async function canRequestSocialAccountCreation(
	config: AuthConfig,
): Promise<boolean> {
	if (!config.registration.disableAll) {
		return true;
	}

	return isFirstUserBootstrapAvailable();
}
