import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { MutationIdResult } from "@/lib/api-types";
import { queryKeys } from "@/lib/query-keys";
import { mockJsonError, mockJsonSuccess } from "@/test/fetch";
import { createTestQueryWrapper } from "@/test/query-client";
import {
	useAdminCreateExercise,
	useAdminUpdateExercise,
} from "./use-admin-mutations";

function getRequest(fetchMock: { mock: { calls: Array<unknown[]> } }) {
	const [input, init] = fetchMock.mock.calls[0] ?? [];

	expect(typeof input).toBe("string");

	return {
		url: new URL(input, "http://localhost"),
		init: init as RequestInit | undefined,
	};
}
const originalFetch = globalThis.fetch;

describe("use-admin-mutations", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
		expect(globalThis.fetch).toBe(originalFetch);
	});

	it("creates an admin exercise and invalidates admin and public exercise keys", async () => {
		const response = { id: "exercise-1" } satisfies MutationIdResult;
		const fetchMock = mockJsonSuccess(response);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();
		const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
		const input = {
			name: "Bench Press",
			level: "beginner" as const,
			force: "push" as const,
			mechanic: "compound" as const,
			equipmentId: "equipment-1",
			categoryId: "category-1",
			primaryMuscleIds: ["muscle-1"],
			secondaryMuscleIds: ["muscle-2"],
			instructions: ["Set your shoulders", "Press the bar"],
			imageUrls: ["/bench-press.jpg"],
		};

		const { result } = renderHook(() => useAdminCreateExercise(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync(input);
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		const request = getRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/admin/exercises");
		expect(request.init).toEqual(
			expect.objectContaining({
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(input),
			}),
		);
		expect(invalidateQueriesSpy.mock.calls.map(([filters]) => filters)).toEqual(
			[
				{ queryKey: queryKeys.admin.exercises() },
				{ queryKey: queryKeys.exercises.all },
			],
		);
	});

	it("propagates admin exercise update errors without invalidating caches", async () => {
		const fetchMock = mockJsonError("Exercise already exists", { status: 409 });
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();
		const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
		const input = {
			id: "exercise-1",
			name: "Bench Press",
			level: "expert" as const,
			force: "push" as const,
			mechanic: "compound" as const,
			equipmentId: "equipment-1",
			categoryId: "category-1",
			primaryMuscleIds: ["muscle-1"],
			secondaryMuscleIds: [],
			instructions: ["Drive through the floor"],
			imageUrls: ["/bench-press.jpg"],
		};

		const { result } = renderHook(() => useAdminUpdateExercise(), { wrapper });

		await act(async () => {
			await expect(result.current.mutateAsync(input)).rejects.toThrow(
				"Exercise already exists",
			);
		});

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		const request = getRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/admin/exercises/exercise-1");
		expect(request.init).toEqual(
			expect.objectContaining({
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: "Bench Press",
					level: "expert",
					force: "push",
					mechanic: "compound",
					equipmentId: "equipment-1",
					categoryId: "category-1",
					primaryMuscleIds: ["muscle-1"],
					secondaryMuscleIds: [],
					instructions: ["Drive through the floor"],
					imageUrls: ["/bench-press.jpg"],
				}),
			}),
		);
		expect(result.current.error).toBeInstanceOf(Error);
		expect(result.current.error?.message).toBe("Exercise already exists");
		expect(invalidateQueriesSpy).not.toHaveBeenCalled();
	});
});
