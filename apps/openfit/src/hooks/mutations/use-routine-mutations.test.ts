import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import type { MutationSuccessResult, RoutineDto } from "@/lib/api-types";
import { queryKeys } from "@/lib/query-keys";
import { mockJsonError, mockJsonSuccess } from "@/test/fetch";
import { createTestQueryWrapper } from "@/test/query-client";
import {
	useCreateRoutine,
	useDeleteRoutine,
	useUpdateRoutine,
} from "./use-routine-mutations";

function getRequest(fetchMock: { mock: { calls: Array<unknown[]> } }) {
	const [input, init] = fetchMock.mock.calls[0] ?? [];

	expect(typeof input).toBe("string");

	return {
		url: new URL(input, "http://localhost"),
		init: init as RequestInit | undefined,
	};
}

const routineResponse = {
	id: "routine-1",
	userId: "user-1",
	name: "Push Pull Legs",
	description: "Rotating strength split",
	createdAt: "2026-02-01T10:00:00.000Z",
	updatedAt: "2026-02-01T10:00:00.000Z",
	routineDays: [],
} satisfies RoutineDto;
const originalFetch = globalThis.fetch;

describe("use-routine-mutations", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
		expect(globalThis.fetch).toBe(originalFetch);
	});

	it("creates a routine and invalidates routines.all", async () => {
		const fetchMock = mockJsonSuccess(routineResponse);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();
		const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
		const input = {
			name: "Push Pull Legs",
			description: "Rotating strength split",
		};

		const { result } = await renderHook(() => useCreateRoutine(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync(input);
		});

		await vi.waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		const request = getRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/routines");
		expect(request.init).toEqual(
			expect.objectContaining({
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(input),
			}),
		);
		expect(invalidateQueriesSpy.mock.calls.map(([filters]) => filters)).toEqual(
			[{ queryKey: queryKeys.routines.all }],
		);
	});

	it("updates a routine and invalidates routine detail and list keys", async () => {
		const fetchMock = mockJsonSuccess(routineResponse);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();
		const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
		const input = {
			id: "routine-1",
			name: "PPL + Arms",
			description: "Added direct arm work",
		};

		const { result } = await renderHook(() => useUpdateRoutine(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync(input);
		});

		await vi.waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		const request = getRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/routines/routine-1");
		expect(request.init).toEqual(
			expect.objectContaining({
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: "PPL + Arms",
					description: "Added direct arm work",
				}),
			}),
		);
		expect(invalidateQueriesSpy.mock.calls.map(([filters]) => filters)).toEqual(
			[
				{ queryKey: queryKeys.routines.detail("routine-1") },
				{ queryKey: queryKeys.routines.lists() },
			],
		);
	});

	it("deletes a routine and invalidates routines.all", async () => {
		const response = { success: true } satisfies MutationSuccessResult;
		const fetchMock = mockJsonSuccess(response);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();
		const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

		const { result } = await renderHook(() => useDeleteRoutine(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync("routine-1");
		});

		await vi.waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		const request = getRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/routines/routine-1");
		expect(request.init).toEqual(
			expect.objectContaining({
				method: "DELETE",
			}),
		);
		expect(invalidateQueriesSpy.mock.calls.map(([filters]) => filters)).toEqual(
			[{ queryKey: queryKeys.routines.all }],
		);
	});

	it("propagates routine update errors without invalidating caches", async () => {
		const fetchMock = mockJsonError("Routine name already exists", {
			status: 409,
		});
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();
		const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
		const input = {
			id: "routine-1",
			name: "Push Pull Legs",
			description: "Rotating strength split",
		};

		const { result } = await renderHook(() => useUpdateRoutine(), { wrapper });

		await act(async () => {
			await expect(result.current.mutateAsync(input)).rejects.toThrow(
				"Routine name already exists",
			);
		});

		await vi.waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		const request = getRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/routines/routine-1");
		expect(request.init).toEqual(
			expect.objectContaining({
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: "Push Pull Legs",
					description: "Rotating strength split",
				}),
			}),
		);
		expect(result.current.error).toBeInstanceOf(Error);
		expect(result.current.error?.message).toBe("Routine name already exists");
		expect(invalidateQueriesSpy).not.toHaveBeenCalled();
	});
});
