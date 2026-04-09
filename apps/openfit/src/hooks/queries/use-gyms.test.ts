import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { queryKeys } from "@/lib/query-keys";
import { mockJsonError, mockJsonSuccess } from "@/test/fetch";
import { createTestQueryWrapper } from "@/test/query-client";
import { useGym, useGyms } from "./use-gyms";

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

describe("use-gyms queries", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
		expect(globalThis.fetch).toBe(originalFetch);
	});

	it("fetches all gyms and stores them under the gyms list query key", async () => {
		const gyms = [
			{
				id: "gym-1",
				userId: "user-1",
				name: "Home Gym",
				createdAt: "2026-01-01T00:00:00.000Z",
				updatedAt: "2026-01-01T00:00:00.000Z",
				equipmentIds: ["equipment-1", "equipment-2"],
			},
		];
		const fetchMock = mockJsonSuccess(gyms);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();

		const { result } = renderHook(() => useGyms(), { wrapper });

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toEqual(gyms);
		expect(getFetchRequest(fetchMock).pathname).toBe("/api/gyms");
		expect(queryClient.getQueryData(queryKeys.gyms.list())).toEqual(gyms);
	});

	it("surfaces errors from the gyms list request", async () => {
		const fetchMock = mockJsonError("Gym list failed", { status: 500 });
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = renderHook(() => useGyms(), { wrapper });

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect((result.current.error as Error).message).toBe("Gym list failed");
		expect(getFetchRequest(fetchMock).pathname).toBe("/api/gyms");
	});

	it("does not fetch a single gym when the id is undefined", async () => {
		const fetchMock = mockJsonSuccess({
			id: "gym-1",
			userId: "user-1",
			name: "Home Gym",
			createdAt: "2026-01-01T00:00:00.000Z",
			updatedAt: "2026-01-01T00:00:00.000Z",
			equipmentIds: [],
		});
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = renderHook(() => useGym(undefined), { wrapper });

		await waitFor(() => {
			expect(result.current.fetchStatus).toBe("idle");
		});

		expect(result.current.data).toBeUndefined();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("fetches a specific gym by id and caches it by detail key", async () => {
		const gym = {
			id: "gym-1",
			userId: "user-1",
			name: "Home Gym",
			createdAt: "2026-01-01T00:00:00.000Z",
			updatedAt: "2026-01-01T00:00:00.000Z",
			equipmentIds: ["equipment-1"],
		};
		const fetchMock = mockJsonSuccess(gym);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();

		const { result } = renderHook(() => useGym("gym-1"), { wrapper });

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toEqual(gym);
		expect(getFetchRequest(fetchMock).pathname).toBe("/api/gyms/gym-1");
		expect(queryClient.getQueryData(queryKeys.gyms.detail("gym-1"))).toEqual(
			gym,
		);
	});

	it("surfaces a coherent not-found error for missing gyms", async () => {
		const fetchMock = vi.fn(() =>
			Promise.resolve(Response.json({ error: "Not found" }, { status: 404 })),
		);
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = renderHook(() => useGym("missing-gym"), { wrapper });

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect((result.current.error as Error).message).toBe("Gym not found");
		expect(getFetchRequest(fetchMock).pathname).toBe("/api/gyms/missing-gym");
	});

	it("surfaces fetch errors for non-404 single gym failures", async () => {
		const fetchMock = mockJsonError("Gym request failed", { status: 500 });
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = renderHook(() => useGym("gym-1"), { wrapper });

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect(result.current.error).toBeInstanceOf(Error);
		expect((result.current.error as Error).message).toBe("Gym request failed");
		expect(getFetchRequest(fetchMock).pathname).toBe("/api/gyms/gym-1");
	});
});
