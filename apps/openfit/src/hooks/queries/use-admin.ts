import type { UseQueryResult } from "@tanstack/react-query";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchJson } from "@/lib/request-helpers";
import type {
	AdminExerciseWithRelations,
	AdminPaginationParams,
	AdminUserWithProfile,
	LookupItem,
	PaginatedResponse,
} from "@/lib/types";

// --- Paginated fetch helpers ---
async function fetchPaginatedAdmin<T>(
	url: string,
	params: AdminPaginationParams,
	signal?: AbortSignal,
): Promise<PaginatedResponse<T>> {
	const searchParams = new URLSearchParams({
		page: String(params.page),
		pageSize: String(params.pageSize),
	});
	if (params.search) {
		searchParams.set("search", params.search);
	}
	const response = await fetch(`${url}?${searchParams}`, { signal });
	return fetchJson<PaginatedResponse<T>>(response, "Failed to fetch data");
}
async function fetchPaginatedLookup(
	type: string,
	params: AdminPaginationParams,
	signal?: AbortSignal,
): Promise<PaginatedResponse<LookupItem>> {
	const searchParams = new URLSearchParams({
		type,
		page: String(params.page),
		pageSize: String(params.pageSize),
	});
	if (params.search) {
		searchParams.set("search", params.search);
	}
	const response = await fetch(`/api/admin/lookups?${searchParams}`, {
		signal,
	});
	return fetchJson<PaginatedResponse<LookupItem>>(
		response,
		"Failed to fetch lookups",
	);
}
// --- Non-paginated fetch helpers (for dropdowns / form selects) ---
async function fetchAdminLookups(type: string): Promise<LookupItem[]> {
	const response = await fetch(`/api/admin/lookups?type=${type}&pageSize=1000`);
	const result = await fetchJson<PaginatedResponse<LookupItem>>(
		response,
		"Failed to fetch lookups",
	);
	return result.items;
}
// --- Paginated hooks (for admin tables) ---
export function useAdminUsersPaginated(
	params: AdminPaginationParams,
): UseQueryResult<PaginatedResponse<AdminUserWithProfile>> {
	return useQuery({
		queryKey: queryKeys.admin.userList(params),
		queryFn: async ({ signal }) =>
			fetchPaginatedAdmin<AdminUserWithProfile>(
				"/api/admin/users",
				params,
				signal,
			),
		placeholderData: keepPreviousData,
	});
}
export function useAdminExercisesPaginated(
	params: AdminPaginationParams,
): UseQueryResult<PaginatedResponse<AdminExerciseWithRelations>> {
	return useQuery({
		queryKey: queryKeys.admin.exerciseList(params),
		queryFn: async ({ signal }) =>
			fetchPaginatedAdmin<AdminExerciseWithRelations>(
				"/api/admin/exercises",
				params,
				signal,
			),
		placeholderData: keepPreviousData,
	});
}
export function useAdminLookupPaginated(
	type: string,
	params: AdminPaginationParams,
): UseQueryResult<PaginatedResponse<LookupItem>> {
	const keyFn = {
		equipment: queryKeys.admin.equipmentList,
		categories: queryKeys.admin.categoryList,
		muscleGroups: queryKeys.admin.muscleGroupList,
		weightUnits: queryKeys.admin.weightUnitList,
		repetitionUnits: queryKeys.admin.repetitionUnitList,
	}[type];
	return useQuery({
		queryKey: keyFn
			? keyFn(params)
			: [...queryKeys.admin.all, type, "list", params],
		queryFn: async ({ signal }) => fetchPaginatedLookup(type, params, signal),
		placeholderData: keepPreviousData,
	});
}
// --- Non-paginated hooks (for dropdowns in ExerciseFormModal, etc.) ---
export function useAdminEquipment(): UseQueryResult<LookupItem[]> {
	return useQuery({
		queryKey: queryKeys.admin.equipment(),
		queryFn: async () => fetchAdminLookups("equipment"),
	});
}
export function useAdminCategories(): UseQueryResult<LookupItem[]> {
	return useQuery({
		queryKey: queryKeys.admin.categories(),
		queryFn: async () => fetchAdminLookups("categories"),
	});
}
export function useAdminMuscleGroups(): UseQueryResult<LookupItem[]> {
	return useQuery({
		queryKey: queryKeys.admin.muscleGroups(),
		queryFn: async () => fetchAdminLookups("muscleGroups"),
	});
}
export function useAdminRepetitionUnits(): UseQueryResult<LookupItem[]> {
	return useQuery({
		queryKey: queryKeys.admin.repetitionUnits(),
		queryFn: async () => fetchAdminLookups("repetitionUnits"),
	});
}
export function useAdminWeightUnits(): UseQueryResult<LookupItem[]> {
	return useQuery({
		queryKey: queryKeys.admin.weightUnits(),
		queryFn: async () => fetchAdminLookups("weightUnits"),
	});
}
export type {
	AdminExerciseWithRelations as ExerciseWithRelations,
	AdminPaginationParams,
	AdminUserWithProfile as UserWithProfile,
	LookupItem,
	PaginatedResponse,
};
