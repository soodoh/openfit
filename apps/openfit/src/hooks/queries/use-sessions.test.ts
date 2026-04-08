import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
	WorkoutSessionSummary,
	WorkoutSessionWithData,
} from "@/lib/types";
import { mockJsonSuccess } from "@/test/fetch";
import { createTestQueryWrapper } from "@/test/query-client";
import {
	useSession,
	useSessions,
	useSessionsByDateRange,
} from "./use-sessions";

const session = {
	id: "session-1",
	userId: "user-1",
	name: "Upper Body",
	notes: "",
	impression: null,
	startTime: "2026-02-01T10:00:00.000Z",
	endTime: null,
	templateId: null,
	createdAt: "2026-02-01T10:00:00.000Z",
	updatedAt: "2026-02-01T10:00:00.000Z",
	setGroups: [],
} satisfies WorkoutSessionWithData;

describe("use-sessions queries", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("requests sessions in a date range with the expected search params", async () => {
		const summaries = [
			{
				id: "session-1",
				createdAt: "2026-02-01T10:00:00.000Z",
				name: "Upper Body",
				startTime: "2026-02-01T10:00:00.000Z",
				endTime: null,
				impression: 4,
			},
		] satisfies WorkoutSessionSummary[];
		const fetchMock = mockJsonSuccess(summaries);
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = renderHook(() => useSessionsByDateRange(100, 200), {
			wrapper,
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toEqual(summaries);
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/sessions?startDate=100&endDate=200",
		);
	});

	it("does not fetch a single session when the id is undefined", async () => {
		const fetchMock = mockJsonSuccess(session);
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = renderHook(() => useSession(undefined), { wrapper });

		await waitFor(() => {
			expect(result.current.fetchStatus).toBe("idle");
		});

		expect(result.current.data).toBeUndefined();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("fetches the sessions list successfully", async () => {
		const sessions = [session];
		const fetchMock = mockJsonSuccess(sessions);
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = renderHook(() => useSessions(), { wrapper });

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toEqual(sessions);
		expect(fetchMock).toHaveBeenCalledWith("/api/sessions");
	});
});
