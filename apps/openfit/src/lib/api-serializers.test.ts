import { describe, expect, it } from "vitest";
import {
	serializeGym,
	serializeRoutine,
	serializeRoutineDay,
} from "@/lib/api-serializers";

describe("api serializers", () => {
	it("serializeGym converts equipment relations to equipmentIds", () => {
		const gym = serializeGym({
			id: "gym_123",
			userId: "user_123",
			name: "Home Gym",
			createdAt: new Date("2026-04-01T00:00:00.000Z"),
			updatedAt: new Date("2026-04-02T00:00:00.000Z"),
			equipment: [
				{ id: "join_1", gymId: "gym_123", equipmentId: "rack" },
				{ id: "join_2", gymId: "gym_123", equipmentId: "barbell" },
			],
		});

		expect(gym).toEqual(
			expect.objectContaining({
				id: "gym_123",
				createdAt: "2026-04-01T00:00:00.000Z",
				updatedAt: "2026-04-02T00:00:00.000Z",
				equipmentIds: ["rack", "barbell"],
			}),
		);
	});

	it("serializeRoutineDay converts weekday rows to number arrays", () => {
		const routineDay = serializeRoutineDay({
			id: "day_123",
			routineId: "routine_123",
			userId: "user_123",
			description: "Push",
			createdAt: new Date("2026-04-01T00:00:00.000Z"),
			updatedAt: new Date("2026-04-02T00:00:00.000Z"),
			weekdays: [
				{ id: "weekday_1", routineDayId: "day_123", weekday: 1 },
				{ id: "weekday_3", routineDayId: "day_123", weekday: 3 },
			],
			routine: {
				id: "routine_123",
				userId: "user_123",
				name: "Upper A",
				description: null,
				createdAt: new Date("2026-03-01T00:00:00.000Z"),
				updatedAt: new Date("2026-03-02T00:00:00.000Z"),
			},
		});

		expect(routineDay).toEqual(
			expect.objectContaining({
				id: "day_123",
				createdAt: "2026-04-01T00:00:00.000Z",
				updatedAt: "2026-04-02T00:00:00.000Z",
				weekdays: [1, 3],
				routine: expect.objectContaining({
					createdAt: "2026-03-01T00:00:00.000Z",
					updatedAt: "2026-03-02T00:00:00.000Z",
				}),
			}),
		);
	});

	it("serializeRoutine serializes routines with nested routine days", () => {
		const routine = serializeRoutine({
			id: "routine_123",
			userId: "user_123",
			name: "Upper A",
			description: "Primary upper day",
			createdAt: new Date("2026-04-01T00:00:00.000Z"),
			updatedAt: new Date("2026-04-02T00:00:00.000Z"),
			routineDays: [
				{
					id: "day_123",
					routineId: "routine_123",
					userId: "user_123",
					description: "Push",
					createdAt: new Date("2026-04-03T00:00:00.000Z"),
					updatedAt: new Date("2026-04-04T00:00:00.000Z"),
					weekdays: [
						{ id: "weekday_2", routineDayId: "day_123", weekday: 2 },
						{ id: "weekday_4", routineDayId: "day_123", weekday: 4 },
					],
				},
			],
		});

		expect(routine).toEqual({
			id: "routine_123",
			userId: "user_123",
			name: "Upper A",
			description: "Primary upper day",
			createdAt: "2026-04-01T00:00:00.000Z",
			updatedAt: "2026-04-02T00:00:00.000Z",
			routineDays: [
				{
					id: "day_123",
					routineId: "routine_123",
					userId: "user_123",
					description: "Push",
					createdAt: "2026-04-03T00:00:00.000Z",
					updatedAt: "2026-04-04T00:00:00.000Z",
					weekdays: [2, 4],
				},
			],
		});
	});
});
