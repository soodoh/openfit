import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { queryKeys } from "@/lib/query-keys";
import type {
	WorkoutSessionSummary,
	WorkoutSessionWithData,
} from "@/lib/types";
import { mockJsonError, mockJsonSuccess } from "@/test/fetch";
import { createTestQueryWrapper } from "@/test/query-client";
import {
	useCurrentSession,
	useSession,
	useSessions,
	useSessionsByDateRange,
} from "./use-sessions";

type FetchMock = {
	mock: {
		calls: unknown[][];
	};
};

function getFetchRequest(fetchMock: FetchMock) {
	const [input] = fetchMock.mock.calls[0] ?? [];

	expect(typeof input).toBe("string");

	return new URL(input, "http://localhost");
}

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

const originalFetch = globalThis.fetch;

describe("use-sessions queries", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
		expect(globalThis.fetch).toBe(originalFetch);
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

		const { result } = await renderHook(
			() => useSessionsByDateRange(100, 200),
			{
				wrapper,
			},
		);

		await vi.waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toEqual(summaries);
		const requestUrl = getFetchRequest(fetchMock);
		expect(requestUrl.pathname).toBe("/api/sessions");
		expect(requestUrl.searchParams.get("startDate")).toBe("100");
		expect(requestUrl.searchParams.get("endDate")).toBe("200");
	});

	it("surfaces errors from date-range session requests", async () => {
		const fetchMock = mockJsonError("Date range request failed", {
			status: 500,
		});
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = await renderHook(
			() => useSessionsByDateRange(100, 200),
			{
				wrapper,
			},
		);

		await vi.waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect((result.current.error as Error).message).toBe(
			"Date range request failed",
		);
	});

	it("surfaces errors from the sessions list request", async () => {
		const fetchMock = mockJsonError("Session list failed", { status: 500 });
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = await renderHook(() => useSessions(), { wrapper });

		await vi.waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect((result.current.error as Error).message).toBe("Session list failed");
		expect(getFetchRequest(fetchMock).pathname).toBe("/api/sessions");
	});

	it("does not fetch a single session when the id is undefined", async () => {
		const fetchMock = mockJsonSuccess(session);
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = await renderHook(() => useSession(undefined), {
			wrapper,
		});

		await vi.waitFor(() => {
			expect(result.current.fetchStatus).toBe("idle");
		});

		expect(result.current.data).toBeUndefined();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("returns undefined for a missing session", async () => {
		const fetchMock = vi.fn(() =>
			Promise.resolve(
				Response.json({ error: "Session not found" }, { status: 404 }),
			),
		);
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = await renderHook(() => useSession("missing-session"), {
			wrapper,
		});

		await vi.waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toBeUndefined();
		expect(getFetchRequest(fetchMock).pathname).toBe(
			"/api/sessions/missing-session",
		);
	});

	it("fetches a single session by id", async () => {
		const fetchMock = mockJsonSuccess(session);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();

		const { result } = await renderHook(() => useSession("session-1"), {
			wrapper,
		});

		await vi.waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toEqual(session);
		expect(getFetchRequest(fetchMock).pathname).toBe("/api/sessions/session-1");
		expect(
			queryClient.getQueryData(queryKeys.sessions.detail("session-1")),
		).toEqual(session);
	});

	it("fetches the sessions list successfully", async () => {
		const sessions = [session];
		const fetchMock = mockJsonSuccess(sessions);
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = await renderHook(() => useSessions(), { wrapper });

		await vi.waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toEqual(sessions);
		expect(getFetchRequest(fetchMock).pathname).toBe("/api/sessions");
	});

	it("exposes the current session refetch interval", async () => {
		const fetchMock = mockJsonSuccess(session);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();

		const { result } = await renderHook(() => useCurrentSession(), { wrapper });

		await vi.waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toEqual(session);
		expect(queryClient.getQueryData(queryKeys.sessions.current())).toEqual(
			session,
		);
		expect(
			queryClient.getQueryCache().find({
				queryKey: queryKeys.sessions.current(),
			})?.options.refetchInterval,
		).toBe(30_000);
	});

	it("treats a null current session as undefined data", async () => {
		const fetchMock = vi.fn(() => Promise.resolve(Response.json(null)));
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = await renderHook(() => useCurrentSession(), { wrapper });

		await vi.waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toBeUndefined();
		expect(getFetchRequest(fetchMock).pathname).toBe("/api/sessions/current");
	});

	it("surfaces errors from the current session request", async () => {
		const fetchMock = mockJsonError("Current session failed", { status: 500 });
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = await renderHook(() => useCurrentSession(), { wrapper });

		await vi.waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect((result.current.error as Error).message).toBe(
			"Current session failed",
		);
		expect(getFetchRequest(fetchMock).pathname).toBe("/api/sessions/current");
	});
});
