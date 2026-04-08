import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { MutationSuccessResult, RoutineDayDto } from "@/lib/api-types";
import { queryKeys } from "@/lib/query-keys";
import { mockJsonError, mockJsonSuccess } from "@/test/fetch";
import { createTestQueryWrapper } from "@/test/query-client";
import {
	useCreateRoutineDay,
	useDeleteRoutineDay,
	useUpdateRoutineDay,
} from "./use-routine-day-mutations";

function getRequest(fetchMock: { mock: { calls: Array<unknown[]> } }) {
	const [input, init] = fetchMock.mock.calls[0] ?? [];

	expect(typeof input).toBe("string");

	return {
		url: new URL(input, "http://localhost"),
		init: init as RequestInit | undefined,
	};
}

const routineDayResponse = {
	id: "routine-day-1",
	routineId: "routine-1",
	userId: "user-1",
	description: "Push Day",
	createdAt: "2026-02-01T10:00:00.000Z",
	updatedAt: "2026-02-01T10:00:00.000Z",
	weekdays: [1, 3, 5],
} satisfies RoutineDayDto;
const originalFetch = globalThis.fetch;

describe("use-routine-day-mutations", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
		expect(globalThis.fetch).toBe(originalFetch);
	});

	it("creates a routine day and invalidates routine day and routine detail keys", async () => {
		const fetchMock = mockJsonSuccess(routineDayResponse);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();
		const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
		const input = {
			routineId: "routine-1",
			description: "Push Day",
			weekdays: [1, 3, 5],
		};

		const { result } = renderHook(() => useCreateRoutineDay(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync(input);
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		const request = getRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/routine-days");
		expect(request.init).toEqual(
			expect.objectContaining({
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(input),
			}),
		);
		expect(invalidateQueriesSpy.mock.calls.map(([filters]) => filters)).toEqual(
			[
				{ queryKey: queryKeys.routineDays.all },
				{ queryKey: queryKeys.routines.detail("routine-1") },
			],
		);
	});

	it("updates a routine day and invalidates routine day detail and parent routine detail", async () => {
		const fetchMock = mockJsonSuccess(routineDayResponse);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();
		const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
		const input = {
			id: "routine-day-1",
			description: "Updated Push Day",
			weekdays: [1, 4],
		};

		const { result } = renderHook(() => useUpdateRoutineDay(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync(input);
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		const request = getRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/routine-days/routine-day-1");
		expect(request.init).toEqual(
			expect.objectContaining({
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					description: "Updated Push Day",
					weekdays: [1, 4],
				}),
			}),
		);
		expect(invalidateQueriesSpy.mock.calls.map(([filters]) => filters)).toEqual(
			[
				{ queryKey: queryKeys.routineDays.detail("routine-day-1") },
				{ queryKey: queryKeys.routines.detail("routine-1") },
			],
		);
	});

	it("does not invalidate parent routine detail when update response has empty routineId", async () => {
		const fetchMock = mockJsonSuccess({
			...routineDayResponse,
			routineId: "",
		} satisfies RoutineDayDto);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();
		const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

		const { result } = renderHook(() => useUpdateRoutineDay(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync({
				id: "routine-day-1",
				description: "Updated Push Day",
			});
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(invalidateQueriesSpy.mock.calls.map(([filters]) => filters)).toEqual(
			[{ queryKey: queryKeys.routineDays.detail("routine-day-1") }],
		);
	});

	it("deletes a routine day and invalidates routineDays.all and routines.all", async () => {
		const response = { success: true } satisfies MutationSuccessResult;
		const fetchMock = mockJsonSuccess(response);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();
		const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

		const { result } = renderHook(() => useDeleteRoutineDay(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync("routine-day-1");
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		const request = getRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/routine-days/routine-day-1");
		expect(request.init).toEqual(
			expect.objectContaining({
				method: "DELETE",
			}),
		);
		expect(invalidateQueriesSpy.mock.calls.map(([filters]) => filters)).toEqual(
			[
				{ queryKey: queryKeys.routineDays.all },
				{ queryKey: queryKeys.routines.all },
			],
		);
	});

	it("propagates create routine day errors without invalidating caches", async () => {
		const fetchMock = mockJsonError("Routine day already exists", {
			status: 409,
		});
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();
		const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
		const input = {
			routineId: "routine-1",
			description: "Push Day",
			weekdays: [1],
		};

		const { result } = renderHook(() => useCreateRoutineDay(), { wrapper });

		await act(async () => {
			await expect(result.current.mutateAsync(input)).rejects.toThrow(
				"Routine day already exists",
			);
		});

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		const request = getRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/routine-days");
		expect(request.init).toEqual(
			expect.objectContaining({
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(input),
			}),
		);
		expect(result.current.error).toBeInstanceOf(Error);
		expect(result.current.error?.message).toBe("Routine day already exists");
		expect(invalidateQueriesSpy).not.toHaveBeenCalled();
	});
});
