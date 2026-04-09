import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	requireAuth: vi.fn(),
	getOptionalSession: vi.fn(),
	findFirstUserProfile: vi.fn(),
	findFirstGym: vi.fn(),
	updateUserProfiles: vi.fn(),
	updateUserProfilesSet: vi.fn(),
	updateUserProfilesWhere: vi.fn(),
	eq: vi.fn((left, right) => ({ type: "eq", left, right })),
	and: vi.fn((...conditions) => ({ type: "and", conditions })),
	schema: {
		userProfiles: {
			id: "user_profiles.id",
			userId: "user_profiles.user_id",
		},
		gyms: {
			id: "gyms.id",
			userId: "gyms.user_id",
		},
	},
}));

vi.mock("drizzle-orm", () => ({
	and: mocks.and,
	eq: mocks.eq,
}));

vi.mock("@/db", () => ({
	db: {
		query: {
			userProfiles: {
				findFirst: mocks.findFirstUserProfile,
			},
			gyms: {
				findFirst: mocks.findFirstGym,
			},
		},
		update: mocks.updateUserProfiles,
	},
}));

vi.mock("@/db/schema", () => ({
	schema: mocks.schema,
}));

vi.mock("@/lib/auth-middleware", () => ({
	getOptionalSession: mocks.getOptionalSession,
	requireAuth: mocks.requireAuth,
}));

import UserProfileRoute from "@/routes/api/user-profile";

const handlers = UserProfileRoute.options.server?.handlers as {
	GET: (args: { request: Request }) => Promise<Response>;
	PATCH: (args: { request: Request }) => Promise<Response>;
};

describe("GET /api/user-profile", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.getOptionalSession.mockResolvedValue(null);
		mocks.findFirstUserProfile.mockResolvedValue(null);
	});

	it("returns null when there is no session", async () => {
		const response = await handlers.GET({
			request: new Request("http://localhost/api/user-profile"),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toBeNull();
		expect(mocks.findFirstUserProfile).not.toHaveBeenCalled();
	});

	it("returns null when the user profile is missing", async () => {
		mocks.getOptionalSession.mockResolvedValue({ user: { id: "user_123" } });
		mocks.findFirstUserProfile.mockResolvedValue(null);

		const response = await handlers.GET({
			request: new Request("http://localhost/api/user-profile"),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toBeNull();
		expect(mocks.findFirstUserProfile).toHaveBeenCalledWith({
			where: {
				type: "eq",
				left: mocks.schema.userProfiles.userId,
				right: "user_123",
			},
			with: {
				defaultRepetitionUnit: true,
				defaultWeightUnit: true,
				defaultGym: true,
			},
		});
	});

	it("returns the populated profile when it exists", async () => {
		mocks.getOptionalSession.mockResolvedValue({ user: { id: "user_123" } });
		mocks.findFirstUserProfile.mockResolvedValue({
			id: "profile_123",
			userId: "user_123",
			theme: "dark",
			defaultRepetitionUnit: { id: "repetition_kg" },
			defaultWeightUnit: { id: "weight_kg" },
			defaultGym: { id: "gym_123" },
		});

		const response = await handlers.GET({
			request: new Request("http://localhost/api/user-profile"),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			id: "profile_123",
			userId: "user_123",
			theme: "dark",
			defaultRepetitionUnit: { id: "repetition_kg" },
			defaultWeightUnit: { id: "weight_kg" },
			defaultGym: { id: "gym_123" },
		});
	});
});

describe("PATCH /api/user-profile", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.findFirstUserProfile.mockReset();
		mocks.findFirstGym.mockReset();
		mocks.findFirstUserProfile.mockImplementation(({ with: relations }) =>
			relations
				? {
						id: "profile_123",
						userId: "user_123",
						theme: "dark",
						defaultRepetitionUnit: { id: "repetition_kg" },
						defaultWeightUnit: { id: "weight_kg" },
						defaultGym: { id: "gym_123" },
					}
				: {
						id: "profile_123",
						userId: "user_123",
						defaultGymId: "gym_123",
					},
		);
		mocks.updateUserProfiles.mockReturnValue({
			set: mocks.updateUserProfilesSet,
		});
		mocks.updateUserProfilesSet.mockReturnValue({
			where: mocks.updateUserProfilesWhere,
		});
		mocks.updateUserProfilesWhere.mockResolvedValue(undefined);
		mocks.findFirstUserProfile
			.mockResolvedValueOnce({
				id: "profile_123",
				userId: "user_123",
			})
			.mockResolvedValueOnce({
				id: "profile_123",
				userId: "user_123",
				theme: "dark",
				defaultRepetitionUnit: { id: "repetition_kg" },
				defaultWeightUnit: { id: "weight_kg" },
				defaultGym: { id: "gym_123" },
			});
		mocks.findFirstGym.mockResolvedValue({
			id: "gym_123",
			userId: "user_123",
		});
	});

	it("returns the auth response when authentication throws a Response", async () => {
		const authResponse = Response.json({ error: "Denied" }, { status: 403 });
		mocks.requireAuth.mockRejectedValue(authResponse);

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/user-profile", {
				method: "PATCH",
				body: JSON.stringify({ theme: "dark" }),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Denied" });
		expect(mocks.updateUserProfiles).not.toHaveBeenCalled();
	});

	it("returns 401 when authentication fails unexpectedly", async () => {
		mocks.requireAuth.mockRejectedValue(new Error("boom"));

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/user-profile", {
				method: "PATCH",
				body: JSON.stringify({ theme: "dark" }),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.updateUserProfiles).not.toHaveBeenCalled();
	});

	it("returns 404 when the profile is missing", async () => {
		mocks.findFirstUserProfile.mockReset();
		mocks.findFirstUserProfile.mockImplementation(() => null);

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/user-profile", {
				method: "PATCH",
				body: JSON.stringify({ theme: "dark" }),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toEqual({
			error: "Profile not found",
		});
		expect(mocks.findFirstGym).not.toHaveBeenCalled();
		expect(mocks.updateUserProfiles).not.toHaveBeenCalled();
	});

	it("returns 400 when the default gym does not exist", async () => {
		mocks.findFirstGym.mockResolvedValue(null);

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/user-profile", {
				method: "PATCH",
				body: JSON.stringify({ defaultGymId: "gym_missing" }),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual({
			error: "Default gym not found",
		});
		expect(mocks.findFirstGym).toHaveBeenCalledWith({
			where: expect.objectContaining({
				type: "and",
				conditions: expect.arrayContaining([
					expect.objectContaining({
						type: "eq",
						left: mocks.schema.gyms.id,
						right: "gym_missing",
					}),
					expect.objectContaining({
						type: "eq",
						left: mocks.schema.gyms.userId,
						right: "user_123",
					}),
				]),
			}),
		});
		expect(mocks.updateUserProfiles).not.toHaveBeenCalled();
	});

	it("updates only the fields that were provided", async () => {
		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/user-profile", {
				method: "PATCH",
				body: JSON.stringify({
					theme: "dark",
					defaultRepetitionUnitId: "repetition_kg",
					defaultWeightUnitId: "weight_kg",
				}),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			id: "profile_123",
			userId: "user_123",
			theme: "dark",
			defaultRepetitionUnit: { id: "repetition_kg" },
			defaultWeightUnit: { id: "weight_kg" },
			defaultGym: { id: "gym_123" },
		});
		expect(mocks.updateUserProfilesSet).toHaveBeenCalledWith(
			expect.objectContaining({
				theme: "dark",
				defaultRepetitionUnitId: "repetition_kg",
				defaultWeightUnitId: "weight_kg",
				updatedAt: expect.any(Date),
			}),
		);
		expect(
			Object.hasOwn(
				mocks.updateUserProfilesSet.mock.calls[0][0],
				"defaultGymId",
			),
		).toBe(false);
	});

	it("allows clearing the default gym with null", async () => {
		mocks.findFirstUserProfile.mockReset();
		mocks.findFirstUserProfile.mockImplementation(({ with: relations }) =>
			relations
				? {
						id: "profile_123",
						userId: "user_123",
						defaultGymId: null,
						defaultGym: null,
					}
				: {
						id: "profile_123",
						userId: "user_123",
						defaultGymId: "gym_123",
					},
		);

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/user-profile", {
				method: "PATCH",
				body: JSON.stringify({ defaultGymId: null }),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			id: "profile_123",
			userId: "user_123",
			defaultGymId: null,
			defaultGym: null,
		});
		expect(mocks.findFirstGym).not.toHaveBeenCalled();
		expect(mocks.updateUserProfilesSet).toHaveBeenCalledWith(
			expect.objectContaining({
				defaultGymId: null,
				updatedAt: expect.any(Date),
			}),
		);
	});

	it("returns 500 when updating the profile throws an unexpected error", async () => {
		mocks.updateUserProfilesWhere.mockRejectedValue(new Error("boom"));

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/user-profile", {
				method: "PATCH",
				body: JSON.stringify({ theme: "dark" }),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to update profile",
		});
	});

	it("returns the error response when updating throws a Response", async () => {
		const updateResponse = Response.json({ error: "Denied" }, { status: 418 });
		mocks.updateUserProfilesWhere.mockRejectedValue(updateResponse);

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/user-profile", {
				method: "PATCH",
				body: JSON.stringify({ theme: "dark" }),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(418);
		await expect(response.json()).resolves.toEqual({ error: "Denied" });
	});
});
