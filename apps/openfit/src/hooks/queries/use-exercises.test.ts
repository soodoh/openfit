import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { queryKeys } from "@/lib/query-keys";
import type { ExerciseWithImageUrl } from "@/lib/types";
import { mockJsonError, mockJsonSuccess } from "@/test/fetch";
import { createTestQueryWrapper } from "@/test/query-client";
import {
	buildExerciseQueryString,
	useExercise,
	useExerciseSearch,
	useExercises,
	useSimilarExercises,
} from "./use-exercises";

type FetchMock = {
	mock: {
		calls: unknown[][];
	};
};

function getFetchRequest(fetchMock: FetchMock) {
	const [input, init] = fetchMock.mock.calls[0] ?? [];

	expect(typeof input).toBe("string");

	return {
		url: new URL(input, "http://localhost"),
		init,
	};
}

function createDeferred<T>() {
	let resolve!: (value: T | PromiseLike<T>) => void;
	const promise = new Promise<T>((res) => {
		resolve = res;
	});

	return { promise, resolve };
}

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

const originalFetch = globalThis.fetch;

describe("use-exercises queries", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
		expect(globalThis.fetch).toBe(originalFetch);
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

	it("returns undefined for a missing exercise", async () => {
		const fetchMock = vi.fn(() =>
			Promise.resolve(
				Response.json({ error: "Exercise not found" }, { status: 404 }),
			),
		);
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = renderHook(() => useExercise("missing-exercise"), {
			wrapper,
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toBeUndefined();
	});

	it("requests a filtered exercise page with the expected query semantics", async () => {
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
		const request = getFetchRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/exercises");
		expect(request.url.searchParams.get("search")).toBe("bench");
		expect(request.url.searchParams.getAll("equipmentIds")).toEqual([
			"equipment-1",
			"equipment-2",
		]);
		expect(request.url.searchParams.get("level")).toBe("beginner");
		expect(request.url.searchParams.get("categoryId")).toBe("category-1");
		expect(request.url.searchParams.get("primaryMuscleId")).toBe("muscle-1");
		expect(request.url.searchParams.get("limit")).toBe("20");
		expect(request.init).toEqual(
			expect.objectContaining({ signal: expect.any(AbortSignal) }),
		);
		expect(
			queryClient.getQueryData(queryKeys.exercises.list(filters)),
		).toBeDefined();
	});

	it("requests an unfiltered exercise page without optional filters", async () => {
		const page = {
			page: [exercise],
			isDone: true,
		};
		const fetchMock = mockJsonSuccess(page);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();

		const { result } = renderHook(() => useExercises(), { wrapper });

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data?.pages[0]).toEqual(page);
		const request = getFetchRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/exercises");
		expect(request.url.searchParams.get("search")).toBeNull();
		expect(request.url.searchParams.get("equipmentId")).toBeNull();
		expect(request.url.searchParams.getAll("equipmentIds")).toEqual([]);
		expect(request.url.searchParams.get("level")).toBeNull();
		expect(request.url.searchParams.get("categoryId")).toBeNull();
		expect(request.url.searchParams.get("primaryMuscleId")).toBeNull();
		expect(request.url.searchParams.get("limit")).toBe("20");
		expect(
			queryClient.getQueryData(queryKeys.exercises.list({})),
		).toBeDefined();
	});

	it("builds exercise query strings with a cursor and singular equipment filter", () => {
		const queryString = buildExerciseQueryString(
			{ equipmentId: "equipment-1" },
			"cursor-2",
			20,
		);
		const params = new URLSearchParams(queryString);

		expect(params.get("equipmentId")).toBe("equipment-1");
		expect(params.get("cursor")).toBe("cursor-2");
		expect(params.get("limit")).toBe("20");
	});

	it("requests exercise searches with the limit in the cache key", async () => {
		const results = [exercise];
		const fetchMock = mockJsonSuccess(results);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();

		const { result } = renderHook(
			() => useExerciseSearch("bench", ["equipment-1"], 5),
			{ wrapper },
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toEqual(results);
		const request = getFetchRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/exercises/search");
		expect(request.url.searchParams.get("q")).toBe("bench");
		expect(request.url.searchParams.getAll("equipmentIds")).toEqual([
			"equipment-1",
		]);
		expect(request.url.searchParams.get("limit")).toBe("5");
		expect(
			queryClient.getQueryData(
				queryKeys.exercises.search("bench", {
					equipmentIds: ["equipment-1"],
					limit: 5,
				}),
			),
		).toEqual(results);
	});

	it("keeps exercise search enabled even when the search term is empty", async () => {
		const results = [exercise];
		const fetchMock = mockJsonSuccess(results);
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = renderHook(() => useExerciseSearch("", undefined, 20), {
			wrapper,
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toEqual(results);
		const request = getFetchRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/exercises/search");
		expect(request.url.searchParams.get("q")).toBeNull();
		expect(request.url.searchParams.get("limit")).toBe("20");
	});

	it("keeps previous search results visible while a new exercise search is loading", async () => {
		const firstResults = [exercise];
		const nextResults = createDeferred<Response>();
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(Response.json(firstResults))
			.mockReturnValueOnce(nextResults.promise);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();

		const { result, rerender } = renderHook(
			({ term }) => useExerciseSearch(term, ["equipment-1"], 5),
			{
				initialProps: { term: "bench" },
				wrapper,
			},
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		rerender({ term: "press" });

		await waitFor(() => {
			expect(result.current.isPlaceholderData).toBe(true);
		});

		expect(result.current.data).toEqual(firstResults);
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(
			queryClient.getQueryData(
				queryKeys.exercises.search("press", {
					equipmentIds: ["equipment-1"],
					limit: 5,
				}),
			),
		).toBeUndefined();

		nextResults.resolve(Response.json([exercise]));

		await waitFor(() => {
			expect(result.current.isPlaceholderData).toBe(false);
			expect(result.current.data).toEqual([exercise]);
		});
	});

	it("does not fetch similar exercises without primary muscle ids", async () => {
		const fetchMock = mockJsonSuccess([exercise]);
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = renderHook(() => useSimilarExercises(undefined), {
			wrapper,
		});

		await waitFor(() => {
			expect(result.current.fetchStatus).toBe("idle");
		});

		expect(result.current.data).toBeUndefined();
		expect(fetchMock).not.toHaveBeenCalled();
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
		const request = getFetchRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/exercises/similar");
		expect(request.url.searchParams.get("q")).toBe("press");
		expect(request.url.searchParams.getAll("equipmentIds")).toEqual([
			"equipment-1",
		]);
		expect(request.url.searchParams.getAll("primaryMuscleIds")).toEqual([
			"muscle-1",
			"muscle-2",
		]);
		expect(request.url.searchParams.get("exclude")).toBe("exercise-9");
		expect(request.url.searchParams.get("limit")).toBe("5");
	});

	it("requests similar exercises without optional search filters", async () => {
		const similarExercises = [exercise];
		const fetchMock = mockJsonSuccess(similarExercises);
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = renderHook(() => useSimilarExercises(["muscle-1"]), {
			wrapper,
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toEqual(similarExercises);
		const request = getFetchRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/exercises/similar");
		expect(request.url.searchParams.get("q")).toBeNull();
		expect(request.url.searchParams.getAll("equipmentIds")).toEqual([]);
		expect(request.url.searchParams.getAll("primaryMuscleIds")).toEqual([
			"muscle-1",
		]);
		expect(request.url.searchParams.get("exclude")).toBeNull();
		expect(request.url.searchParams.get("limit")).toBeNull();
	});

	it("surfaces search failures for single exercises", async () => {
		const fetchMock = mockJsonError("Exercise request failed", { status: 500 });
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = renderHook(() => useExercise("exercise-1"), { wrapper });

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect((result.current.error as Error).message).toBe(
			"Exercise request failed",
		);
	});
});
