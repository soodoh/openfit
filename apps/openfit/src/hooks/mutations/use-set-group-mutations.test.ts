import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
	MutationSuccessResult,
	WorkoutSetGroupWithMutationSetsResult,
} from "@/lib/api-types";
import { queryKeys } from "@/lib/query-keys";
import { mockJsonSuccess } from "@/test/fetch";
import { createTestQueryWrapper } from "@/test/query-client";
import {
	useCreateSetGroup,
	useDeleteSetGroup,
} from "./use-set-group-mutations";

function getRequest(fetchMock: { mock: { calls: Array<unknown[]> } }) {
	const [input, init] = fetchMock.mock.calls[0] ?? [];

	expect(typeof input).toBe("string");

	return {
		url: new URL(input, "http://localhost"),
		init: init as RequestInit | undefined,
	};
}

const setGroupResponse = {
	id: "set-group-1",
	userId: "user-1",
	routineDayId: null,
	sessionId: "session-1",
	type: "NORMAL",
	order: 0,
	comment: null,
	createdAt: "2026-02-01T10:00:00.000Z",
	updatedAt: "2026-02-01T10:00:00.000Z",
	sets: [],
} satisfies WorkoutSetGroupWithMutationSetsResult;
const originalFetch = globalThis.fetch;

describe("use-set-group-mutations", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
		expect(globalThis.fetch).toBe(originalFetch);
	});

	it("creates a set group and invalidates sessions and routineDays keys", async () => {
		const fetchMock = mockJsonSuccess(setGroupResponse);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();
		const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
		const input = {
			sessionId: "session-1",
			type: "SUPERSET" as const,
			exerciseId: "exercise-1",
			numSets: 4,
		};

		const { result } = renderHook(() => useCreateSetGroup(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync(input);
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		const request = getRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/set-groups");
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

	it("deletes a set group and invalidates sessions and routineDays keys", async () => {
		const response = { success: true } satisfies MutationSuccessResult;
		const fetchMock = mockJsonSuccess(response);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();
		const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

		const { result } = renderHook(() => useDeleteSetGroup(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync("set-group-1");
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		const request = getRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/set-groups/set-group-1");
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
});
