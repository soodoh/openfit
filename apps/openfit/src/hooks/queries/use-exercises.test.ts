import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { queryKeys } from "@/lib/query-keys";
import type { ExerciseWithImageUrl } from "@/lib/types";
import { mockJsonSuccess } from "@/test/fetch";
import { createTestQueryWrapper } from "@/test/query-client";
import {
	useExercise,
	useExercises,
	useSimilarExercises,
} from "./use-exercises";

const exercise = {
	id: "exercise-1",
	name: "Bench Press",
	equipmentId: "equipment-1",
	force: "push",
	level: "beginner",
	mechanic: "compound",
	categoryId: "category-1",
	createdAt: "2026-01-01T00:00:00.000Z",
	updatedAt: "2026-01-01T00:00:00.000Z",
	imageUrl: "/bench.jpg",
	primaryMuscleIds: ["muscle-1"],
	secondaryMuscleIds: ["muscle-2"],
	instructions: ["Press"],
	imageUrls: ["/bench.jpg"],
} satisfies ExerciseWithImageUrl;

describe("use-exercises queries", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("does not fetch a single exercise when the id is undefined", async () => {
		const fetchMock = mockJsonSuccess(exercise);
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = renderHook(() => useExercise(undefined), { wrapper });

		await waitFor(() => {
			expect(result.current.fetchStatus).toBe("idle");
		});

		expect(result.current.data).toBeUndefined();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("requests a filtered exercise page with the expected query string", async () => {
		const page = {
			page: [exercise],
			isDone: true,
		};
		const fetchMock = mockJsonSuccess(page);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();

		const filters = {
			search: "bench",
			equipmentIds: ["equipment-1", "equipment-2"],
			level: "beginner" as const,
			categoryId: "category-1",
			primaryMuscleId: "muscle-1",
		};

		const { result } = renderHook(() => useExercises(filters), { wrapper });

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data?.pages[0]).toEqual(page);
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/exercises?search=bench&equipmentIds=equipment-1&equipmentIds=equipment-2&level=beginner&categoryId=category-1&primaryMuscleId=muscle-1&limit=20",
			expect.objectContaining({ signal: expect.any(AbortSignal) }),
		);
		expect(
			queryClient.getQueryData(queryKeys.exercises.list(filters)),
		).toBeDefined();
	});

	it("requests similar exercises when muscle ids are present", async () => {
		const similarExercises = [exercise];
		const fetchMock = mockJsonSuccess(similarExercises);
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = renderHook(
			() =>
				useSimilarExercises(["muscle-1", "muscle-2"], {
					search: "press",
					equipmentIds: ["equipment-1"],
					excludeExerciseId: "exercise-9",
					limit: 5,
				}),
			{ wrapper },
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toEqual(similarExercises);
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/exercises/similar?q=press&equipmentIds=equipment-1&primaryMuscleIds=muscle-1&primaryMuscleIds=muscle-2&exclude=exercise-9&limit=5",
		);
	});
});
