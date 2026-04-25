type EnvSource = Record<string, string | undefined>;

export type SocialProviderConfig = {
	clientId: string;
	clientSecret: string;
};

export type OidcProviderConfig = {
	providerId: string;
	displayName: string;
	clientId: string;
	clientSecret: string;
	issuer: string;
	discoveryUrl: string;
	scopes: string[];
	pkce: true;
	allowAccountCreation: boolean;
};

export type AuthConfig = {
	registration: {
		disableAll: boolean;
		disableEmailPassword: boolean;
	};
	emailPassword: {
		enabled: true;
	};
	socialProviders: Partial<
		Record<"google" | "github" | "discord", SocialProviderConfig>
	>;
	oidcProviders: OidcProviderConfig[];
};

const DEFAULT_OIDC_SCOPES = ["openid", "email", "profile"];

function getRequiredEnvValue(value: string | undefined): string | null {
	const normalizedValue = value?.trim();
	return normalizedValue ? normalizedValue : null;
}

function getBooleanEnvValue(value: string | undefined): boolean {
	const normalizedValue = value?.trim().toLowerCase();
	return normalizedValue === "true" || normalizedValue === "1";
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

function getOidcProviderIndexes(env: EnvSource): number[] {
	const indexes = new Set<number>();

	for (const key of Object.keys(env)) {
		const match = /^OIDC_(\d+)_/.exec(key);

		if (match) {
			indexes.add(Number(match[1]));
		}
	}

	return [...indexes].sort((first, second) => first - second);
}

function getOidcScopes(value: string | undefined): string[] {
	const scopes = getRequiredEnvValue(value)
		?.split(",")
		.map((scope) => scope.trim())
		.filter(Boolean);

	return scopes?.length ? scopes : [...DEFAULT_OIDC_SCOPES];
}

function getIndexedOidcProviderConfig(
	env: EnvSource,
	index: number,
): OidcProviderConfig | null {
	const prefix = `OIDC_${index}`;
	const providerId = getRequiredEnvValue(env[`${prefix}_PROVIDER_ID`]);
	const clientId = getRequiredEnvValue(env[`${prefix}_CLIENT_ID`]);
	const clientSecret = getRequiredEnvValue(env[`${prefix}_CLIENT_SECRET`]);
	const issuer = getRequiredEnvValue(env[`${prefix}_ISSUER`]);

	if (!providerId || !clientId || !clientSecret || !issuer) {
		return null;
	}

	const displayName =
		getRequiredEnvValue(env[`${prefix}_PROVIDER_NAME`]) ?? providerId;

	return {
		providerId,
		displayName,
		clientId,
		clientSecret,
		issuer,
		discoveryUrl: `${issuer}/.well-known/openid-configuration`,
		scopes: getOidcScopes(env[`${prefix}_SCOPES`]),
		pkce: true,
		allowAccountCreation: getBooleanEnvValue(
			env[`${prefix}_ALLOW_ACCOUNT_CREATION`],
		),
	};
}

export function getAuthConfig(env: EnvSource): AuthConfig {
	return {
		registration: {
			disableAll: getBooleanEnvValue(env.DISABLE_REGISTRATION),
			disableEmailPassword: getBooleanEnvValue(
				env.DISABLE_EMAIL_PASSWORD_REGISTRATION,
			),
		},
		emailPassword: {
			enabled: true,
		},
		socialProviders: getSocialProviderConfigs(env),
		oidcProviders: getOidcProviderIndexes(env)
			.map((index) => getIndexedOidcProviderConfig(env, index))
			.filter((provider): provider is OidcProviderConfig => provider !== null),
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
		providerId: "oidc",
		displayName: "oidc",
		clientId,
		clientSecret,
		issuer,
		discoveryUrl: `${issuer}/.well-known/openid-configuration`,
		scopes: [...DEFAULT_OIDC_SCOPES],
		pkce: true,
		allowAccountCreation: false,
	};
}
