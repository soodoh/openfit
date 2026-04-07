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

		expect(gym).toEqual({
			id: "gym_123",
			userId: "user_123",
			name: "Home Gym",
			createdAt: "2026-04-01T00:00:00.000Z",
			updatedAt: "2026-04-02T00:00:00.000Z",
			equipmentIds: ["rack", "barbell"],
		});
		expect(gym).not.toHaveProperty("equipment");
	});

	it("serializes routine days with nested routine timestamps", () => {
		const routineDay = serializeRoutineDay({
			id: "day_1",
			routineId: "routine_1",
			userId: "user_123",
			description: "Push",
			createdAt: new Date("2026-01-01T00:00:00.000Z"),
			updatedAt: new Date("2026-01-02T00:00:00.000Z"),
			weekdays: [{ weekday: 1 }, { weekday: 3 }],
			routine: {
				id: "routine_1",
				userId: "user_123",
				name: "Upper",
				description: null,
				createdAt: new Date("2026-01-01T00:00:00.000Z"),
				updatedAt: new Date("2026-01-02T00:00:00.000Z"),
			},
		});

		expect(routineDay).toMatchObject({
			id: "day_1",
			routineId: "routine_1",
			createdAt: "2026-01-01T00:00:00.000Z",
			updatedAt: "2026-01-02T00:00:00.000Z",
			weekdays: [1, 3],
			routine: {
				createdAt: "2026-01-01T00:00:00.000Z",
				updatedAt: "2026-01-02T00:00:00.000Z",
			},
		});
	});

	it("preserves a null routine while normalizing mixed weekday shapes", () => {
		const routineDay = serializeRoutineDay({
			id: "day_2",
			routineId: "routine_2",
			userId: "user_123",
			description: "Pull",
			createdAt: new Date("2026-02-01T00:00:00.000Z"),
			updatedAt: new Date("2026-02-02T00:00:00.000Z"),
			weekdays: [1, { id: "weekday_5", routineDayId: "day_2", weekday: 5 }],
			routine: null,
		});

		expect(routineDay).toEqual({
			id: "day_2",
			routineId: "routine_2",
			userId: "user_123",
			description: "Pull",
			createdAt: "2026-02-01T00:00:00.000Z",
			updatedAt: "2026-02-02T00:00:00.000Z",
			weekdays: [1, 5],
			routine: null,
		});
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

	it("serializes nested routine days with mixed weekday representations", () => {
		const routine = serializeRoutine({
			id: "routine_456",
			userId: "user_123",
			name: "Lower A",
			description: null,
			createdAt: new Date("2026-05-01T00:00:00.000Z"),
			updatedAt: new Date("2026-05-02T00:00:00.000Z"),
			routineDays: [
				{
					id: "day_456",
					routineId: "routine_456",
					userId: "user_123",
					description: "Lower",
					createdAt: new Date("2026-05-03T00:00:00.000Z"),
					updatedAt: new Date("2026-05-04T00:00:00.000Z"),
					weekdays: [
						2,
						{ id: "weekday_4", routineDayId: "day_456", weekday: 4 },
					],
				},
				{
					id: "day_457",
					routineId: "routine_456",
					userId: "user_123",
					description: "Accessory",
					createdAt: new Date("2026-05-05T00:00:00.000Z"),
					updatedAt: new Date("2026-05-06T00:00:00.000Z"),
					weekdays: [{ weekday: 6 }],
				},
			],
		});

		expect(routine).toEqual({
			id: "routine_456",
			userId: "user_123",
			name: "Lower A",
			description: null,
			createdAt: "2026-05-01T00:00:00.000Z",
			updatedAt: "2026-05-02T00:00:00.000Z",
			routineDays: [
				{
					id: "day_456",
					routineId: "routine_456",
					userId: "user_123",
					description: "Lower",
					createdAt: "2026-05-03T00:00:00.000Z",
					updatedAt: "2026-05-04T00:00:00.000Z",
					weekdays: [2, 4],
				},
				{
					id: "day_457",
					routineId: "routine_456",
					userId: "user_123",
					description: "Accessory",
					createdAt: "2026-05-05T00:00:00.000Z",
					updatedAt: "2026-05-06T00:00:00.000Z",
					weekdays: [6],
				},
			],
		});
	});
});
