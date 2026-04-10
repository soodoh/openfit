import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import type { MutationSuccessResult, SessionResult } from "@/lib/api-types";
import { queryKeys } from "@/lib/query-keys";
import { mockJsonSuccess } from "@/test/fetch";
import { createTestQueryWrapper } from "@/test/query-client";
import {
	useCreateSession,
	useDeleteSession,
	useUpdateSession,
} from "./use-session-mutations";

function getRequest(fetchMock: { mock: { calls: Array<unknown[]> } }) {
	const [input, init] = fetchMock.mock.calls[0] ?? [];

	expect(typeof input).toBe("string");

	return {
		url: new URL(input, "http://localhost"),
		init: init as RequestInit | undefined,
	};
}

const sessionResponse = {
	id: "session-1",
	userId: "user-1",
	name: "Upper Body",
	notes: "Heavy bench work",
	impression: 4,
	startTime: "2026-02-01T10:00:00.000Z",
	endTime: null,
	templateId: null,
	createdAt: "2026-02-01T10:00:00.000Z",
	updatedAt: "2026-02-01T10:00:00.000Z",
	setGroups: [],
} satisfies SessionResult;
const originalFetch = globalThis.fetch;

describe("use-session-mutations", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
		expect(globalThis.fetch).toBe(originalFetch);
	});

	it("creates a session with the expected payload and invalidates sessions.all", async () => {
		const fetchMock = mockJsonSuccess(sessionResponse);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();
		const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
		const input = {
			name: "Upper Body",
			notes: "Heavy bench work",
			startTime: 1706781600000,
			impression: 4,
			templateId: "template-1",
		};

		const { result } = await renderHook(() => useCreateSession(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync(input);
		});

		await vi.waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		const request = getRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/sessions");
		expect(request.init).toEqual(
			expect.objectContaining({
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(input),
			}),
		);
		expect(invalidateQueriesSpy.mock.calls.map(([filters]) => filters)).toEqual(
			[{ queryKey: queryKeys.sessions.all }],
		);
	});

	it("updates a session and invalidates detail, current, and list keys", async () => {
		const fetchMock = mockJsonSuccess(sessionResponse);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();
		const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
		const input = {
			id: "session-1",
			name: "Updated Session",
			notes: "More volume",
			impression: 5,
			endTime: 1706785200000,
		};

		const { result } = await renderHook(() => useUpdateSession(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync(input);
		});

		await vi.waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		const request = getRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/sessions/session-1");
		expect(request.init).toEqual(
			expect.objectContaining({
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: "Updated Session",
					notes: "More volume",
					impression: 5,
					endTime: 1706785200000,
				}),
			}),
		);
		expect(invalidateQueriesSpy.mock.calls.map(([filters]) => filters)).toEqual(
			[
				{ queryKey: queryKeys.sessions.detail("session-1") },
				{ queryKey: queryKeys.sessions.current() },
				{ queryKey: queryKeys.sessions.lists() },
			],
		);
	});

	it("deletes a session and invalidates sessions.all", async () => {
		const response = { success: true } satisfies MutationSuccessResult;
		const fetchMock = mockJsonSuccess(response);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();
		const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

		const { result } = await renderHook(() => useDeleteSession(), { wrapper });

		await act(async () => {
			await result.current.mutateAsync("session-1");
		});

		await vi.waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		const request = getRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/sessions/session-1");
		expect(request.init).toEqual(
			expect.objectContaining({
				method: "DELETE",
			}),
		);
		expect(invalidateQueriesSpy.mock.calls.map(([filters]) => filters)).toEqual(
			[{ queryKey: queryKeys.sessions.all }],
		);
	});
});
