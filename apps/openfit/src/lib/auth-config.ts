type EnvSource = Record<string, string | undefined>;

export type SocialProviderConfig = {
	clientId: string;
	clientSecret: string;
};

export type OidcProviderConfig = {
	clientId: string;
	clientSecret: string;
	discoveryUrl: string;
	scopes: string[];
	pkce: true;
};

function getRequiredEnvValue(value: string | undefined): string | null {
	const normalizedValue = value?.trim();
	return normalizedValue ? normalizedValue : null;
}

function getCredentialPair(
	clientId: string | undefined,
	clientSecret: string | undefined,
): SocialProviderConfig | null {
	const normalizedClientId = getRequiredEnvValue(clientId);
	const normalizedClientSecret = getRequiredEnvValue(clientSecret);

	if (!normalizedClientId || !normalizedClientSecret) {
		return null;
	}

	return {
		clientId: normalizedClientId,
		clientSecret: normalizedClientSecret,
	};
}

export function getSocialProviderConfigs(
	env: EnvSource,
): Partial<Record<"google" | "github" | "discord", SocialProviderConfig>> {
	const google = getCredentialPair(env.AUTH_GOOGLE_ID, env.AUTH_GOOGLE_SECRET);
	const github = getCredentialPair(env.AUTH_GITHUB_ID, env.AUTH_GITHUB_SECRET);
	const discord = getCredentialPair(
		env.AUTH_DISCORD_ID,
		env.AUTH_DISCORD_SECRET,
	);

	return {
		...(google ? { google } : {}),
		...(github ? { github } : {}),
		...(discord ? { discord } : {}),
	};
}

export function getOidcProviderConfig(
	env: EnvSource,
): OidcProviderConfig | null {
	const clientId = getRequiredEnvValue(env.AUTH_OIDC_CLIENT_ID);
	const clientSecret = getRequiredEnvValue(env.AUTH_OIDC_CLIENT_SECRET);
	const issuer = getRequiredEnvValue(env.AUTH_OIDC_ISSUER);

	if (!clientId || !clientSecret || !issuer) {
		return null;
	}

	return {
		clientId,
		clientSecret,
		discoveryUrl: `${issuer}/.well-known/openid-configuration`,
		scopes: ["openid", "email", "profile"],
		pkce: true,
	};
}
