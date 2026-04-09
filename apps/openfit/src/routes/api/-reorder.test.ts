import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	requireAuth: vi.fn(),
	findFirstWorkoutSetGroup: vi.fn(),
	findFirstWorkoutSet: vi.fn(),
	transaction: vi.fn(),
	update: vi.fn(),
	updateSet: vi.fn(),
	updateWhere: vi.fn(),
	txUpdate: vi.fn(),
	txUpdateSet: vi.fn(),
	txUpdateWhere: vi.fn(),
	eq: vi.fn((left, right) => ({ type: "eq", left, right })),
	schema: {
		workoutSetGroups: {
			id: "workout_set_groups.id",
			userId: "workout_set_groups.user_id",
			order: "workout_set_groups.order",
		},
		workoutSets: {
			id: "workout_sets.id",
			userId: "workout_sets.user_id",
			setGroupId: "workout_sets.set_group_id",
			order: "workout_sets.order",
		},
	},
}));

vi.mock("drizzle-orm", () => ({
	eq: mocks.eq,
}));

vi.mock("@/db", () => ({
	db: {
		query: {
			workoutSetGroups: {
				findFirst: mocks.findFirstWorkoutSetGroup,
			},
			workoutSets: {
				findFirst: mocks.findFirstWorkoutSet,
			},
		},
		transaction: mocks.transaction,
		update: mocks.update,
	},
}));

vi.mock("@/db/schema", () => ({
	schema: mocks.schema,
}));

vi.mock("@/lib/auth-middleware", () => ({
	requireAuth: mocks.requireAuth,
}));

const setGroupUpdateShape = {
	set: mocks.txUpdateSet,
};

const setUpdateShape = {
	set: mocks.txUpdateSet,
};

import SetGroupsReorderRoute from "@/routes/api/set-groups/reorder";
import SetsReorderRoute from "@/routes/api/sets/reorder";

const setGroupHandlers = SetGroupsReorderRoute.options.server?.handlers as {
	POST: (args: { request: Request }) => Promise<Response>;
};

const setHandlers = SetsReorderRoute.options.server?.handlers as {
	POST: (args: { request: Request }) => Promise<Response>;
};

describe("POST /api/set-groups/reorder", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.findFirstWorkoutSetGroup.mockReset();
		mocks.findFirstWorkoutSet.mockReset();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.transaction.mockImplementation(async (callback) =>
			callback({ update: mocks.txUpdate }),
		);
		mocks.txUpdate.mockReturnValue(setGroupUpdateShape);
		mocks.txUpdateSet.mockReturnValue({
			where: mocks.txUpdateWhere,
		});
		mocks.txUpdateWhere.mockResolvedValue(undefined);
	});

	it("returns 400 for an invalid reorder payload", async () => {
		const response = await setGroupHandlers.POST({
			request: new Request("http://localhost/api/set-groups/reorder", {
				method: "POST",
				body: JSON.stringify({}),
			}),
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual(
			expect.objectContaining({
				error: "Invalid request body",
			}),
		);
		expect(mocks.findFirstWorkoutSetGroup).not.toHaveBeenCalled();
	});

	it("reorders owned set groups and skips missing ids", async () => {
		mocks.findFirstWorkoutSetGroup
			.mockResolvedValueOnce({
				id: "group_1",
				userId: "user_123",
				sessionId: "session_1",
				routineDayId: null,
			})
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce({
				id: "group_2",
				userId: "user_123",
				sessionId: "session_1",
				routineDayId: null,
			});

		const response = await setGroupHandlers.POST({
			request: new Request("http://localhost/api/set-groups/reorder", {
				method: "POST",
				body: JSON.stringify({
					setGroupIds: ["group_1", "group_missing", "group_2"],
				}),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ success: true });
		expect(mocks.transaction).toHaveBeenCalledTimes(1);
		expect(mocks.update).not.toHaveBeenCalled();
		expect(mocks.txUpdate).toHaveBeenCalledWith(mocks.schema.workoutSetGroups);
		expect(mocks.txUpdateSet).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining({
				order: 0,
				updatedAt: expect.any(Date),
			}),
		);
		expect(mocks.txUpdateSet).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({
				order: 2,
				updatedAt: expect.any(Date),
			}),
		);
		expect(mocks.txUpdateWhere).toHaveBeenNthCalledWith(1, {
			type: "eq",
			left: mocks.schema.workoutSetGroups.id,
			right: "group_1",
		});
		expect(mocks.txUpdateWhere).toHaveBeenNthCalledWith(2, {
			type: "eq",
			left: mocks.schema.workoutSetGroups.id,
			right: "group_2",
		});
	});

	it("returns 403 when a reordered set group is owned by another user", async () => {
		mocks.findFirstWorkoutSetGroup
			.mockResolvedValueOnce({
				id: "group_1",
				userId: "user_123",
				sessionId: "session_1",
				routineDayId: null,
			})
			.mockResolvedValueOnce({
				id: "group_2",
				userId: "user_999",
				sessionId: "session_1",
				routineDayId: null,
			});

		const response = await setGroupHandlers.POST({
			request: new Request("http://localhost/api/set-groups/reorder", {
				method: "POST",
				body: JSON.stringify({
					setGroupIds: ["group_1", "group_2"],
				}),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.transaction).not.toHaveBeenCalled();
		expect(mocks.update).not.toHaveBeenCalled();
		expect(mocks.txUpdate).not.toHaveBeenCalled();
		expect(mocks.txUpdateSet).not.toHaveBeenCalled();
	});

	it("returns 400 when reordered set groups do not share the same parent", async () => {
		mocks.findFirstWorkoutSetGroup
			.mockResolvedValueOnce({
				id: "group_1",
				userId: "user_123",
				sessionId: "session_1",
				routineDayId: null,
			})
			.mockResolvedValueOnce({
				id: "group_2",
				userId: "user_123",
				sessionId: "session_2",
				routineDayId: null,
			});

		const response = await setGroupHandlers.POST({
			request: new Request("http://localhost/api/set-groups/reorder", {
				method: "POST",
				body: JSON.stringify({
					setGroupIds: ["group_1", "group_2"],
				}),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual({
			error: "Set groups must share the same parent",
		});
		expect(mocks.transaction).not.toHaveBeenCalled();
		expect(mocks.txUpdate).not.toHaveBeenCalled();
	});

	it("returns the auth response when authentication throws a Response", async () => {
		mocks.requireAuth.mockRejectedValue(
			Response.json({ error: "Unauthorized" }, { status: 401 }),
		);

		const response = await setGroupHandlers.POST({
			request: new Request("http://localhost/api/set-groups/reorder", {
				method: "POST",
				body: JSON.stringify({
					setGroupIds: ["group_1"],
				}),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.transaction).not.toHaveBeenCalled();
		expect(mocks.findFirstWorkoutSetGroup).not.toHaveBeenCalled();
		expect(mocks.txUpdateSet).not.toHaveBeenCalled();
	});
});

describe("POST /api/sets/reorder", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAuth.mockResolvedValue({ user: { id: "user_123" } });
		mocks.transaction.mockImplementation(async (callback) =>
			callback({ update: mocks.txUpdate }),
		);
		mocks.txUpdate.mockReturnValue(setUpdateShape);
		mocks.txUpdateSet.mockReturnValue({
			where: mocks.txUpdateWhere,
		});
		mocks.txUpdateWhere.mockResolvedValue(undefined);
	});

	it("returns 400 for an invalid reorder payload", async () => {
		const response = await setHandlers.POST({
			request: new Request("http://localhost/api/sets/reorder", {
				method: "POST",
				body: JSON.stringify({}),
			}),
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual(
			expect.objectContaining({
				error: "Invalid request body",
			}),
		);
		expect(mocks.findFirstWorkoutSetGroup).not.toHaveBeenCalled();
	});

	it("reorders owned sets and skips missing ids", async () => {
		mocks.findFirstWorkoutSetGroup.mockResolvedValue({
			id: "group_1",
			userId: "user_123",
		});
		mocks.findFirstWorkoutSet
			.mockResolvedValueOnce({
				id: "set_1",
				userId: "user_123",
				setGroupId: "group_1",
			})
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce({
				id: "set_2",
				userId: "user_123",
				setGroupId: "group_1",
			});

		const response = await setHandlers.POST({
			request: new Request("http://localhost/api/sets/reorder", {
				method: "POST",
				body: JSON.stringify({
					setGroupId: "group_1",
					setIds: ["set_1", "set_missing", "set_2"],
				}),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ success: true });
		expect(mocks.transaction).toHaveBeenCalledTimes(1);
		expect(mocks.update).not.toHaveBeenCalled();
		expect(mocks.txUpdate).toHaveBeenCalledWith(mocks.schema.workoutSets);
		expect(mocks.txUpdateSet).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining({
				order: 0,
				updatedAt: expect.any(Date),
			}),
		);
		expect(mocks.txUpdateSet).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({
				order: 2,
				updatedAt: expect.any(Date),
			}),
		);
		expect(mocks.txUpdateWhere).toHaveBeenNthCalledWith(1, {
			type: "eq",
			left: mocks.schema.workoutSets.id,
			right: "set_1",
		});
		expect(mocks.txUpdateWhere).toHaveBeenNthCalledWith(2, {
			type: "eq",
			left: mocks.schema.workoutSets.id,
			right: "set_2",
		});
	});

	it("returns 403 when the set group is not owned by the user", async () => {
		mocks.findFirstWorkoutSetGroup.mockResolvedValue({
			id: "group_1",
			userId: "user_999",
		});

		const response = await setHandlers.POST({
			request: new Request("http://localhost/api/sets/reorder", {
				method: "POST",
				body: JSON.stringify({
					setGroupId: "group_1",
					setIds: ["set_1"],
				}),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.transaction).not.toHaveBeenCalled();
		expect(mocks.findFirstWorkoutSet).not.toHaveBeenCalled();
	});

	it("returns 403 when a reordered set is owned by another user", async () => {
		mocks.findFirstWorkoutSetGroup.mockResolvedValue({
			id: "group_1",
			userId: "user_123",
		});
		mocks.findFirstWorkoutSet
			.mockResolvedValueOnce({
				id: "set_1",
				userId: "user_123",
				setGroupId: "group_1",
			})
			.mockResolvedValueOnce({
				id: "set_2",
				userId: "user_999",
				setGroupId: "group_1",
			});

		const response = await setHandlers.POST({
			request: new Request("http://localhost/api/sets/reorder", {
				method: "POST",
				body: JSON.stringify({
					setGroupId: "group_1",
					setIds: ["set_1", "set_2"],
				}),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.transaction).not.toHaveBeenCalled();
		expect(mocks.update).not.toHaveBeenCalled();
		expect(mocks.txUpdate).not.toHaveBeenCalled();
		expect(mocks.txUpdateSet).not.toHaveBeenCalled();
	});

	it("returns 403 when a reordered set belongs to a different set group", async () => {
		mocks.findFirstWorkoutSetGroup.mockResolvedValue({
			id: "group_1",
			userId: "user_123",
		});
		mocks.findFirstWorkoutSet.mockResolvedValueOnce({
			id: "set_1",
			userId: "user_123",
			setGroupId: "group_2",
		});

		const response = await setHandlers.POST({
			request: new Request("http://localhost/api/sets/reorder", {
				method: "POST",
				body: JSON.stringify({
					setGroupId: "group_1",
					setIds: ["set_1"],
				}),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.transaction).not.toHaveBeenCalled();
		expect(mocks.update).not.toHaveBeenCalled();
		expect(mocks.txUpdate).not.toHaveBeenCalled();
		expect(mocks.txUpdateSet).not.toHaveBeenCalled();
	});

	it("returns the auth response when authentication throws a Response", async () => {
		mocks.requireAuth.mockRejectedValue(
			Response.json({ error: "Unauthorized" }, { status: 401 }),
		);

		const response = await setHandlers.POST({
			request: new Request("http://localhost/api/sets/reorder", {
				method: "POST",
				body: JSON.stringify({
					setGroupId: "group_1",
					setIds: ["set_1"],
				}),
				headers: { "Content-Type": "application/json" },
			}),
		});

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
		expect(mocks.transaction).not.toHaveBeenCalled();
		expect(mocks.findFirstWorkoutSetGroup).not.toHaveBeenCalled();
		expect(mocks.findFirstWorkoutSet).not.toHaveBeenCalled();
		expect(mocks.txUpdateSet).not.toHaveBeenCalled();
	});
});
