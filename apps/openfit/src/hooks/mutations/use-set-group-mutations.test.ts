import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { queryKeys } from "@/lib/query-keys";
import {
	useBulkEditSetGroup,
	useCreateSetGroup,
	useDeleteSetGroup,
	useReorderSetGroups,
	useReplaceExercise,
	useUpdateSetGroup,
} from "./use-set-group-mutations";

function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
			mutations: {
				retry: false,
			},
		},
	});
}

function createWrapper(queryClient: QueryClient) {
	return function Wrapper({ children }: { children: ReactNode }) {
		return createElement(
			QueryClientProvider,
			{ client: queryClient },
			children,
		);
	};
}

describe("use-set-group-mutations", () => {
	let fetchSpy: ReturnType<typeof vi.spyOn<typeof globalThis, "fetch">>;

	beforeEach(() => {
		fetchSpy = vi.spyOn(globalThis, "fetch");
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("creates a set group, returns the created group, and invalidates session and routine-day caches", async () => {
		const queryClient = createQueryClient();
		queryClient.setQueryData(queryKeys.sessions.all, []);
		queryClient.setQueryData(queryKeys.routineDays.all, []);
		const { result } = renderHook(() => useCreateSetGroup(), {
			wrapper: createWrapper(queryClient),
		});
		const payload = {
			sessionId: "session-1",
			exerciseId: "exercise-1",
			type: "SUPERSET" as const,
			numSets: 2,
		};
		const response = {
			id: "set-group-1",
			sessionId: "session-1",
			routineDayId: null,
			type: "SUPERSET",
			order: 0,
			sets: [],
		};
		fetchSpy.mockResolvedValueOnce(Response.json(response));

		await expect(result.current.mutateAsync(payload)).resolves.toEqual(
			response,
		);

		expect(fetchSpy).toHaveBeenCalledWith(
			"/api/set-groups",
			expect.objectContaining({
				method: "POST",
				headers: { "Content-Type": "application/json" },
			}),
		);
		expect(
			JSON.parse((fetchSpy.mock.calls[0][1]?.body as string) ?? "{}"),
		).toEqual(payload);
		await waitFor(() => {
			expect(
				queryClient.getQueryState(queryKeys.sessions.all)?.isInvalidated,
			).toBe(true);
			expect(
				queryClient.getQueryState(queryKeys.routineDays.all)?.isInvalidated,
			).toBe(true);
		});
	});

	it("updates a set group, returns the updated group, and invalidates session and routine-day caches", async () => {
		const queryClient = createQueryClient();
		queryClient.setQueryData(queryKeys.sessions.all, [{ id: "set-group-1" }]);
		queryClient.setQueryData(queryKeys.routineDays.all, [
			{ id: "set-group-1" },
		]);
		const { result } = renderHook(() => useUpdateSetGroup(), {
			wrapper: createWrapper(queryClient),
		});
		const payload = {
			id: "set-group-1",
			type: "NORMAL" as const,
			comment: "Drop set",
		};
		const response = {
			id: "set-group-1",
			type: "NORMAL",
			comment: "Drop set",
		};
		fetchSpy.mockResolvedValueOnce(Response.json(response));

		await expect(result.current.mutateAsync(payload)).resolves.toEqual(
			response,
		);

		expect(fetchSpy).toHaveBeenCalledWith(
			"/api/set-groups/set-group-1",
			expect.objectContaining({
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
			}),
		);
		expect(
			JSON.parse((fetchSpy.mock.calls[0][1]?.body as string) ?? "{}"),
		).toEqual({
			type: "NORMAL",
			comment: "Drop set",
		});
		await waitFor(() => {
			expect(
				queryClient.getQueryState(queryKeys.sessions.all)?.isInvalidated,
			).toBe(true);
			expect(
				queryClient.getQueryState(queryKeys.routineDays.all)?.isInvalidated,
			).toBe(true);
		});
	});

	it("deletes a set group and invalidates session and routine-day caches", async () => {
		const queryClient = createQueryClient();
		queryClient.setQueryData(queryKeys.sessions.all, [{ id: "set-group-1" }]);
		queryClient.setQueryData(queryKeys.routineDays.all, [
			{ id: "set-group-1" },
		]);
		const { result } = renderHook(() => useDeleteSetGroup(), {
			wrapper: createWrapper(queryClient),
		});
		fetchSpy.mockResolvedValueOnce(Response.json({ success: true }));

		await expect(result.current.mutateAsync("set-group-1")).resolves.toEqual({
			success: true,
		});

		expect(fetchSpy).toHaveBeenCalledWith("/api/set-groups/set-group-1", {
			method: "DELETE",
		});
		await waitFor(() => {
			expect(
				queryClient.getQueryState(queryKeys.sessions.all)?.isInvalidated,
			).toBe(true);
			expect(
				queryClient.getQueryState(queryKeys.routineDays.all)?.isInvalidated,
			).toBe(true);
		});
	});

	it("reorders set groups and invalidates session and routine-day caches", async () => {
		const queryClient = createQueryClient();
		queryClient.setQueryData(queryKeys.sessions.all, []);
		queryClient.setQueryData(queryKeys.routineDays.all, []);
		const { result } = renderHook(() => useReorderSetGroups(), {
			wrapper: createWrapper(queryClient),
		});
		fetchSpy.mockResolvedValueOnce(Response.json({ success: true }));

		await expect(
			result.current.mutateAsync({ setGroupIds: ["a", "b", "c"] }),
		).resolves.toEqual({ success: true });

		expect(fetchSpy).toHaveBeenCalledWith(
			"/api/set-groups/reorder",
			expect.objectContaining({
				method: "POST",
				headers: { "Content-Type": "application/json" },
			}),
		);
		expect(
			JSON.parse((fetchSpy.mock.calls[0][1]?.body as string) ?? "{}"),
		).toEqual({ setGroupIds: ["a", "b", "c"] });
		await waitFor(() => {
			expect(
				queryClient.getQueryState(queryKeys.sessions.all)?.isInvalidated,
			).toBe(true);
			expect(
				queryClient.getQueryState(queryKeys.routineDays.all)?.isInvalidated,
			).toBe(true);
		});
	});

	it("replaces the exercise in a set group and invalidates session and routine-day caches", async () => {
		const queryClient = createQueryClient();
		queryClient.setQueryData(queryKeys.sessions.all, []);
		queryClient.setQueryData(queryKeys.routineDays.all, []);
		const { result } = renderHook(() => useReplaceExercise(), {
			wrapper: createWrapper(queryClient),
		});
		fetchSpy.mockResolvedValueOnce(Response.json({ success: true }));

		await expect(
			result.current.mutateAsync({
				id: "set-group-1",
				exerciseId: "exercise-2",
			}),
		).resolves.toEqual({ success: true });

		expect(fetchSpy).toHaveBeenCalledWith(
			"/api/set-groups/set-group-1/replace-exercise",
			expect.objectContaining({
				method: "POST",
				headers: { "Content-Type": "application/json" },
			}),
		);
		expect(
			JSON.parse((fetchSpy.mock.calls[0][1]?.body as string) ?? "{}"),
		).toEqual({ exerciseId: "exercise-2" });
		await waitFor(() => {
			expect(
				queryClient.getQueryState(queryKeys.sessions.all)?.isInvalidated,
			).toBe(true);
			expect(
				queryClient.getQueryState(queryKeys.routineDays.all)?.isInvalidated,
			).toBe(true);
		});
	});

	it("bulk-edits a set group, returns success, and invalidates session and routine-day caches", async () => {
		const queryClient = createQueryClient();
		queryClient.setQueryData(queryKeys.sessions.all, []);
		queryClient.setQueryData(queryKeys.routineDays.all, []);
		const { result } = renderHook(() => useBulkEditSetGroup(), {
			wrapper: createWrapper(queryClient),
		});
		const payload = {
			id: "set-group-1",
			reps: 12,
			weight: 135,
			repetitionUnitId: "rep-1",
			weightUnitId: "weight-1",
			restTime: 90,
		};
		fetchSpy.mockResolvedValueOnce(Response.json({ success: true }));

		await expect(result.current.mutateAsync(payload)).resolves.toEqual({
			success: true,
		});

		expect(fetchSpy).toHaveBeenCalledWith(
			"/api/set-groups/set-group-1/bulk-edit",
			expect.objectContaining({
				method: "POST",
				headers: { "Content-Type": "application/json" },
			}),
		);
		expect(
			JSON.parse((fetchSpy.mock.calls[0][1]?.body as string) ?? "{}"),
		).toEqual({
			reps: 12,
			weight: 135,
			repetitionUnitId: "rep-1",
			weightUnitId: "weight-1",
			restTime: 90,
		});
		await waitFor(() => {
			expect(
				queryClient.getQueryState(queryKeys.sessions.all)?.isInvalidated,
			).toBe(true);
			expect(
				queryClient.getQueryState(queryKeys.routineDays.all)?.isInvalidated,
			).toBe(true);
		});
	});

	it("propagates set-group errors from the server response", async () => {
		const { result } = renderHook(() => useReorderSetGroups(), {
			wrapper: createWrapper(createQueryClient()),
		});
		fetchSpy.mockResolvedValueOnce(
			Response.json({ error: "Unable to reorder" }, { status: 500 }),
		);

		await expect(
			result.current.mutateAsync({ setGroupIds: ["set-group-1"] }),
		).rejects.toThrow("Unable to reorder");
	});
});
