import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { queryKeys } from "@/lib/query-keys";
import type { DashboardRecentSession, DashboardStats } from "@/lib/types";
import { mockJsonError, mockJsonSuccess } from "@/test/fetch";
import { createTestQueryWrapper } from "@/test/query-client";
import { useDashboardStats, useRecentSessions } from "./use-dashboard";

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

describe("use-dashboard queries", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
		expect(globalThis.fetch).toBe(originalFetch);
	});

	it("fetches dashboard stats and caches by dashboard stats query key", async () => {
		const stats = {
			totalSessions: 24,
			totalRoutines: 6,
			thisWeekSessions: 3,
			currentStreak: 4,
		} satisfies DashboardStats;
		const fetchMock = mockJsonSuccess(stats);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();

		const { result } = await renderHook(() => useDashboardStats(), { wrapper });

		await vi.waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toEqual(stats);
		expect(getFetchRequest(fetchMock).pathname).toBe("/api/dashboard/stats");
		expect(queryClient.getQueryData(queryKeys.dashboard.stats())).toEqual(
			stats,
		);
	});

	it("fetches recent sessions from the recent sessions dashboard endpoint", async () => {
		const sessions = [
			{
				id: "session-1",
				name: "Push Day",
				startTime: "2026-02-01T10:00:00.000Z",
				endTime: null,
				impression: 4,
				setGroups: [
					{
						id: "set-group-1",
						type: "NORMAL",
						order: 1,
						sets: [
							{
								id: "set-1",
								exerciseId: "exercise-1",
								exercise: {
									id: "exercise-1",
									name: "Bench Press",
									imageUrl: "/bench.png",
								},
							},
						],
					},
				],
			},
		] satisfies DashboardRecentSession[];
		const fetchMock = mockJsonSuccess(sessions);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();

		const { result } = await renderHook(() => useRecentSessions(), { wrapper });

		await vi.waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toEqual(sessions);
		expect(getFetchRequest(fetchMock).pathname).toBe(
			"/api/dashboard/recent-sessions",
		);
		expect(
			queryClient.getQueryData(queryKeys.dashboard.recentSessions()),
		).toEqual(sessions);
	});

	it("surfaces server errors when dashboard stats cannot be fetched", async () => {
		const fetchMock = mockJsonError("Stats unavailable", { status: 500 });
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = await renderHook(() => useDashboardStats(), { wrapper });

		await vi.waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect(result.current.error).toBeInstanceOf(Error);
		expect((result.current.error as Error).message).toBe("Stats unavailable");
		expect(getFetchRequest(fetchMock).pathname).toBe("/api/dashboard/stats");
	});
});
