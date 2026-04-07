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
	PATCH: (args: { request: Request }) => Promise<Response>;
};

describe("PATCH /api/user-profile", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.getOptionalSession.mockResolvedValue({ user: { id: "user_123" } });
		mocks.updateUserProfiles.mockReturnValue({
			set: mocks.updateUserProfilesSet,
		});
		mocks.updateUserProfilesSet.mockReturnValue({
			where: mocks.updateUserProfilesWhere,
		});
		mocks.updateUserProfilesWhere.mockResolvedValue(undefined);
	});

	it("returns 400 when the default gym belongs to another user", async () => {
		mocks.findFirstUserProfile.mockResolvedValue({
			id: "profile_123",
			userId: "user_123",
		});
		mocks.findFirstGym.mockImplementation(({ where }) => {
			if (
				where.type === "eq" &&
				where.left === mocks.schema.gyms.id &&
				where.right === "gym_other_user"
			) {
				return {
					id: "gym_other_user",
					userId: "user_999",
					name: "Other User Gym",
				};
			}

			if (
				where.type === "and" &&
				where.conditions.some(
					(condition) =>
						condition.type === "eq" &&
						condition.left === mocks.schema.gyms.id &&
						condition.right === "gym_other_user",
				) &&
				where.conditions.some(
					(condition) =>
						condition.type === "eq" &&
						condition.left === mocks.schema.gyms.userId &&
						condition.right === "user_123",
				)
			) {
				return null;
			}

			return null;
		});

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/user-profile", {
				method: "PATCH",
				body: JSON.stringify({ defaultGymId: "gym_other_user" }),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual({
			error: "Default gym not found",
		});
		expect(mocks.updateUserProfiles).not.toHaveBeenCalled();
		expect(mocks.findFirstGym).toHaveBeenCalledWith({
			where: expect.objectContaining({
				type: "and",
				conditions: expect.arrayContaining([
					expect.objectContaining({
						type: "eq",
						left: mocks.schema.gyms.id,
						right: "gym_other_user",
					}),
					expect.objectContaining({
						type: "eq",
						left: mocks.schema.gyms.userId,
						right: "user_123",
					}),
				]),
			}),
		});
	});

	it("returns 400 when the default gym does not exist", async () => {
		mocks.findFirstUserProfile.mockResolvedValue({
			id: "profile_123",
			userId: "user_123",
		});
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

	it("accepts an owned default gym id", async () => {
		mocks.findFirstUserProfile
			.mockResolvedValueOnce({
				id: "profile_123",
				userId: "user_123",
			})
			.mockResolvedValueOnce({
				id: "profile_123",
				userId: "user_123",
				defaultGymId: "gym_owned",
				defaultGym: {
					id: "gym_owned",
					userId: "user_123",
					name: "Home Gym",
				},
			});
		mocks.findFirstGym.mockResolvedValue({
			id: "gym_owned",
			userId: "user_123",
		});

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/user-profile", {
				method: "PATCH",
				body: JSON.stringify({ defaultGymId: "gym_owned" }),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual(
			expect.objectContaining({
				id: "profile_123",
				defaultGymId: "gym_owned",
				defaultGym: expect.objectContaining({
					id: "gym_owned",
				}),
			}),
		);
		expect(mocks.updateUserProfiles).toHaveBeenCalledWith(
			mocks.schema.userProfiles,
		);
		expect(mocks.updateUserProfilesSet).toHaveBeenCalledWith(
			expect.objectContaining({
				defaultGymId: "gym_owned",
				updatedAt: expect.any(Date),
			}),
		);
	});

	it("allows clearing the default gym with null", async () => {
		mocks.findFirstUserProfile
			.mockResolvedValueOnce({
				id: "profile_123",
				userId: "user_123",
				defaultGymId: "gym_owned",
			})
			.mockResolvedValueOnce({
				id: "profile_123",
				userId: "user_123",
				defaultGymId: null,
				defaultGym: null,
			});

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/user-profile", {
				method: "PATCH",
				body: JSON.stringify({ defaultGymId: null }),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual(
			expect.objectContaining({
				id: "profile_123",
				defaultGymId: null,
				defaultGym: null,
			}),
		);
		expect(mocks.findFirstGym).not.toHaveBeenCalled();
		expect(mocks.updateUserProfilesSet).toHaveBeenCalledWith(
			expect.objectContaining({
				defaultGymId: null,
				updatedAt: expect.any(Date),
			}),
		);
	});
});
