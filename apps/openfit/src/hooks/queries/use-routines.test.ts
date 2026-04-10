import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import type { CursorPage, RoutineQueryDto } from "@/lib/api-types";
import { queryKeys } from "@/lib/query-keys";
import { mockJsonError, mockJsonSuccess } from "@/test/fetch";
import { createTestQueryWrapper } from "@/test/query-client";
import { useRoutine, useRoutineSearch, useRoutines } from "./use-routines";

const originalFetch = globalThis.fetch;

type FetchMock = {
	mock: {
		calls: unknown[][];
	};
};

function getFetchRequest(fetchMock: FetchMock, callIndex = 0) {
	const [input, init] = fetchMock.mock.calls[callIndex] ?? [];

	expect(typeof input).toBe("string");

	return {
		url: new URL(input, "http://localhost"),
		init,
	};
}

function createRoutineDto(id: string, searchLabel: string): RoutineQueryDto {
	return {
		id,
		userId: "user-1",
		name: `${searchLabel} Routine`,
		description: null,
		createdAt: "2026-02-01T00:00:00.000Z",
		updatedAt: "2026-02-02T00:00:00.000Z",
		routineDays: [
			{
				id: `${id}-day-1`,
				routineId: id,
				userId: "user-1",
				description: "Primary day",
				createdAt: "2026-02-01T00:00:00.000Z",
				updatedAt: "2026-02-02T00:00:00.000Z",
				weekdays: [1, 3],
				routine: {
					id,
					userId: "user-1",
					name: `${searchLabel} Routine`,
					description: null,
					createdAt: "2026-02-01T00:00:00.000Z",
					updatedAt: "2026-02-02T00:00:00.000Z",
				},
				setGroups: [
					{
						id: `${id}-set-group-1`,
						userId: "user-1",
						routineDayId: `${id}-day-1`,
						sessionId: null,
						type: "NORMAL",
						order: 1,
						comment: null,
						createdAt: "2026-02-01T00:00:00.000Z",
						updatedAt: "2026-02-02T00:00:00.000Z",
						sets: [
							{
								id: `${id}-set-1`,
								userId: "user-1",
								setGroupId: `${id}-set-group-1`,
								exerciseId: "exercise-1",
								type: "NORMAL",
								order: 1,
								reps: 8,
								repetitionUnitId: "reps",
								weight: 185,
								weightUnitId: "lb",
								restTime: 120,
								completed: true,
								createdAt: "2026-02-01T00:00:00.000Z",
								updatedAt: "2026-02-02T00:00:00.000Z",
								exercise: {
									id: "exercise-1",
									name: "Bench Press",
									imageUrl: undefined,
								},
								repetitionUnit: { id: "reps", name: "Reps" },
								weightUnit: { id: "lb", name: "lb" },
							},
							{
								id: `${id}-set-2`,
								userId: "user-1",
								setGroupId: `${id}-set-group-1`,
								exerciseId: "exercise-2",
								type: "NORMAL",
								order: 2,
								reps: 6,
								repetitionUnitId: "reps",
								weight: 205,
								weightUnitId: "lb",
								restTime: 150,
								completed: false,
								createdAt: "2026-02-01T00:00:00.000Z",
								updatedAt: "2026-02-02T00:00:00.000Z",
								exercise: null,
								repetitionUnit: null,
								weightUnit: null,
							},
						],
					},
				],
			},
			{
				id: `${id}-day-2`,
				routineId: id,
				userId: "user-1",
				description: "Secondary day",
				createdAt: "2026-02-03T00:00:00.000Z",
				updatedAt: "2026-02-04T00:00:00.000Z",
				weekdays: [2, 4],
				routine: null,
			},
		],
	};
}

describe("use-routines queries", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
		expect(globalThis.fetch).toBe(originalFetch);
	});

	it("does not fetch a single routine when the id is undefined", async () => {
		const fetchMock = mockJsonSuccess(createRoutineDto("routine-1", "Push"));
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = await renderHook(() => useRoutine(undefined), {
			wrapper,
		});

		await vi.waitFor(() => {
			expect(result.current.fetchStatus).toBe("idle");
		});

		expect(result.current.data).toBeUndefined();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("fetches and parses a single routine detail payload", async () => {
		const routine = createRoutineDto("routine-1", "Push");
		const fetchMock = mockJsonSuccess(routine);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();

		const { result } = await renderHook(() => useRoutine("routine-1"), {
			wrapper,
		});

		await vi.waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data?.createdAt).toBeInstanceOf(Date);
		expect(result.current.data?.updatedAt).toBeInstanceOf(Date);
		expect(result.current.data?.routineDays[0]?.createdAt).toBeInstanceOf(Date);
		expect(
			result.current.data?.routineDays[0]?.routine?.createdAt,
		).toBeInstanceOf(Date);
		expect(
			result.current.data?.routineDays[0]?.setGroups?.[0]?.sets[0]?.exercise
				?.imageUrl,
		).toBeNull();
		expect(
			result.current.data?.routineDays[0]?.setGroups?.[0]?.sets[1]?.exercise,
		).toBeNull();
		expect(result.current.data?.routineDays[1]?.routine).toBeNull();
		expect(result.current.data?.routineDays[1]?.setGroups).toBeUndefined();
		expect(getFetchRequest(fetchMock).url.pathname).toBe(
			"/api/routines/routine-1",
		);
		expect(
			queryClient.getQueryData(queryKeys.routines.detail("routine-1")),
		).toBe(result.current.data);
	});

	it("surfaces a coherent not-found error for missing routines", async () => {
		const fetchMock = vi.fn(() =>
			Promise.resolve(Response.json({ error: "Not found" }, { status: 404 })),
		);
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = await renderHook(() => useRoutine("missing-routine"), {
			wrapper,
		});

		await vi.waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect((result.current.error as Error).message).toBe("Routine not found");
		expect(getFetchRequest(fetchMock).url.pathname).toBe(
			"/api/routines/missing-routine",
		);
	});

	it("surfaces single routine errors for non-404 responses", async () => {
		const fetchMock = mockJsonError("Routine request failed", { status: 500 });
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = await renderHook(() => useRoutine("routine-1"), {
			wrapper,
		});

		await vi.waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect(result.current.error).toBeInstanceOf(Error);
		expect((result.current.error as Error).message).toBe(
			"Routine request failed",
		);
		expect(getFetchRequest(fetchMock).url.pathname).toBe(
			"/api/routines/routine-1",
		);
	});

	it("fetches paginated routines with semantic params and cursor progression", async () => {
		const filters = { search: "push" };
		const pageOne = {
			page: [createRoutineDto("routine-1", "Push")],
			isDone: false,
			continueCursor: "cursor-2",
		} satisfies CursorPage<RoutineQueryDto>;
		const pageTwo = {
			page: [createRoutineDto("routine-2", "Push")],
			isDone: true,
			continueCursor: null,
		} satisfies CursorPage<RoutineQueryDto>;
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(Response.json(pageOne))
			.mockResolvedValueOnce(Response.json(pageTwo));
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();

		const { result } = await renderHook(() => useRoutines(filters), {
			wrapper,
		});

		await vi.waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		const firstRequest = getFetchRequest(fetchMock, 0);
		expect(firstRequest.url.pathname).toBe("/api/routines");
		expect(firstRequest.url.searchParams.get("search")).toBe("push");
		expect(firstRequest.url.searchParams.get("limit")).toBe("20");
		expect(firstRequest.url.searchParams.get("cursor")).toBeNull();
		expect(firstRequest.init).toEqual(
			expect.objectContaining({ signal: expect.any(AbortSignal) }),
		);
		expect(result.current.data?.pages[0]?.page[0]?.createdAt).toBeInstanceOf(
			Date,
		);

		await act(async () => {
			await result.current.fetchNextPage();
		});

		await vi.waitFor(() => {
			expect(result.current.data?.pages).toHaveLength(2);
		});

		const secondRequest = getFetchRequest(fetchMock, 1);
		expect(secondRequest.url.pathname).toBe("/api/routines");
		expect(secondRequest.url.searchParams.get("cursor")).toBe("cursor-2");
		expect(
			queryClient.getQueryData(queryKeys.routines.list(filters)),
		).toBeDefined();
	});

	it("returns no next routines page when the continue cursor is absent", async () => {
		const page = {
			page: [createRoutineDto("routine-1", "Push")],
			isDone: false,
			continueCursor: null,
		} satisfies CursorPage<RoutineQueryDto>;
		const fetchMock = mockJsonSuccess(page);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();

		const { result } = await renderHook(() => useRoutines(), { wrapper });

		await vi.waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		const request = getFetchRequest(fetchMock, 0);
		expect(request.url.pathname).toBe("/api/routines");
		expect(request.url.searchParams.get("search")).toBeNull();
		expect(request.url.searchParams.get("cursor")).toBeNull();
		expect(request.url.searchParams.get("limit")).toBe("20");
		expect(result.current.hasNextPage).toBe(false);
		expect(queryClient.getQueryData(queryKeys.routines.list({}))).toBeDefined();
	});

	it("surfaces errors when the routine list request fails", async () => {
		const fetchMock = mockJsonError("Routine list failed", { status: 500 });
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = await renderHook(() => useRoutines(), { wrapper });

		await vi.waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		const request = getFetchRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/routines");
		expect(request.url.searchParams.get("search")).toBeNull();
		expect(request.url.searchParams.get("limit")).toBe("20");
		expect((result.current.error as Error).message).toBe("Routine list failed");
	});

	it("uses the routine search hook as a routines list query with search filters", async () => {
		const filters = { search: "core" };
		const page = {
			page: [createRoutineDto("routine-3", "Core")],
			isDone: true,
			continueCursor: null,
		} satisfies CursorPage<RoutineQueryDto>;
		const fetchMock = mockJsonSuccess(page);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();

		const { result } = await renderHook(() => useRoutineSearch("core"), {
			wrapper,
		});

		await vi.waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		const request = getFetchRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/routines");
		expect(request.url.searchParams.get("search")).toBe("core");
		expect(request.url.searchParams.get("limit")).toBe("20");
		expect(
			queryClient.getQueryData(queryKeys.routines.list(filters)),
		).toBeDefined();
	});
});
