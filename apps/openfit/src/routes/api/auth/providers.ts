import { createFileRoute } from "@tanstack/react-router";
import { registrationPolicy } from "@/lib/auth-policy";

export const Route = createFileRoute("/api/auth/providers")({
	server: {
		handlers: {
			GET: async () =>
				Response.json(await registrationPolicy.getProviderStatus()),
		},
	},
});

export default Route;
