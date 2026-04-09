import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { queryKeys } from "@/lib/query-keys";
import {
	useAdminCreateExercise,
	useAdminDeleteExercise,
	useAdminUpdateExercise,
	useCreateLookup,
	useDeleteLookup,
	useUpdateLookup,
	useUpdateUserRole,
	useUploadFile,
} from "./use-admin-mutations";

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

describe("use-admin-mutations", () => {
	let fetchSpy: ReturnType<typeof vi.spyOn<typeof globalThis, "fetch">>;

	beforeEach(() => {
		fetchSpy = vi.spyOn(globalThis, "fetch");
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("updates a user role, returns the updated profile, and invalidates admin users", async () => {
		const queryClient = createQueryClient();
		queryClient.setQueryData(queryKeys.admin.users(), [
			{ id: "user-1", role: "USER" },
		]);
		const { result } = renderHook(() => useUpdateUserRole(), {
			wrapper: createWrapper(queryClient),
		});
		const response = {
			id: "user-1",
			role: "ADMIN",
			name: "OpenFit Admin",
		};
		fetchSpy.mockResolvedValueOnce(Response.json(response));

		await expect(
			result.current.mutateAsync({ id: "user-1", role: "ADMIN" }),
		).resolves.toEqual(response);

		expect(fetchSpy).toHaveBeenCalledWith(
			"/api/admin/users/user-1",
			expect.objectContaining({
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
			}),
		);
		const requestBody = JSON.parse(
			(fetchSpy.mock.calls[0][1]?.body as string) ?? "{}",
		) as { role: string };
		expect(requestBody).toEqual({ role: "ADMIN" });
		await waitFor(() => {
			expect(
				queryClient.getQueryState(queryKeys.admin.users())?.isInvalidated,
			).toBe(true);
		});
	});

	it("creates an exercise, returns the id payload, and invalidates admin and public exercise caches", async () => {
		const queryClient = createQueryClient();
		queryClient.setQueryData(queryKeys.admin.exercises(), []);
		queryClient.setQueryData(queryKeys.exercises.all, []);
		const { result } = renderHook(() => useAdminCreateExercise(), {
			wrapper: createWrapper(queryClient),
		});
		const payload = {
			name: "Barbell Row",
			level: "intermediate" as const,
			force: "pull" as const,
			mechanic: "compound" as const,
			equipmentId: "equip-1",
			categoryId: "cat-1",
			primaryMuscleIds: ["muscle-1"],
			secondaryMuscleIds: ["muscle-2"],
			instructions: ["Set the bar down", "Row to the torso"],
			imageUrls: ["/api/uploads/row.png"],
		};
		const response = { id: "exercise-1" };
		fetchSpy.mockResolvedValueOnce(Response.json(response));

		await expect(result.current.mutateAsync(payload)).resolves.toEqual(
			response,
		);

		expect(fetchSpy).toHaveBeenCalledWith(
			"/api/admin/exercises",
			expect.objectContaining({
				method: "POST",
				headers: { "Content-Type": "application/json" },
			}),
		);
		const requestBody = JSON.parse(
			(fetchSpy.mock.calls[0][1]?.body as string) ?? "{}",
		) as typeof payload;
		expect(requestBody).toEqual(payload);
		await waitFor(() => {
			expect(
				queryClient.getQueryState(queryKeys.admin.exercises())?.isInvalidated,
			).toBe(true);
			expect(
				queryClient.getQueryState(queryKeys.exercises.all)?.isInvalidated,
			).toBe(true);
		});
	});

	it("updates an exercise, returns success, and invalidates admin and public exercise caches", async () => {
		const queryClient = createQueryClient();
		queryClient.setQueryData(queryKeys.admin.exercises(), [
			{ id: "exercise-1" },
		]);
		queryClient.setQueryData(queryKeys.exercises.all, [{ id: "exercise-1" }]);
		const { result } = renderHook(() => useAdminUpdateExercise(), {
			wrapper: createWrapper(queryClient),
		});
		const payload = {
			id: "exercise-1",
			name: "Updated Row",
			level: "expert" as const,
			force: "pull" as const,
			mechanic: "compound" as const,
			equipmentId: "equip-2",
			categoryId: "cat-2",
			primaryMuscleIds: ["muscle-3"],
			secondaryMuscleIds: [],
			instructions: ["Pull harder"],
			imageUrls: ["/api/uploads/updated-row.png"],
		};
		const response = { success: true };
		fetchSpy.mockResolvedValueOnce(Response.json(response));

		await expect(result.current.mutateAsync(payload)).resolves.toEqual(
			response,
		);

		expect(fetchSpy).toHaveBeenCalledWith(
			"/api/admin/exercises/exercise-1",
			expect.objectContaining({
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
			}),
		);
		const requestBody = JSON.parse(
			(fetchSpy.mock.calls[0][1]?.body as string) ?? "{}",
		) as Omit<typeof payload, "id">;
		expect(requestBody).toEqual({
			name: "Updated Row",
			level: "expert",
			force: "pull",
			mechanic: "compound",
			equipmentId: "equip-2",
			categoryId: "cat-2",
			primaryMuscleIds: ["muscle-3"],
			secondaryMuscleIds: [],
			instructions: ["Pull harder"],
			imageUrls: ["/api/uploads/updated-row.png"],
		});
		await waitFor(() => {
			expect(
				queryClient.getQueryState(queryKeys.admin.exercises())?.isInvalidated,
			).toBe(true);
			expect(
				queryClient.getQueryState(queryKeys.exercises.all)?.isInvalidated,
			).toBe(true);
		});
	});

	it("deletes an exercise and invalidates admin and public exercise caches", async () => {
		const queryClient = createQueryClient();
		queryClient.setQueryData(queryKeys.admin.exercises(), [
			{ id: "exercise-1" },
		]);
		queryClient.setQueryData(queryKeys.exercises.all, [{ id: "exercise-1" }]);
		const { result } = renderHook(() => useAdminDeleteExercise(), {
			wrapper: createWrapper(queryClient),
		});
		const response = { success: true };
		fetchSpy.mockResolvedValueOnce(Response.json(response));

		await expect(result.current.mutateAsync("exercise-1")).resolves.toEqual(
			response,
		);

		expect(fetchSpy).toHaveBeenCalledWith("/api/admin/exercises/exercise-1", {
			method: "DELETE",
		});
		await waitFor(() => {
			expect(
				queryClient.getQueryState(queryKeys.admin.exercises())?.isInvalidated,
			).toBe(true);
			expect(
				queryClient.getQueryState(queryKeys.exercises.all)?.isInvalidated,
			).toBe(true);
		});
	});

	it("creates, updates, and deletes lookups while invalidating admin and lookup caches", async () => {
		const queryClient = createQueryClient();
		queryClient.setQueryData(queryKeys.admin.all, []);
		queryClient.setQueryData(queryKeys.lookups.all, []);

		const createLookup = renderHook(() => useCreateLookup(), {
			wrapper: createWrapper(queryClient),
		});
		const createdLookup = { id: "lookup-1" };
		fetchSpy.mockResolvedValueOnce(Response.json(createdLookup));
		await expect(
			createLookup.result.current.mutateAsync({
				type: "equipment",
				name: "Trap Bar",
			}),
		).resolves.toEqual(createdLookup);
		expect(fetchSpy).toHaveBeenCalledWith(
			"/api/admin/lookups",
			expect.objectContaining({
				method: "POST",
				headers: { "Content-Type": "application/json" },
			}),
		);
		expect(
			JSON.parse((fetchSpy.mock.calls[0][1]?.body as string) ?? "{}"),
		).toEqual({
			type: "equipment",
			name: "Trap Bar",
		});

		const updateLookup = renderHook(() => useUpdateLookup(), {
			wrapper: createWrapper(queryClient),
		});
		fetchSpy.mockResolvedValueOnce(Response.json({ success: true }));
		await expect(
			updateLookup.result.current.mutateAsync({
				id: "lookup-1",
				type: "equipment",
				name: "Hex Bar",
			}),
		).resolves.toEqual({ success: true });
		expect(fetchSpy).toHaveBeenCalledWith(
			"/api/admin/lookups/lookup-1",
			expect.objectContaining({
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
			}),
		);
		expect(
			JSON.parse((fetchSpy.mock.calls[1][1]?.body as string) ?? "{}"),
		).toEqual({
			type: "equipment",
			name: "Hex Bar",
		});

		const deleteLookup = renderHook(() => useDeleteLookup(), {
			wrapper: createWrapper(queryClient),
		});
		fetchSpy.mockResolvedValueOnce(Response.json({ success: true }));
		await expect(
			deleteLookup.result.current.mutateAsync({
				id: "lookup-1",
				type: "equipment",
			}),
		).resolves.toEqual({ success: true });
		expect(fetchSpy).toHaveBeenCalledWith(
			"/api/admin/lookups/lookup-1?type=equipment",
			{
				method: "DELETE",
			},
		);

		await waitFor(() => {
			expect(
				queryClient.getQueryState(queryKeys.admin.all)?.isInvalidated,
			).toBe(true);
			expect(
				queryClient.getQueryState(queryKeys.lookups.all)?.isInvalidated,
			).toBe(true);
		});
	});

	it("uploads a file and returns the uploaded path", async () => {
		const queryClient = createQueryClient();
		const { result } = renderHook(() => useUploadFile(), {
			wrapper: createWrapper(queryClient),
		});
		const file = new File(["image-bytes"], "photo.png", {
			type: "image/png",
		});
		const response = { path: "/api/uploads/photo.png", filename: "photo.png" };
		fetchSpy.mockResolvedValueOnce(Response.json(response));

		await expect(result.current.mutateAsync(file)).resolves.toBe(
			"/api/uploads/photo.png",
		);

		expect(fetchSpy).toHaveBeenCalledWith(
			"/api/upload",
			expect.objectContaining({
				method: "POST",
			}),
		);
		const body = fetchSpy.mock.calls[0][1]?.body;
		expect(body).toBeInstanceOf(FormData);
		expect((body as FormData).get("file")).toBe(file);
	});

	it("propagates upload errors from the server response", async () => {
		const queryClient = createQueryClient();
		const { result } = renderHook(() => useUploadFile(), {
			wrapper: createWrapper(queryClient),
		});
		const file = new File(["broken"], "broken.png", { type: "image/png" });
		fetchSpy.mockResolvedValueOnce(
			Response.json({ error: "Upload quota exceeded" }, { status: 413 }),
		);

		await expect(result.current.mutateAsync(file)).rejects.toThrow(
			"Upload quota exceeded",
		);
	});
});
