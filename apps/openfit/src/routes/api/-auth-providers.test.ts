import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getProviderStatus: vi.fn() }));
vi.mock("@/lib/auth-policy", () => ({
	registrationPolicy: { getProviderStatus: mocks.getProviderStatus },
}));

import AuthProvidersRoute from "@/routes/api/auth/providers";

const handlers = AuthProvidersRoute.options.server?.handlers as {
	GET: () => Promise<Response>;
};

describe("provider status adapter", () => {
	it("serializes the owned provider status without recomputing policy", async () => {
		const status = {
			emailPassword: { signInEnabled: true, registrationEnabled: true },
			bootstrapAvailable: true,
			providers: [
				{
					id: "company",
					name: "Company login",
					type: "oidc",
					allowAccountCreation: false,
					requestSignUp: true,
				},
			],
		};
		mocks.getProviderStatus.mockResolvedValue(status);
		const response = await handlers.GET();
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual(status);
	});
	it("does not invent registration permission when status cannot be obtained", async () => {
		mocks.getProviderStatus.mockRejectedValueOnce(
			new Error("Database unavailable"),
		);
		await expect(handlers.GET()).rejects.toThrow("Database unavailable");
	});
});
