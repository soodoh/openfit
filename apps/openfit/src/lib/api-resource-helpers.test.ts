import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	findFirstRoutine: vi.fn(),
	findFirstRoutineDay: vi.fn(),
	findFirstGym: vi.fn(),
}));

vi.mock("@/db", () => ({
	db: {
		query: {
			routines: {
				findFirst: mocks.findFirstRoutine,
			},
			routineDays: {
				findFirst: mocks.findFirstRoutineDay,
			},
			gyms: {
				findFirst: mocks.findFirstGym,
			},
		},
	},
}));

import {
	loadGymWithEquipment,
	loadRoutineById,
	loadRoutineDayWithRelations,
	requireOwnedGym,
	requireOwnedRoutine,
	requireOwnedRoutineDay,
} from "./api-resource-helpers";

describe("api-resource-helpers", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("load helpers", () => {
		it("loads a routine by id", async () => {
			mocks.findFirstRoutine.mockResolvedValue({ id: "routine_1" });

			await expect(loadRoutineById("routine_1")).resolves.toEqual({
				id: "routine_1",
			});
			expect(mocks.findFirstRoutine).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.anything(),
				}),
			);
		});

		it("loads a routine day with routine and weekdays relations", async () => {
			mocks.findFirstRoutineDay.mockResolvedValue({ id: "day_1" });

			await expect(loadRoutineDayWithRelations("day_1")).resolves.toEqual({
				id: "day_1",
			});
			expect(mocks.findFirstRoutineDay).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.anything(),
					with: {
						routine: true,
						weekdays: true,
					},
				}),
			);
		});

		it("loads a gym with equipment relation", async () => {
			mocks.findFirstGym.mockResolvedValue({ id: "gym_1" });

			await expect(loadGymWithEquipment("gym_1")).resolves.toEqual({
				id: "gym_1",
			});
			expect(mocks.findFirstGym).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.anything(),
					with: {
						equipment: true,
					},
				}),
			);
		});
	});

	describe("requireOwnedRoutine", () => {
		it("returns not found when the routine does not exist", async () => {
			mocks.findFirstRoutine.mockResolvedValue(null);

			await expect(requireOwnedRoutine("user_1", "routine_1")).resolves.toEqual(
				{
					status: 404,
					error: "Routine not found",
				},
			);
		});

		it("returns unauthorized when owner does not match", async () => {
			mocks.findFirstRoutine.mockResolvedValue({
				id: "routine_1",
				userId: "user_2",
			});

			await expect(requireOwnedRoutine("user_1", "routine_1")).resolves.toEqual(
				{
					status: 403,
					error: "Unauthorized",
				},
			);
		});

		it("returns the routine when owner matches", async () => {
			const routine = {
				id: "routine_1",
				userId: "user_1",
			};
			mocks.findFirstRoutine.mockResolvedValue(routine);

			await expect(requireOwnedRoutine("user_1", "routine_1")).resolves.toEqual(
				{
					status: 200,
					routine,
				},
			);
		});
	});

	describe("requireOwnedRoutineDay", () => {
		it("returns not found when the routine day does not exist", async () => {
			mocks.findFirstRoutineDay.mockResolvedValue(null);

			await expect(requireOwnedRoutineDay("user_1", "day_1")).resolves.toEqual({
				status: 404,
				error: "Routine day not found",
			});
		});

		it("returns unauthorized when routine day owner does not match", async () => {
			mocks.findFirstRoutineDay.mockResolvedValue({
				id: "day_1",
				userId: "user_2",
			});

			await expect(requireOwnedRoutineDay("user_1", "day_1")).resolves.toEqual({
				status: 403,
				error: "Unauthorized",
			});
		});

		it("returns the routine day when owner matches", async () => {
			const routineDay = {
				id: "day_1",
				userId: "user_1",
			};
			mocks.findFirstRoutineDay.mockResolvedValue(routineDay);

			await expect(requireOwnedRoutineDay("user_1", "day_1")).resolves.toEqual({
				status: 200,
				routineDay,
			});
		});
	});

	describe("requireOwnedGym", () => {
		it("returns not found when the gym does not exist", async () => {
			mocks.findFirstGym.mockResolvedValue(null);

			await expect(requireOwnedGym("user_1", "gym_1")).resolves.toEqual({
				status: 404,
				error: "Gym not found",
			});
		});

		it("returns unauthorized when gym owner does not match", async () => {
			mocks.findFirstGym.mockResolvedValue({
				id: "gym_1",
				userId: "user_2",
			});

			await expect(requireOwnedGym("user_1", "gym_1")).resolves.toEqual({
				status: 403,
				error: "Unauthorized",
			});
		});

		it("returns the gym when owner matches", async () => {
			const gym = {
				id: "gym_1",
				userId: "user_1",
			};
			mocks.findFirstGym.mockResolvedValue(gym);

			await expect(requireOwnedGym("user_1", "gym_1")).resolves.toEqual({
				status: 200,
				gym,
			});
		});
	});
});
