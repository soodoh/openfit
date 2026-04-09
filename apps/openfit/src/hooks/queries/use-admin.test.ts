import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { queryKeys } from "@/lib/query-keys";
import type {
	AdminExerciseWithRelations,
	LookupItem,
	PaginatedResponse,
} from "@/lib/types";
import { mockJsonError, mockJsonSuccess } from "@/test/fetch";
import { createTestQueryWrapper } from "@/test/query-client";
import {
	useAdminCategories,
	useAdminEquipment,
	useAdminExercisesPaginated,
	useAdminLookupPaginated,
	useAdminMuscleGroups,
	useAdminRepetitionUnits,
	useAdminWeightUnits,
} from "./use-admin";

type FetchMock = {
	mock: {
		calls: unknown[][];
	};
};

function getFetchRequest(fetchMock: FetchMock) {
	const [input, init] = fetchMock.mock.calls[0] ?? [];

	expect(typeof input).toBe("string");

	return {
		url: new URL(input, "http://localhost"),
		init,
	};
}

function createDeferred<T>() {
	let resolve!: (value: T | PromiseLike<T>) => void;
	const promise = new Promise<T>((res) => {
		resolve = res;
	});

	return { promise, resolve };
}

const originalFetch = globalThis.fetch;

describe("use-admin queries", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
		expect(globalThis.fetch).toBe(originalFetch);
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
		const request = getFetchRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/admin/exercises");
		expect(request.url.searchParams.get("page")).toBe("2");
		expect(request.url.searchParams.get("pageSize")).toBe("25");
		expect(request.url.searchParams.get("search")).toBe("bench");
		expect(request.init).toEqual(
			expect.objectContaining({ signal: expect.any(AbortSignal) }),
		);
		expect(
			queryClient.getQueryData(queryKeys.admin.exerciseList(params)),
		).toEqual(response);
	});

	it("keeps paginated exercise data cached under the current page key", async () => {
		const params = { page: 1, pageSize: 25 };
		const response = {
			items: [{ id: "exercise-1", name: "Bench Press" }],
			total: 1,
			page: 1,
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

		expect(
			queryClient.getQueryData(queryKeys.admin.exerciseList(params)),
		).toEqual(response);
	});

	it("keeps previous paginated admin exercise data visible while a new page loads", async () => {
		const firstParams = { page: 1, pageSize: 25, search: "bench" };
		const secondParams = { page: 2, pageSize: 25, search: "bench" };
		const firstPage = {
			items: [{ id: "exercise-1", name: "Bench Press" }],
			total: 2,
			page: 1,
			pageSize: 25,
		} satisfies PaginatedResponse<AdminExerciseWithRelations>;
		const secondPage = createDeferred<Response>();
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(Response.json(firstPage))
			.mockReturnValueOnce(secondPage.promise);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();

		const { result, rerender } = renderHook(
			({ params }) => useAdminExercisesPaginated(params),
			{
				initialProps: { params: firstParams },
				wrapper,
			},
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		rerender({ params: secondParams });

		await waitFor(() => {
			expect(result.current.isPlaceholderData).toBe(true);
		});

		expect(result.current.data).toEqual(firstPage);
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(
			queryClient.getQueryData(queryKeys.admin.exerciseList(secondParams)),
		).toBeUndefined();

		secondPage.resolve(
			Response.json({
				items: [{ id: "exercise-2", name: "Incline Press" }],
				total: 2,
				page: 2,
				pageSize: 25,
			} satisfies PaginatedResponse<AdminExerciseWithRelations>),
		);

		await waitFor(() => {
			expect(result.current.isPlaceholderData).toBe(false);
			expect(result.current.data?.page).toBe(2);
		});
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
		const request = getFetchRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/admin/lookups");
		expect(request.url.searchParams.get("type")).toBe("equipment");
		expect(request.url.searchParams.get("page")).toBe("3");
		expect(request.url.searchParams.get("pageSize")).toBe("10");
		expect(request.url.searchParams.get("search")).toBe("bar");
		expect(request.init).toEqual(
			expect.objectContaining({ signal: expect.any(AbortSignal) }),
		);
	});

	it("uses the fallback query key path for an unknown lookup type", async () => {
		const params = { page: 4, pageSize: 15, search: "alpha" };
		const response = {
			items: [{ id: "custom-1", name: "Alpha" }],
			total: 1,
			page: 4,
			pageSize: 15,
		} satisfies PaginatedResponse<LookupItem>;
		const fetchMock = mockJsonSuccess(response);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();

		const { result } = renderHook(
			() => useAdminLookupPaginated("customType", params),
			{ wrapper },
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toEqual(response);
		expect(getFetchRequest(fetchMock).url.searchParams.get("type")).toBe(
			"customType",
		);
		expect(
			queryClient.getQueryData([
				...queryKeys.admin.all,
				"customType",
				"list",
				params,
			]),
		).toEqual(response);
	});

	it.each([
		[
			"equipment",
			useAdminEquipment,
			queryKeys.admin.equipment(),
			[{ id: "equipment-1", name: "Barbell" }],
		],
		[
			"categories",
			useAdminCategories,
			queryKeys.admin.categories(),
			[{ id: "category-1", name: "Chest" }],
		],
		[
			"muscleGroups",
			useAdminMuscleGroups,
			queryKeys.admin.muscleGroups(),
			[{ id: "muscle-1", name: "Chest" }],
		],
		[
			"repetitionUnits",
			useAdminRepetitionUnits,
			queryKeys.admin.repetitionUnits(),
			[{ id: "reps", name: "reps" }],
		],
		[
			"weightUnits",
			useAdminWeightUnits,
			queryKeys.admin.weightUnits(),
			[{ id: "kg", name: "kg" }],
		],
	] as const)("requests the non-paginated admin %s lookup list", async (_type, hook, queryKey, items) => {
		const response = {
			items,
			total: items.length,
			page: 1,
			pageSize: 1000,
		} satisfies PaginatedResponse<LookupItem>;
		const fetchMock = mockJsonSuccess(response);
		vi.stubGlobal("fetch", fetchMock);
		const { queryClient, wrapper } = createTestQueryWrapper();

		const { result } = renderHook(() => hook(), { wrapper });

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toEqual(items);
		const request = getFetchRequest(fetchMock);
		expect(request.url.pathname).toBe("/api/admin/lookups");
		expect(request.url.searchParams.get("type")).toBe(_type);
		expect(request.url.searchParams.get("pageSize")).toBe("1000");
		expect(queryClient.getQueryData(queryKey)).toEqual(items);
	});

	it("surfaces lookup fetch errors", async () => {
		const fetchMock = mockJsonError("Lookup request failed", { status: 500 });
		vi.stubGlobal("fetch", fetchMock);
		const { wrapper } = createTestQueryWrapper();

		const { result } = renderHook(() => useAdminEquipment(), { wrapper });

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect((result.current.error as Error).message).toBe(
			"Lookup request failed",
		);
	});
});
