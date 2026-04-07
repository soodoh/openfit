import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	findFirstExerciseImage: vi.fn(),
	findManyExerciseImages: vi.fn(),
	findFirstWorkoutSession: vi.fn(),
	findManyWorkoutSessions: vi.fn(),
	findManyWorkoutSetGroups: vi.fn(),
	findManyWorkoutSets: vi.fn(),
	findManyRoutineDays: vi.fn(),
}));

vi.mock("@/db", () => ({
	db: {
		query: {
			exerciseImages: {
				findFirst: mocks.findFirstExerciseImage,
				findMany: mocks.findManyExerciseImages,
			},
			workoutSessions: {
				findFirst: mocks.findFirstWorkoutSession,
				findMany: mocks.findManyWorkoutSessions,
			},
			workoutSetGroups: {
				findMany: mocks.findManyWorkoutSetGroups,
			},
			workoutSets: {
				findMany: mocks.findManyWorkoutSets,
			},
			routineDays: {
				findMany: mocks.findManyRoutineDays,
			},
		},
	},
}));

import {
	getFirstExerciseImageUrl,
	getFirstExerciseImageUrls,
	getRoutineDaysWithWeekdays,
	getSessionsWithData,
	getSessionWithData,
} from "./data-loaders";

describe("data-loaders", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns the first exercise image path when available", async () => {
		mocks.findFirstExerciseImage.mockResolvedValue({
			path: "/api/uploads/bench.webp",
		});

		await expect(getFirstExerciseImageUrl("exercise_123")).resolves.toBe(
			"/api/uploads/bench.webp",
		);
	});

	it("loads first image urls for many exercises with one image query", async () => {
		mocks.findManyExerciseImages.mockResolvedValue([
			{
				exerciseId: "exercise_1",
				path: "/api/uploads/e1.jpg",
				order: 0,
			},
			{
				exerciseId: "exercise_2",
				path: "/api/uploads/e2.jpg",
				order: 0,
			},
		]);

		await expect(
			getFirstExerciseImageUrls(["exercise_1", "exercise_2"]),
		).resolves.toEqual(
			new Map([
				["exercise_1", "/api/uploads/e1.jpg"],
				["exercise_2", "/api/uploads/e2.jpg"],
			]),
		);

		expect(mocks.findManyExerciseImages).toHaveBeenCalledTimes(1);
	});

	it("maps routine day weekdays into a flat array", async () => {
		mocks.findManyRoutineDays.mockResolvedValue([
			{
				id: "day_123",
				description: "Push",
				weekdays: [{ weekday: 1 }, { weekday: 3 }],
			},
		]);

		await expect(getRoutineDaysWithWeekdays("routine_123")).resolves.toEqual([
			{
				id: "day_123",
				description: "Push",
				weekdays: [1, 3],
			},
		]);
	});

	it("returns null when a session does not exist", async () => {
		mocks.findFirstWorkoutSession.mockResolvedValue(null);

		await expect(getSessionWithData("session_123")).resolves.toBeNull();
	});

	it("hydrates session sets with the first exercise image url", async () => {
		mocks.findFirstWorkoutSession.mockResolvedValue({
			id: "session_123",
			name: "Morning Workout",
		});
		mocks.findManyWorkoutSetGroups.mockResolvedValue([
			{
				id: "group_123",
				sessionId: "session_123",
				order: 0,
			},
		]);
		mocks.findManyWorkoutSets.mockResolvedValue([
			{
				id: "set_123",
				setGroupId: "group_123",
				order: 0,
				exercise: {
					id: "exercise_123",
					name: "Bench Press",
				},
				repetitionUnit: null,
				weightUnit: null,
			},
		]);
		mocks.findManyExerciseImages.mockResolvedValue([
			{
				exerciseId: "exercise_123",
				path: "/api/uploads/bench.webp",
				order: 0,
			},
		]);

		await expect(getSessionWithData("session_123")).resolves.toEqual({
			id: "session_123",
			name: "Morning Workout",
			setGroups: [
				{
					id: "group_123",
					sessionId: "session_123",
					order: 0,
					sets: [
						{
							id: "set_123",
							setGroupId: "group_123",
							order: 0,
							exercise: {
								id: "exercise_123",
								name: "Bench Press",
								imageUrl: "/api/uploads/bench.webp",
							},
							repetitionUnit: null,
							weightUnit: null,
						},
					],
				},
			],
		});
	});

	it("hydrates many sessions with one session, set group, set, and image query", async () => {
		mocks.findManyWorkoutSessions.mockResolvedValue([
			{
				id: "session_1",
				name: "Morning Workout",
			},
			{
				id: "session_2",
				name: "Evening Workout",
			},
		]);
		mocks.findManyWorkoutSetGroups.mockResolvedValue([
			{
				id: "group_1",
				sessionId: "session_1",
				order: 0,
			},
			{
				id: "group_2",
				sessionId: "session_2",
				order: 0,
			},
		]);
		mocks.findManyWorkoutSets.mockResolvedValue([
			{
				id: "set_1",
				setGroupId: "group_1",
				order: 0,
				exercise: {
					id: "exercise_1",
					name: "Bench Press",
				},
				repetitionUnit: null,
				weightUnit: null,
			},
			{
				id: "set_2",
				setGroupId: "group_2",
				order: 0,
				exercise: {
					id: "exercise_2",
					name: "Row",
				},
				repetitionUnit: null,
				weightUnit: null,
			},
		]);
		mocks.findManyExerciseImages.mockResolvedValue([
			{
				exerciseId: "exercise_1",
				path: "/api/uploads/bench.webp",
				order: 0,
			},
			{
				exerciseId: "exercise_2",
				path: "/api/uploads/row.webp",
				order: 0,
			},
		]);

		await expect(
			getSessionsWithData(["session_1", "session_2"]),
		).resolves.toEqual([
			{
				id: "session_1",
				name: "Morning Workout",
				setGroups: [
					{
						id: "group_1",
						sessionId: "session_1",
						order: 0,
						sets: [
							{
								id: "set_1",
								setGroupId: "group_1",
								order: 0,
								exercise: {
									id: "exercise_1",
									name: "Bench Press",
									imageUrl: "/api/uploads/bench.webp",
								},
								repetitionUnit: null,
								weightUnit: null,
							},
						],
					},
				],
			},
			{
				id: "session_2",
				name: "Evening Workout",
				setGroups: [
					{
						id: "group_2",
						sessionId: "session_2",
						order: 0,
						sets: [
							{
								id: "set_2",
								setGroupId: "group_2",
								order: 0,
								exercise: {
									id: "exercise_2",
									name: "Row",
									imageUrl: "/api/uploads/row.webp",
								},
								repetitionUnit: null,
								weightUnit: null,
							},
						],
					},
				],
			},
		]);

		expect(mocks.findManyWorkoutSessions).toHaveBeenCalledTimes(1);
		expect(mocks.findManyWorkoutSetGroups).toHaveBeenCalledTimes(1);
		expect(mocks.findManyWorkoutSets).toHaveBeenCalledTimes(1);
		expect(mocks.findManyExerciseImages).toHaveBeenCalledTimes(1);
	});
});
