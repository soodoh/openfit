import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
	MutationSuccessResult,
	SetDeleteResult,
	WorkoutSetMutationResult,
} from "@/lib/api-types";
import { queryKeys } from "@/lib/query-keys";
import { mockJsonError, mockJsonSuccess } from "@/test/fetch";
import { createTestQueryWrapper } from "@/test/query-client";
import {
	useCreateSet,
	useDeleteSet,
	useReorderSets,
	useUpdateSet,
} from "./use-set-mutations";

function getRequest(fetchMock: { mock: { calls: Array<unknown[]> } }) {
	const [input, init] = fetchMock.mock.calls[0] ?? [];

	expect(typeof input).toBe("string");

	return {
		url: new URL(input, "http://localhost"),
		init: init as RequestInit | undefined,
	};
}

const setResponse = {
	id: "set-1",
	userId: "user-1",
	setGroupId: "set-group-1",
	exerciseId: "exercise-1",
	type: "NORMAL",
	order: 0,
	reps: 10,
	repetitionUnitId: "reps",
	weight: 135,
	weightUnitId: "lb",
	restTime: 90,
	completed: false,
	createdAt: "2026-02-01T10:00:00.000Z",
	updatedAt: "2026-02-01T10:00:00.000Z",
	exercise: {
		id: "exercise-1",
		name: "Bench Press",
		createdAt: "2026-02-01T10:00:00.000Z",
	},
	repetitionUnit: {
		id: "reps",
		name: "Repetitions",
		createdAt: "2026-02-01T10:00:00.000Z",
	},
	weightUnit: {
		id: "lb",
		name: "Pounds",
		createdAt: "2026-02-01T10:00:00.000Z",
	},
} satisfies WorkoutSetMutationResult;
const originalFetch = globalThis.fetch;

describe("use-set-mutations", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
		expect(globalThis.fetch).toBe(originalFetch);
	});

	it("creates a set and invalidates sessions and routineDays keys", async () => {
		const fetchMock = mockJsonSuccess(setResponse);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();
		const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
		const input = {
			setGroupId: "set-group-1",
			exerciseId: "exercise-1",
			type: "NORMAL" as const,
			reps: 10,
			repetitionUnitId: "reps",
			weight: 135,
			weightUnitId: "lb",
			restTime: 90,
		};

		const { result } = renderHook(() => useCreateSet(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync(input);
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		const request = getRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/sets");
		expect(request.init).toEqual(
			expect.objectContaining({
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(input),
			}),
		);
		expect(invalidateQueriesSpy.mock.calls.map(([filters]) => filters)).toEqual(
			[
				{ queryKey: queryKeys.sessions.all },
				{ queryKey: queryKeys.routineDays.all },
			],
		);
	});

	it("updates a set and invalidates sessions and routineDays keys", async () => {
		const fetchMock = mockJsonSuccess(setResponse);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();
		const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
		const input = {
			id: "set-1",
			type: "DROPSET" as const,
			reps: 8,
			weight: 115,
			completed: true,
		};

		const { result } = renderHook(() => useUpdateSet(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync(input);
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		const request = getRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/sets/set-1");
		expect(request.init).toEqual(
			expect.objectContaining({
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					type: "DROPSET",
					reps: 8,
					weight: 115,
					completed: true,
				}),
			}),
		);
		expect(invalidateQueriesSpy.mock.calls.map(([filters]) => filters)).toEqual(
			[
				{ queryKey: queryKeys.sessions.all },
				{ queryKey: queryKeys.routineDays.all },
			],
		);
	});

	it("deletes a set and invalidates sessions and routineDays keys", async () => {
		const response = {
			success: true,
			setGroupDeleted: false,
		} satisfies SetDeleteResult;
		const fetchMock = mockJsonSuccess(response);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();
		const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

		const { result } = renderHook(() => useDeleteSet(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync("set-1");
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		const request = getRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/sets/set-1");
		expect(request.init).toEqual(
			expect.objectContaining({
				method: "DELETE",
			}),
		);
		expect(invalidateQueriesSpy.mock.calls.map(([filters]) => filters)).toEqual(
			[
				{ queryKey: queryKeys.sessions.all },
				{ queryKey: queryKeys.routineDays.all },
			],
		);
	});

	it("reorders sets and invalidates sessions and routineDays keys", async () => {
		const response = { success: true } satisfies MutationSuccessResult;
		const fetchMock = mockJsonSuccess(response);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();
		const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
		const input = {
			setGroupId: "set-group-1",
			setIds: ["set-2", "set-1", "set-3"],
		};

		const { result } = renderHook(() => useReorderSets(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync(input);
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		const request = getRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/sets/reorder");
		expect(request.init).toEqual(
			expect.objectContaining({
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(input),
			}),
		);
		expect(invalidateQueriesSpy.mock.calls.map(([filters]) => filters)).toEqual(
			[
				{ queryKey: queryKeys.sessions.all },
				{ queryKey: queryKeys.routineDays.all },
			],
		);
	});

	it("propagates set update errors without invalidating caches", async () => {
		const fetchMock = mockJsonError("Set could not be updated", {
			status: 400,
		});
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();
		const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
		const input = {
			id: "set-1",
			reps: 12,
		};

		const { result } = renderHook(() => useUpdateSet(), { wrapper });

		await act(async () => {
			await expect(result.current.mutateAsync(input)).rejects.toThrow(
				"Set could not be updated",
			);
		});

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		const request = getRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/sets/set-1");
		expect(request.init).toEqual(
			expect.objectContaining({
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ reps: 12 }),
			}),
		);
		expect(result.current.error).toBeInstanceOf(Error);
		expect(result.current.error?.message).toBe("Set could not be updated");
		expect(invalidateQueriesSpy).not.toHaveBeenCalled();
	});
});
