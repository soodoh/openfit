import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth";
import { registrationPolicy } from "@/lib/auth-policy";

export const Route = createFileRoute("/api/auth/$")({
	server: {
		handlers: {
			GET: async ({ request }: { request: Request }) => auth.handler(request),
			POST: async ({ request }: { request: Request }) => {
				const denial = await registrationPolicy.checkRequest(request);
				return denial
					? Response.json({ error: denial.message }, { status: 403 })
					: auth.handler(request);
			},
		},
	},
});

export default Route;
