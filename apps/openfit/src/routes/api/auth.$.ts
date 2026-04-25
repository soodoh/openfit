import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth";
import { getAuthConfig } from "@/lib/auth-config";
import {
	canRequestOidcAccountCreation,
	canRequestSocialAccountCreation,
	isEmailPasswordRegistrationAllowed,
} from "@/lib/auth-policy";

function isEmailSignUpRequest(request: Request): boolean {
	return (
		request.method === "POST" &&
		new URL(request.url).pathname.endsWith("/api/auth/sign-up/email")
	);
}

function isOidcSignInRequest(request: Request): boolean {
	return (
		request.method === "POST" &&
		new URL(request.url).pathname.endsWith("/api/auth/sign-in/oauth2")
	);
}

function isSocialSignInRequest(request: Request): boolean {
	return (
		request.method === "POST" &&
		new URL(request.url).pathname.endsWith("/api/auth/sign-in/social")
	);
}

async function readJsonBody(
	request: Request,
): Promise<Record<string, unknown>> {
	try {
		const body = await request.clone().json();
		return body && typeof body === "object" ? body : {};
	} catch {
		return {};
	}
}

async function enforceRegistrationPolicy(
	request: Request,
): Promise<Response | null> {
	const authConfig = getAuthConfig(process.env);

	if (isEmailSignUpRequest(request)) {
		const allowed = await isEmailPasswordRegistrationAllowed(authConfig);
		if (!allowed) {
			return Response.json(
				{ error: "Email/password registration is disabled" },
				{ status: 403 },
			);
		}
	}

	if (isOidcSignInRequest(request)) {
		const body = await readJsonBody(request);
		if (body.requestSignUp === true && typeof body.providerId === "string") {
			const allowed = await canRequestOidcAccountCreation(
				authConfig,
				body.providerId,
			);
			if (!allowed) {
				return Response.json(
					{ error: "Account creation is disabled for this OIDC provider" },
					{ status: 403 },
				);
			}
		}
	}

	if (isSocialSignInRequest(request)) {
		const body = await readJsonBody(request);
		if (body.requestSignUp === true) {
			const allowed = await canRequestSocialAccountCreation(authConfig);
			if (!allowed) {
				return Response.json(
					{ error: "Account creation is disabled for this provider" },
					{ status: 403 },
				);
			}
		}
	}

	return null;
}

export const Route = createFileRoute("/api/auth/$")({
	server: {
		handlers: {
			GET: async ({ request }: { request: Request }) => auth.handler(request),
			POST: async ({ request }: { request: Request }) => {
				const policyResponse = await enforceRegistrationPolicy(request);
				return policyResponse ?? auth.handler(request);
			},
		},
	},
});

export default Route;
