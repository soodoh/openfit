import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { RoutineDayDetailDto, RoutineDaySearchDto } from "@/lib/api-types";
import { queryKeys } from "@/lib/query-keys";
import { mockJsonError, mockJsonSuccess } from "@/test/fetch";
import { createTestQueryWrapper } from "@/test/query-client";
import { useRoutineDay, useRoutineDaySearch } from "./use-routine-days";

const originalFetch = globalThis.fetch;

type FetchMock = {
	mock: {
		calls: unknown[][];
	};
};

function getFetchRequest(fetchMock: FetchMock, callIndex = 0) {
	const [input] = fetchMock.mock.calls[callIndex] ?? [];

	expect(typeof input).toBe("string");

	return new URL(input, "http://localhost");
}

function routineDaySearchKey(term: string, limit: number) {
	return [...queryKeys.routineDays.search(term), { limit }] as const;
}

describe("use-routine-days queries", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
		expect(globalThis.fetch).toBe(originalFetch);
	});

	it("does not fetch a routine day when the id is undefined", async () => {
		const fetchMock = mockJsonSuccess({});
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = renderHook(() => useRoutineDay(undefined), { wrapper });

		await waitFor(() => {
			expect(result.current.fetchStatus).toBe("idle");
		});

		expect(result.current.data).toBeUndefined();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("fetches and parses a routine day detail payload", async () => {
		const detail = {
			id: "day-1",
			routineId: "routine-1",
			userId: "user-1",
			description: "Push day",
			createdAt: "2026-01-10T00:00:00.000Z",
			updatedAt: "2026-01-11T00:00:00.000Z",
			weekdays: [1, 3],
			routine: {
				id: "routine-1",
				userId: "user-1",
				name: "Push/Pull",
				description: null,
				createdAt: "2026-01-01T00:00:00.000Z",
				updatedAt: "2026-01-02T00:00:00.000Z",
			},
			setGroups: [
				{
					id: "set-group-1",
					userId: "user-1",
					routineDayId: "day-1",
					sessionId: null,
					type: "NORMAL",
					order: 1,
					comment: null,
					createdAt: "2026-01-10T00:00:00.000Z",
					updatedAt: "2026-01-11T00:00:00.000Z",
					sets: [
						{
							id: "set-1",
							userId: "user-1",
							setGroupId: "set-group-1",
							exerciseId: "exercise-1",
							type: "NORMAL",
							order: 1,
							reps: 10,
							repetitionUnitId: "reps",
							weight: 135,
							weightUnitId: "lb",
							restTime: 90,
							completed: false,
							createdAt: "2026-01-10T00:00:00.000Z",
							updatedAt: "2026-01-11T00:00:00.000Z",
							exercise: {
								id: "exercise-1",
								name: "Bench Press",
								imageUrl: undefined,
							},
							repetitionUnit: { id: "reps", name: "Reps" },
							weightUnit: { id: "lb", name: "lb" },
						},
						{
							id: "set-2",
							userId: "user-1",
							setGroupId: "set-group-1",
							exerciseId: "exercise-2",
							type: "NORMAL",
							order: 2,
							reps: 8,
							repetitionUnitId: "reps",
							weight: 155,
							weightUnitId: "lb",
							restTime: 120,
							completed: true,
							createdAt: "2026-01-10T00:00:00.000Z",
							updatedAt: "2026-01-11T00:00:00.000Z",
							exercise: null,
							repetitionUnit: null,
							weightUnit: null,
						},
					],
				},
			],
		} satisfies RoutineDayDetailDto;
		const fetchMock = mockJsonSuccess(detail);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();

		const { result } = renderHook(() => useRoutineDay("day-1"), { wrapper });

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data?.createdAt).toBeInstanceOf(Date);
		expect(result.current.data?.updatedAt).toBeInstanceOf(Date);
		expect(result.current.data?.routine?.createdAt).toBeInstanceOf(Date);
		expect(
			result.current.data?.setGroups[0]?.sets[0]?.exercise?.imageUrl,
		).toBeNull();
		expect(result.current.data?.setGroups[0]?.sets[1]?.exercise).toBeNull();
		expect(getFetchRequest(fetchMock).pathname).toBe("/api/routine-days/day-1");
		expect(
			queryClient.getQueryData(queryKeys.routineDays.detail("day-1")),
		).toBe(result.current.data);
	});

	it("preserves a null routine in routine day detail responses", async () => {
		const detail = {
			id: "day-2",
			routineId: "routine-2",
			userId: "user-1",
			description: null,
			createdAt: "2026-01-12T00:00:00.000Z",
			updatedAt: "2026-01-13T00:00:00.000Z",
			weekdays: [2, 4],
			routine: null,
			setGroups: [],
		} satisfies RoutineDayDetailDto;
		const fetchMock = mockJsonSuccess(detail);
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = renderHook(() => useRoutineDay("day-2"), { wrapper });

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data?.routine).toBeNull();
		expect(result.current.data?.createdAt).toBeInstanceOf(Date);
		expect(getFetchRequest(fetchMock).pathname).toBe("/api/routine-days/day-2");
	});

	it("surfaces a coherent not-found error for missing routine day details", async () => {
		const fetchMock = vi.fn(() =>
			Promise.resolve(Response.json({ error: "Not found" }, { status: 404 })),
		);
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = renderHook(() => useRoutineDay("missing-day"), {
			wrapper,
		});

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect((result.current.error as Error).message).toBe(
			"Routine day not found",
		);
		expect(getFetchRequest(fetchMock).pathname).toBe(
			"/api/routine-days/missing-day",
		);
	});

	it("surfaces routine day detail fetch errors for non-404 failures", async () => {
		const fetchMock = mockJsonError("Routine day request failed", {
			status: 500,
		});
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = renderHook(() => useRoutineDay("day-1"), { wrapper });

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect(result.current.error).toBeInstanceOf(Error);
		expect((result.current.error as Error).message).toBe(
			"Routine day request failed",
		);
		expect(getFetchRequest(fetchMock).pathname).toBe("/api/routine-days/day-1");
	});

	it("searches routine days with semantic query params and parses timestamps", async () => {
		const searchResults = [
			{
				id: "day-1",
				routineId: "routine-1",
				userId: "user-1",
				description: "Push day",
				createdAt: "2026-01-10T00:00:00.000Z",
				updatedAt: "2026-01-11T00:00:00.000Z",
				weekdays: [1, 3],
				routine: {
					id: "routine-1",
					userId: "user-1",
					name: "Push/Pull",
					description: null,
					createdAt: "2026-01-01T00:00:00.000Z",
					updatedAt: "2026-01-02T00:00:00.000Z",
				},
			},
			{
				id: "day-2",
				routineId: "routine-2",
				userId: "user-1",
				description: "Leg day",
				createdAt: "2026-01-12T00:00:00.000Z",
				updatedAt: "2026-01-13T00:00:00.000Z",
				weekdays: [2, 4],
				routine: null,
			},
		] satisfies RoutineDaySearchDto[];
		const fetchMock = mockJsonSuccess(searchResults);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();

		const { result } = renderHook(() => useRoutineDaySearch("push", 5), {
			wrapper,
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		const requestUrl = getFetchRequest(fetchMock);
		expect(requestUrl.pathname).toBe("/api/routine-days");
		expect(requestUrl.searchParams.get("search")).toBe("push");
		expect(requestUrl.searchParams.get("limit")).toBe("5");
		expect(result.current.data?.[0]?.createdAt).toBeInstanceOf(Date);
		expect(result.current.data?.[0]?.routine?.createdAt).toBeInstanceOf(Date);
		expect(result.current.data?.[1]?.routine).toBeNull();
		expect(queryClient.getQueryData(routineDaySearchKey("push", 5))).toEqual(
			result.current.data,
		);
	});

	it("surfaces search errors for routine day queries", async () => {
		const fetchMock = mockJsonError("Routine day search failed", {
			status: 500,
		});
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = renderHook(() => useRoutineDaySearch("push"), {
			wrapper,
		});

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect((result.current.error as Error).message).toBe(
			"Routine day search failed",
		);
		expect(getFetchRequest(fetchMock).pathname).toBe("/api/routine-days");
	});

	it("uses distinct cache keys for the same term when limits differ", async () => {
		const limitedResults = [
			{
				id: "day-1",
				routineId: "routine-1",
				userId: "user-1",
				description: "Limited push day",
				createdAt: "2026-01-10T00:00:00.000Z",
				updatedAt: "2026-01-11T00:00:00.000Z",
				weekdays: [1, 3],
				routine: null,
			},
		] satisfies RoutineDaySearchDto[];
		const expandedResults = [
			...limitedResults,
			{
				id: "day-2",
				routineId: "routine-1",
				userId: "user-1",
				description: "Expanded push day",
				createdAt: "2026-01-12T00:00:00.000Z",
				updatedAt: "2026-01-13T00:00:00.000Z",
				weekdays: [2, 4],
				routine: null,
			},
		] satisfies RoutineDaySearchDto[];
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(Response.json(limitedResults))
			.mockResolvedValueOnce(Response.json(expandedResults));
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();

		const { result: limited } = renderHook(
			() => useRoutineDaySearch("push", 1),
			{
				wrapper,
			},
		);

		await waitFor(() => {
			expect(limited.current.isSuccess).toBe(true);
		});

		const { result: expanded } = renderHook(
			() => useRoutineDaySearch("push", 2),
			{ wrapper },
		);

		await waitFor(() => {
			expect(expanded.current.isSuccess).toBe(true);
		});

		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(getFetchRequest(fetchMock, 0).searchParams.get("limit")).toBe("1");
		expect(getFetchRequest(fetchMock, 1).searchParams.get("limit")).toBe("2");
		expect(queryClient.getQueryData(routineDaySearchKey("push", 1))).toEqual(
			limited.current.data,
		);
		expect(queryClient.getQueryData(routineDaySearchKey("push", 2))).toEqual(
			expanded.current.data,
		);
		expect(
			queryClient.getQueryData(routineDaySearchKey("push", 1)),
		).not.toEqual(queryClient.getQueryData(routineDaySearchKey("push", 2)));
	});

	it("omits the search param when searching routine days with an empty term", async () => {
		const fetchMock = mockJsonSuccess([]);
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = renderHook(() => useRoutineDaySearch(""), { wrapper });

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		const requestUrl = getFetchRequest(fetchMock);
		expect(requestUrl.pathname).toBe("/api/routine-days");
		expect(requestUrl.searchParams.get("search")).toBeNull();
		expect(requestUrl.searchParams.get("limit")).toBe("10");
	});
});
