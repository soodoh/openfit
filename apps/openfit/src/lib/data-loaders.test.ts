import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	selectResults: [] as unknown[],
	dbSelect: vi.fn((fields?: Record<string, unknown>) => {
		const builder = {
			from: vi.fn(() => builder),
			where: vi.fn(() => builder),
			groupBy: vi.fn(() => builder),
			innerJoin: vi.fn(() => builder),
			orderBy: vi.fn(() => Promise.resolve(mocks.selectResults.shift() ?? [])),
			as: vi.fn(() => fields ?? {}),
		};
		return builder;
	}),
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
		select: mocks.dbSelect,
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
	withFirstExerciseImageUrls,
	withSessionsData,
} from "./data-loaders";

describe("data-loaders", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.selectResults.length = 0;
	});

	it("returns the first exercise image path when available", async () => {
		mocks.findFirstExerciseImage.mockResolvedValue({
			path: "/api/uploads/bench.webp",
		});

		await expect(getFirstExerciseImageUrl("exercise_123")).resolves.toBe(
			"/api/uploads/bench.webp",
		);
	});

	it("returns undefined when the first exercise image does not exist", async () => {
		mocks.findFirstExerciseImage.mockResolvedValue(null);

		await expect(getFirstExerciseImageUrl("exercise_missing")).resolves.toBe(
			undefined,
		);
	});

	it("loads first image urls for many exercises with one SQL query result", async () => {
		mocks.selectResults.push([
			{
				exerciseId: "exercise_1",
				path: "/api/uploads/e1-first.jpg",
			},
			{
				exerciseId: "exercise_2",
				path: "/api/uploads/e2-first.jpg",
			},
		]);

		await expect(
			getFirstExerciseImageUrls(["exercise_1", "exercise_2"]),
		).resolves.toEqual(
			new Map([
				["exercise_1", "/api/uploads/e1-first.jpg"],
				["exercise_2", "/api/uploads/e2-first.jpg"],
			]),
		);

		expect(mocks.dbSelect).toHaveBeenCalledTimes(2);
		expect(mocks.findManyExerciseImages).not.toHaveBeenCalled();
	});

	it("returns an empty map for empty exercise ids without querying", async () => {
		await expect(getFirstExerciseImageUrls([])).resolves.toEqual(new Map());

		expect(mocks.dbSelect).not.toHaveBeenCalled();
		expect(mocks.findManyExerciseImages).not.toHaveBeenCalled();
	});

	it("adds first image urls to item lists and leaves missing image urls undefined", async () => {
		mocks.selectResults.push([
			{
				exerciseId: "exercise_1",
				path: "/api/uploads/e1-first.jpg",
			},
		]);

		await expect(
			withFirstExerciseImageUrls([
				{ id: "exercise_1", name: "Bench Press" },
				{ id: "exercise_2", name: "Row" },
			]),
		).resolves.toEqual([
			{
				id: "exercise_1",
				name: "Bench Press",
				imageUrl: "/api/uploads/e1-first.jpg",
			},
			{
				id: "exercise_2",
				name: "Row",
				imageUrl: undefined,
			},
		]);

		expect(mocks.dbSelect).toHaveBeenCalledTimes(2);
	});

	it("returns the first ordered image for each exercise from the batched SQL result", async () => {
		mocks.selectResults.push([
			{
				exerciseId: "exercise_1",
				path: "/api/uploads/e1-order-0.jpg",
			},
		]);

		await expect(getFirstExerciseImageUrls(["exercise_1"])).resolves.toEqual(
			new Map([["exercise_1", "/api/uploads/e1-order-0.jpg"]]),
		);

		expect(mocks.dbSelect).toHaveBeenCalledTimes(2);
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
		mocks.selectResults.push([
			{
				exerciseId: "exercise_123",
				path: "/api/uploads/bench.webp",
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

	it("hydrates sets that do not have an exercise relation", async () => {
		mocks.findFirstWorkoutSession.mockResolvedValue({
			id: "session_456",
			name: "No Exercise Session",
		});
		mocks.findManyWorkoutSetGroups.mockResolvedValue([
			{
				id: "group_456",
				sessionId: "session_456",
				order: 0,
			},
		]);
		mocks.findManyWorkoutSets.mockResolvedValue([
			{
				id: "set_456",
				setGroupId: "group_456",
				order: 0,
				exercise: null,
				repetitionUnit: null,
				weightUnit: null,
			},
		]);

		await expect(getSessionWithData("session_456")).resolves.toEqual({
			id: "session_456",
			name: "No Exercise Session",
			setGroups: [
				{
					id: "group_456",
					sessionId: "session_456",
					order: 0,
					sets: [
						{
							id: "set_456",
							setGroupId: "group_456",
							order: 0,
							exercise: null,
							repetitionUnit: null,
							weightUnit: null,
						},
					],
				},
			],
		});

		expect(mocks.dbSelect).not.toHaveBeenCalled();
	});

	it("keeps exercise relationships when no image lookup result is found", async () => {
		mocks.findFirstWorkoutSession.mockResolvedValue({
			id: "session_789",
			name: "Missing Image Session",
		});
		mocks.findManyWorkoutSetGroups.mockResolvedValue([
			{
				id: "group_789",
				sessionId: "session_789",
				order: 0,
			},
			{
				id: "group_orphan",
				sessionId: null,
				order: 1,
			},
		]);
		mocks.findManyWorkoutSets.mockResolvedValue([
			{
				id: "set_789",
				setGroupId: "group_789",
				order: 0,
				exercise: {
					id: "exercise_789",
					name: "Lat Pulldown",
				},
				repetitionUnit: null,
				weightUnit: null,
			},
		]);

		await expect(getSessionWithData("session_789")).resolves.toEqual({
			id: "session_789",
			name: "Missing Image Session",
			setGroups: [
				{
					id: "group_789",
					sessionId: "session_789",
					order: 0,
					sets: [
						{
							id: "set_789",
							setGroupId: "group_789",
							order: 0,
							exercise: {
								id: "exercise_789",
								name: "Lat Pulldown",
								imageUrl: null,
							},
							repetitionUnit: null,
							weightUnit: null,
						},
					],
				},
			],
		});

		expect(mocks.dbSelect).toHaveBeenCalledTimes(2);
	});

	it("returns empty session hydration results for an empty input list", async () => {
		await expect(withSessionsData([])).resolves.toEqual([]);

		expect(mocks.findManyWorkoutSetGroups).not.toHaveBeenCalled();
		expect(mocks.findManyWorkoutSets).not.toHaveBeenCalled();
		expect(mocks.dbSelect).not.toHaveBeenCalled();
	});

	it("returns sessions with empty set groups when no set groups are found", async () => {
		mocks.findManyWorkoutSetGroups.mockResolvedValue([]);

		await expect(
			withSessionsData([{ id: "session_empty", name: "Empty Session" }]),
		).resolves.toEqual([
			{
				id: "session_empty",
				name: "Empty Session",
				setGroups: [],
			},
		]);

		expect(mocks.findManyWorkoutSetGroups).toHaveBeenCalledTimes(1);
		expect(mocks.findManyWorkoutSets).not.toHaveBeenCalled();
		expect(mocks.dbSelect).not.toHaveBeenCalled();
	});

	it("returns early in getSessionsWithData when no ids are provided", async () => {
		await expect(getSessionsWithData([])).resolves.toEqual([]);

		expect(mocks.findManyWorkoutSessions).not.toHaveBeenCalled();
		expect(mocks.findManyWorkoutSetGroups).not.toHaveBeenCalled();
		expect(mocks.findManyWorkoutSets).not.toHaveBeenCalled();
		expect(mocks.dbSelect).not.toHaveBeenCalled();
	});

	it("hydrates many sessions with one session, set group, set, and image query", async () => {
		mocks.findManyWorkoutSessions.mockResolvedValue([
			{
				id: "session_2",
				name: "Evening Workout",
			},
			{
				id: "session_1",
				name: "Morning Workout",
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
		mocks.selectResults.push([
			{
				exerciseId: "exercise_1",
				path: "/api/uploads/bench.webp",
			},
			{
				exerciseId: "exercise_2",
				path: "/api/uploads/row.webp",
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
		expect(mocks.dbSelect).toHaveBeenCalledTimes(2);
		expect(mocks.findManyExerciseImages).not.toHaveBeenCalled();
	});

	it("returns null placeholders for missing session ids without breaking order", async () => {
		mocks.findManyWorkoutSessions.mockResolvedValue([
			{
				id: "session_3",
				name: "Third Workout",
			},
			{
				id: "session_1",
				name: "First Workout",
			},
		]);
		mocks.findManyWorkoutSetGroups.mockResolvedValue([
			{
				id: "group_3",
				sessionId: "session_3",
				order: 0,
			},
		]);
		mocks.findManyWorkoutSets.mockResolvedValue([
			{
				id: "set_3",
				setGroupId: "group_3",
				order: 0,
				exercise: {
					id: "exercise_3",
					name: "Deadlift",
				},
				repetitionUnit: null,
				weightUnit: null,
			},
		]);
		mocks.selectResults.push([
			{
				exerciseId: "exercise_3",
				path: "/api/uploads/deadlift.webp",
			},
		]);

		await expect(
			getSessionsWithData(["session_1", "missing_session", "session_3"]),
		).resolves.toEqual([
			{
				id: "session_1",
				name: "First Workout",
				setGroups: [],
			},
			null,
			{
				id: "session_3",
				name: "Third Workout",
				setGroups: [
					{
						id: "group_3",
						sessionId: "session_3",
						order: 0,
						sets: [
							{
								id: "set_3",
								setGroupId: "group_3",
								order: 0,
								exercise: {
									id: "exercise_3",
									name: "Deadlift",
									imageUrl: "/api/uploads/deadlift.webp",
								},
								repetitionUnit: null,
								weightUnit: null,
							},
						],
					},
				],
			},
		]);
	});
});
