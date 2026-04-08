import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { queryKeys } from "@/lib/query-keys";
import type {
	AdminExerciseWithRelations,
	LookupItem,
	PaginatedResponse,
} from "@/lib/types";
import { mockJsonSuccess } from "@/test/fetch";
import { createTestQueryWrapper } from "@/test/query-client";
import {
	useAdminEquipment,
	useAdminExercisesPaginated,
	useAdminLookupPaginated,
} from "./use-admin";

describe("use-admin queries", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("requests a paginated admin exercise list with search params", async () => {
		const params = { page: 2, pageSize: 25, search: "bench" };
		const response = {
			items: [
				{
					id: "exercise-1",
					name: "Bench Press",
					level: "beginner",
					force: "push",
					mechanic: "compound",
					equipmentId: "equipment-1",
					categoryId: "category-1",
					primaryMuscleIds: ["muscle-1"],
					secondaryMuscleIds: [],
					instructions: ["Press"],
					imageUrls: ["/bench.jpg"],
					equipment: { id: "equipment-1", name: "Barbell" },
					category: { id: "category-1", name: "Chest" },
					primaryMuscles: [{ id: "muscle-1", name: "Chest" }],
					secondaryMuscles: [],
				},
			],
			total: 1,
			page: 2,
			pageSize: 25,
		} satisfies PaginatedResponse<AdminExerciseWithRelations>;
		const fetchMock = mockJsonSuccess(response);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();

		const { result } = renderHook(() => useAdminExercisesPaginated(params), {
			wrapper,
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toEqual(response);
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/admin/exercises?page=2&pageSize=25&search=bench",
			expect.objectContaining({ signal: expect.any(AbortSignal) }),
		);
		expect(
			queryClient.getQueryData(queryKeys.admin.exerciseList(params)),
		).toEqual(response);
	});

	it("requests paginated admin lookup data for the provided type", async () => {
		const params = { page: 3, pageSize: 10, search: "bar" };
		const response = {
			items: [{ id: "equipment-1", name: "Barbell" }],
			total: 1,
			page: 3,
			pageSize: 10,
		} satisfies PaginatedResponse<LookupItem>;
		const fetchMock = mockJsonSuccess(response);
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = renderHook(
			() => useAdminLookupPaginated("equipment", params),
			{ wrapper },
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toEqual(response);
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/admin/lookups?type=equipment&page=3&pageSize=10&search=bar",
			expect.objectContaining({ signal: expect.any(AbortSignal) }),
		);
	});

	it("requests the non-paginated admin equipment lookup list", async () => {
		const response = [
			{ id: "equipment-1", name: "Barbell" },
		] satisfies LookupItem[];
		const fetchMock = mockJsonSuccess({
			items: response,
			total: 1,
			page: 1,
			pageSize: 1000,
		});
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = renderHook(() => useAdminEquipment(), { wrapper });

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toEqual(response);
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/admin/lookups?type=equipment&pageSize=1000",
		);
	});
});
