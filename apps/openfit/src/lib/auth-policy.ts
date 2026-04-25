import { db } from "@/db";
import type { AuthConfig, OidcProviderConfig } from "@/lib/auth-config";

export async function isFirstUserBootstrapAvailable(): Promise<boolean> {
	const existingUser = await db.query.users.findFirst();
	return !existingUser;
}

export async function isEmailPasswordRegistrationAllowed(
	config: AuthConfig,
): Promise<boolean> {
	if (await isFirstUserBootstrapAvailable()) {
		return true;
	}

	return (
		!config.registration.disableAll && !config.registration.disableEmailPassword
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

	if (await isFirstUserBootstrapAvailable()) {
		return true;
	}

	return provider.allowAccountCreation;
}
