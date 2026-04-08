import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { GymDto, MutationSuccessResult } from "@/lib/api-types";
import { queryKeys } from "@/lib/query-keys";
import { mockJsonError, mockJsonSuccess } from "@/test/fetch";
import { createTestQueryWrapper } from "@/test/query-client";
import { useCreateGym, useDeleteGym, useUpdateGym } from "./use-gym-mutations";

function getRequest(fetchMock: { mock: { calls: Array<unknown[]> } }) {
	const [input, init] = fetchMock.mock.calls[0] ?? [];

	expect(typeof input).toBe("string");

	return {
		url: new URL(input, "http://localhost"),
		init: init as RequestInit | undefined,
	};
}

const gymResponse = {
	id: "gym-1",
	userId: "user-1",
	name: "Home Gym",
	createdAt: "2026-02-01T10:00:00.000Z",
	updatedAt: "2026-02-01T10:00:00.000Z",
	equipmentIds: ["equipment-1", "equipment-2"],
} satisfies GymDto;
const originalFetch = globalThis.fetch;

describe("use-gym-mutations", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
		expect(globalThis.fetch).toBe(originalFetch);
	});

	it("creates a gym and invalidates gyms.all", async () => {
		const fetchMock = mockJsonSuccess(gymResponse);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();
		const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
		const input = {
			name: "Home Gym",
			equipmentIds: ["equipment-1", "equipment-2"],
		};

		const { result } = renderHook(() => useCreateGym(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync(input);
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		const request = getRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/gyms");
		expect(request.init).toEqual(
			expect.objectContaining({
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(input),
			}),
		);
		expect(invalidateQueriesSpy.mock.calls.map(([filters]) => filters)).toEqual(
			[{ queryKey: queryKeys.gyms.all }],
		);
	});

	it("updates a gym and invalidates gym detail and list keys", async () => {
		const fetchMock = mockJsonSuccess(gymResponse);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();
		const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
		const input = {
			id: "gym-1",
			name: "Updated Gym",
			equipmentIds: ["equipment-3"],
		};

		const { result } = renderHook(() => useUpdateGym(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync(input);
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		const request = getRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/gyms/gym-1");
		expect(request.init).toEqual(
			expect.objectContaining({
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: "Updated Gym",
					equipmentIds: ["equipment-3"],
				}),
			}),
		);
		expect(invalidateQueriesSpy.mock.calls.map(([filters]) => filters)).toEqual(
			[
				{ queryKey: queryKeys.gyms.detail("gym-1") },
				{ queryKey: queryKeys.gyms.list() },
			],
		);
	});

	it("deletes a gym and invalidates gyms.all", async () => {
		const response = { success: true } satisfies MutationSuccessResult;
		const fetchMock = mockJsonSuccess(response);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();
		const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

		const { result } = renderHook(() => useDeleteGym(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync("gym-1");
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		const request = getRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/gyms/gym-1");
		expect(request.init).toEqual(
			expect.objectContaining({
				method: "DELETE",
			}),
		);
		expect(invalidateQueriesSpy.mock.calls.map(([filters]) => filters)).toEqual(
			[{ queryKey: queryKeys.gyms.all }],
		);
	});

	it("propagates gym update errors without invalidating caches", async () => {
		const fetchMock = mockJsonError("Gym name already exists", { status: 409 });
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();
		const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
		const input = {
			id: "gym-1",
			name: "Home Gym",
			equipmentIds: ["equipment-1"],
		};

		const { result } = renderHook(() => useUpdateGym(), { wrapper });

		await act(async () => {
			await expect(result.current.mutateAsync(input)).rejects.toThrow(
				"Gym name already exists",
			);
		});

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		const request = getRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/gyms/gym-1");
		expect(request.init).toEqual(
			expect.objectContaining({
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: "Home Gym",
					equipmentIds: ["equipment-1"],
				}),
			}),
		);
		expect(result.current.error).toBeInstanceOf(Error);
		expect(result.current.error?.message).toBe("Gym name already exists");
		expect(invalidateQueriesSpy).not.toHaveBeenCalled();
	});
});
