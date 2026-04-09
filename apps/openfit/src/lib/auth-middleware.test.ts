import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	getSession: vi.fn(),
	findFirstUserProfile: vi.fn(),
	eq: vi.fn((left, right) => ({ type: "eq", left, right })),
	schema: {
		userProfiles: {
			userId: "user_profiles.user_id",
		},
	},
}));

vi.mock("drizzle-orm", () => ({
	eq: mocks.eq,
}));

vi.mock("@/db", () => ({
	db: {
		query: {
			userProfiles: {
				findFirst: mocks.findFirstUserProfile,
			},
		},
	},
}));

vi.mock("@/db/schema", () => ({
	schema: mocks.schema,
}));

vi.mock("@/lib/auth", () => ({
	auth: {
		api: {
			getSession: mocks.getSession,
		},
	},
}));

import {
	getOptionalSession,
	getSession,
	requireAdmin,
	requireAuth,
} from "./auth-middleware";

describe("auth-middleware", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("loads the session from request headers", async () => {
		const request = new Request("http://localhost/api/example", {
			headers: { Cookie: "session=abc" },
		});
		const session = {
			user: { id: "user_123" },
			session: { id: "session_123" },
		};
		mocks.getSession.mockResolvedValue(session);

		await expect(getSession(request)).resolves.toBe(session);
		expect(mocks.getSession).toHaveBeenCalledWith({
			headers: request.headers,
		});
		await expect(getOptionalSession(request)).resolves.toBe(session);
	});

	it("throws a 401 response when auth is required but no session exists", async () => {
		mocks.getSession.mockResolvedValue(null);

		const thrown = await requireAuth(
			new Request("http://localhost/api/protected"),
		).catch((error) => error as Response);

		expect(thrown).toBeInstanceOf(Response);
		expect(thrown.status).toBe(401);
		await expect(thrown.json()).resolves.toEqual({ error: "Unauthorized" });
	});

	it("returns the session for admin users", async () => {
		const request = new Request("http://localhost/api/admin");
		const session = {
			user: { id: "admin_123" },
			session: { id: "session_123" },
		};
		mocks.getSession.mockResolvedValue(session);
		mocks.findFirstUserProfile.mockResolvedValue({
			userId: "admin_123",
			role: "ADMIN",
		});

		await expect(requireAdmin(request)).resolves.toBe(session);
		expect(mocks.findFirstUserProfile).toHaveBeenCalledWith({
			where: {
				type: "eq",
				left: mocks.schema.userProfiles.userId,
				right: "admin_123",
			},
		});
	});

	it("throws a 403 response when the profile is missing or non-admin", async () => {
		mocks.getSession.mockResolvedValue({
			user: { id: "user_123" },
			session: { id: "session_123" },
		});
		mocks.findFirstUserProfile.mockResolvedValue(null);

		const thrown = await requireAdmin(
			new Request("http://localhost/api/admin"),
		).catch((error) => error as Response);

		expect(thrown).toBeInstanceOf(Response);
		expect(thrown.status).toBe(403);
		await expect(thrown.json()).resolves.toEqual({ error: "Forbidden" });
	});
});
