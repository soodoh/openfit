import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	requireAdmin: vi.fn(),
	findFirstExercise: vi.fn(),
	update: vi.fn(),
	updateSet: vi.fn(),
	updateWhere: vi.fn(),
	delete: vi.fn(),
	deleteWhere: vi.fn(),
	insert: vi.fn(),
	insertValues: vi.fn(),
	eq: vi.fn((left, right) => ({ type: "eq", left, right })),
	createId: vi.fn(),
	schema: {
		exercises: {
			id: "exercises.id",
			name: "exercises.name",
		},
		exercisePrimaryMuscles: {
			exerciseId: "exercise_primary_muscles.exercise_id",
		},
		exerciseSecondaryMuscles: {
			exerciseId: "exercise_secondary_muscles.exercise_id",
		},
		exerciseInstructions: {
			exerciseId: "exercise_instructions.exercise_id",
		},
		exerciseImages: {
			exerciseId: "exercise_images.exercise_id",
		},
	},
}));

vi.mock("drizzle-orm", () => ({
	eq: mocks.eq,
}));

vi.mock("@paralleldrive/cuid2", () => ({
	createId: mocks.createId,
}));

vi.mock("@/db", () => ({
	db: {
		query: {
			exercises: {
				findFirst: mocks.findFirstExercise,
			},
		},
		update: mocks.update,
		delete: mocks.delete,
		insert: mocks.insert,
	},
}));

vi.mock("@/db/schema", () => ({
	schema: mocks.schema,
}));

vi.mock("@/lib/auth-middleware", () => ({
	requireAdmin: mocks.requireAdmin,
}));

import AdminExerciseDetailRoute from "@/routes/api/admin/exercises.$id";

const handlers = AdminExerciseDetailRoute.options.server?.handlers as {
	PATCH: (args: {
		request: Request;
		params: Record<string, string>;
	}) => Promise<Response>;
	DELETE: (args: {
		request: Request;
		params: Record<string, string>;
	}) => Promise<Response>;
};

describe("PATCH /api/admin/exercises/:id", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAdmin.mockResolvedValue({ user: { id: "admin_123" } });
		mocks.findFirstExercise.mockResolvedValue({
			id: "exercise_1",
		});
		mocks.update.mockReturnValue({
			set: mocks.updateSet,
		});
		mocks.updateSet.mockReturnValue({
			where: mocks.updateWhere,
		});
		mocks.updateWhere.mockResolvedValue(undefined);
		mocks.delete.mockReturnValue({
			where: mocks.deleteWhere,
		});
		mocks.deleteWhere.mockResolvedValue(undefined);
		mocks.insert.mockReturnValue({
			values: mocks.insertValues,
		});
		mocks.insertValues.mockResolvedValue(undefined);
		mocks.createId.mockReturnValue("generated_id");
	});

	it("returns the auth response when admin access fails", async () => {
		mocks.requireAdmin.mockRejectedValue(
			Response.json({ error: "Forbidden" }, { status: 403 }),
		);

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/admin/exercises/exercise_1", {
				method: "PATCH",
				body: JSON.stringify({ name: "Updated" }),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "exercise_1" },
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
		expect(mocks.findFirstExercise).not.toHaveBeenCalled();
	});

	it("returns 400 for an invalid update payload", async () => {
		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/admin/exercises/exercise_1", {
				method: "PATCH",
				body: JSON.stringify({}),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "exercise_1" },
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual(
			expect.objectContaining({
				error: "Invalid request body",
			}),
		);
		expect(mocks.update).not.toHaveBeenCalled();
	});

	it("returns 404 when the exercise does not exist", async () => {
		mocks.findFirstExercise.mockResolvedValue(null);

		const response = await handlers.PATCH({
			request: new Request(
				"http://localhost/api/admin/exercises/exercise_missing",
				{
					method: "PATCH",
					body: JSON.stringify({ name: "Updated" }),
					headers: { "Content-Type": "application/json" },
				},
			),
			params: { id: "exercise_missing" },
		});

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toEqual({
			error: "Exercise not found",
		});
		expect(mocks.update).not.toHaveBeenCalled();
	});

	it("updates the exercise and its related records", async () => {
		mocks.createId
			.mockReturnValueOnce("primary_1")
			.mockReturnValueOnce("secondary_1")
			.mockReturnValueOnce("instruction_1")
			.mockReturnValueOnce("instruction_2")
			.mockReturnValueOnce("image_1")
			.mockReturnValueOnce("image_2");

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/admin/exercises/exercise_1", {
				method: "PATCH",
				body: JSON.stringify({
					name: "Updated Bench Press",
					level: "intermediate",
					force: "push",
					mechanic: "compound",
					equipmentId: "barbell",
					categoryId: "chest",
					primaryMuscleIds: ["chest"],
					secondaryMuscleIds: ["triceps"],
					instructions: ["Lie back", "Press up"],
					imageUrls: ["/bench-1.jpg", "/bench-2.jpg"],
				}),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "exercise_1" },
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ success: true });
		expect(mocks.update).toHaveBeenCalledWith(mocks.schema.exercises);
		expect(mocks.updateSet).toHaveBeenCalledWith({
			name: "Updated Bench Press",
			level: "intermediate",
			force: "push",
			mechanic: "compound",
			equipmentId: "barbell",
			categoryId: "chest",
		});
		expect(mocks.updateWhere).toHaveBeenCalledWith({
			type: "eq",
			left: mocks.schema.exercises.id,
			right: "exercise_1",
		});
		expect(mocks.findFirstExercise).toHaveBeenCalledWith({
			where: {
				type: "eq",
				left: mocks.schema.exercises.id,
				right: "exercise_1",
			},
		});
		expect(mocks.delete).toHaveBeenCalledTimes(4);
		expect(mocks.delete).toHaveBeenCalledWith(
			mocks.schema.exercisePrimaryMuscles,
		);
		expect(mocks.delete).toHaveBeenCalledWith(
			mocks.schema.exerciseSecondaryMuscles,
		);
		expect(mocks.delete).toHaveBeenCalledWith(
			mocks.schema.exerciseInstructions,
		);
		expect(mocks.delete).toHaveBeenCalledWith(mocks.schema.exerciseImages);
		expect(mocks.deleteWhere).toHaveBeenNthCalledWith(1, {
			type: "eq",
			left: mocks.schema.exercisePrimaryMuscles.exerciseId,
			right: "exercise_1",
		});
		expect(mocks.deleteWhere).toHaveBeenNthCalledWith(2, {
			type: "eq",
			left: mocks.schema.exerciseSecondaryMuscles.exerciseId,
			right: "exercise_1",
		});
		expect(mocks.deleteWhere).toHaveBeenNthCalledWith(3, {
			type: "eq",
			left: mocks.schema.exerciseInstructions.exerciseId,
			right: "exercise_1",
		});
		expect(mocks.deleteWhere).toHaveBeenNthCalledWith(4, {
			type: "eq",
			left: mocks.schema.exerciseImages.exerciseId,
			right: "exercise_1",
		});
		expect(mocks.insert).toHaveBeenCalledTimes(4);
		expect(mocks.insert).toHaveBeenCalledWith(
			mocks.schema.exercisePrimaryMuscles,
		);
		expect(mocks.insert).toHaveBeenCalledWith(
			mocks.schema.exerciseSecondaryMuscles,
		);
		expect(mocks.insert).toHaveBeenCalledWith(
			mocks.schema.exerciseInstructions,
		);
		expect(mocks.insert).toHaveBeenCalledWith(mocks.schema.exerciseImages);
		expect(mocks.insertValues).toHaveBeenNthCalledWith(1, [
			{
				id: "primary_1",
				exerciseId: "exercise_1",
				muscleGroupId: "chest",
			},
		]);
		expect(mocks.insertValues).toHaveBeenNthCalledWith(2, [
			{
				id: "secondary_1",
				exerciseId: "exercise_1",
				muscleGroupId: "triceps",
			},
		]);
		expect(mocks.insertValues).toHaveBeenNthCalledWith(3, [
			{
				id: "instruction_1",
				exerciseId: "exercise_1",
				instruction: "Lie back",
				order: 0,
			},
			{
				id: "instruction_2",
				exerciseId: "exercise_1",
				instruction: "Press up",
				order: 1,
			},
		]);
		expect(mocks.insertValues).toHaveBeenNthCalledWith(4, [
			{
				id: "image_1",
				exerciseId: "exercise_1",
				path: "/bench-1.jpg",
				order: 0,
			},
			{
				id: "image_2",
				exerciseId: "exercise_1",
				path: "/bench-2.jpg",
				order: 1,
			},
		]);
	});

	it("leaves related records untouched when arrays are omitted from the patch", async () => {
		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/admin/exercises/exercise_1", {
				method: "PATCH",
				body: JSON.stringify({ name: "Renamed Bench Press" }),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "exercise_1" },
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ success: true });
		expect(mocks.updateSet).toHaveBeenCalledWith({
			name: "Renamed Bench Press",
		});
		expect(mocks.delete).not.toHaveBeenCalled();
		expect(mocks.insert).not.toHaveBeenCalled();
	});

	it("clears related records when relation arrays are explicitly empty", async () => {
		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/admin/exercises/exercise_1", {
				method: "PATCH",
				body: JSON.stringify({
					name: "Cleared Bench Press",
					primaryMuscleIds: [],
					secondaryMuscleIds: [],
					instructions: [],
					imageUrls: [],
				}),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "exercise_1" },
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ success: true });
		expect(mocks.delete).toHaveBeenCalledTimes(4);
		expect(mocks.delete).toHaveBeenCalledWith(
			mocks.schema.exercisePrimaryMuscles,
		);
		expect(mocks.delete).toHaveBeenCalledWith(
			mocks.schema.exerciseSecondaryMuscles,
		);
		expect(mocks.delete).toHaveBeenCalledWith(
			mocks.schema.exerciseInstructions,
		);
		expect(mocks.delete).toHaveBeenCalledWith(mocks.schema.exerciseImages);
		expect(mocks.insert).not.toHaveBeenCalled();
	});

	it("returns 500 when updating an exercise throws an unexpected error", async () => {
		mocks.update.mockImplementationOnce(() => {
			throw new Error("boom");
		});

		const response = await handlers.PATCH({
			request: new Request("http://localhost/api/admin/exercises/exercise_1", {
				method: "PATCH",
				body: JSON.stringify({ name: "Updated Bench Press" }),
				headers: { "Content-Type": "application/json" },
			}),
			params: { id: "exercise_1" },
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to update exercise",
		});
	});
});

describe("DELETE /api/admin/exercises/:id", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.requireAdmin.mockResolvedValue({ user: { id: "admin_123" } });
		mocks.findFirstExercise.mockResolvedValue({
			id: "exercise_1",
		});
		mocks.delete.mockReturnValue({
			where: mocks.deleteWhere,
		});
		mocks.deleteWhere.mockResolvedValue(undefined);
	});

	it("returns the auth response when admin access fails", async () => {
		mocks.requireAdmin.mockRejectedValue(
			Response.json({ error: "Forbidden" }, { status: 403 }),
		);

		const response = await handlers.DELETE({
			request: new Request("http://localhost/api/admin/exercises/exercise_1", {
				method: "DELETE",
			}),
			params: { id: "exercise_1" },
		});

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
		expect(mocks.findFirstExercise).not.toHaveBeenCalled();
		expect(mocks.delete).not.toHaveBeenCalled();
	});

	it("returns 404 when the exercise does not exist", async () => {
		mocks.findFirstExercise.mockResolvedValue(null);

		const response = await handlers.DELETE({
			request: new Request(
				"http://localhost/api/admin/exercises/exercise_missing",
				{
					method: "DELETE",
				},
			),
			params: { id: "exercise_missing" },
		});

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toEqual({
			error: "Exercise not found",
		});
		expect(mocks.delete).not.toHaveBeenCalled();
	});

	it("deletes the exercise and related records", async () => {
		const response = await handlers.DELETE({
			request: new Request("http://localhost/api/admin/exercises/exercise_1", {
				method: "DELETE",
			}),
			params: { id: "exercise_1" },
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ success: true });
		expect(mocks.delete).toHaveBeenCalledTimes(5);
		expect(mocks.delete).toHaveBeenCalledWith(
			mocks.schema.exercisePrimaryMuscles,
		);
		expect(mocks.delete).toHaveBeenCalledWith(
			mocks.schema.exerciseSecondaryMuscles,
		);
		expect(mocks.delete).toHaveBeenCalledWith(
			mocks.schema.exerciseInstructions,
		);
		expect(mocks.delete).toHaveBeenCalledWith(mocks.schema.exerciseImages);
		expect(mocks.delete).toHaveBeenCalledWith(mocks.schema.exercises);
		expect(mocks.deleteWhere).toHaveBeenNthCalledWith(1, {
			type: "eq",
			left: mocks.schema.exercisePrimaryMuscles.exerciseId,
			right: "exercise_1",
		});
		expect(mocks.deleteWhere).toHaveBeenNthCalledWith(2, {
			type: "eq",
			left: mocks.schema.exerciseSecondaryMuscles.exerciseId,
			right: "exercise_1",
		});
		expect(mocks.deleteWhere).toHaveBeenNthCalledWith(3, {
			type: "eq",
			left: mocks.schema.exerciseInstructions.exerciseId,
			right: "exercise_1",
		});
		expect(mocks.deleteWhere).toHaveBeenNthCalledWith(4, {
			type: "eq",
			left: mocks.schema.exerciseImages.exerciseId,
			right: "exercise_1",
		});
		expect(mocks.deleteWhere).toHaveBeenNthCalledWith(5, {
			type: "eq",
			left: mocks.schema.exercises.id,
			right: "exercise_1",
		});
		expect(mocks.eq).toHaveBeenCalledWith(
			mocks.schema.exercises.id,
			"exercise_1",
		);
	});

	it("returns 500 when deleting an exercise throws an unexpected error", async () => {
		mocks.delete.mockImplementationOnce(() => {
			throw new Error("boom");
		});

		const response = await handlers.DELETE({
			request: new Request("http://localhost/api/admin/exercises/exercise_1", {
				method: "DELETE",
			}),
			params: { id: "exercise_1" },
		});

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: "Failed to delete exercise",
		});
	});
});
