import { queryKeys } from "@/lib/query-keys";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
type UserWithProfile = {
  id: string;
  userId: string;
  email: string;
  role: "USER" | "ADMIN";
};
type MuscleInfo = {
  id: string;
  name: string;
};
type ExerciseWithRelations = {
  id: string;
  name: string;
  level: "beginner" | "intermediate" | "expert";
  force?: "push" | "pull" | "static" | undefined;
  mechanic?: "compound" | "isolation" | undefined;
  equipmentId?: string;
  categoryId: string;
  primaryMuscleIds: string[];
  secondaryMuscleIds: string[];
  instructions: string[];
  imageUrls: Array<string | undefined>;
  equipment:
    | {
        id: string;
        name: string;
      }
    | undefined;
  category:
    | {
        id: string;
        name: string;
      }
    | undefined;
  primaryMuscles: MuscleInfo[];
  secondaryMuscles: MuscleInfo[];
};
type LookupItem = {
  id: string;
  name: string;
};
type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};
type AdminPaginationParams = {
  page: number;
  pageSize: number;
  search?: string;
};
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
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch data");
  }
  return response.json();
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
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch lookups");
  }
  return response.json();
}
// --- Non-paginated fetch helpers (for dropdowns / form selects) ---
async function fetchAdminLookups(type: string): Promise<LookupItem[]> {
  const response = await fetch(`/api/admin/lookups?type=${type}&pageSize=1000`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch lookups");
  }
  const result: PaginatedResponse<LookupItem> = await response.json();
  return result.items;
}
// --- Paginated hooks (for admin tables) ---
export function useAdminUsersPaginated(params: AdminPaginationParams): any {
  return useQuery({
    queryKey: queryKeys.admin.userList(params),
    queryFn: ({ signal }) =>
      fetchPaginatedAdmin<UserWithProfile>("/api/admin/users", params, signal),
    placeholderData: keepPreviousData,
  });
}
export function useAdminExercisesPaginated(params: AdminPaginationParams): any {
  return useQuery({
    queryKey: queryKeys.admin.exerciseList(params),
    queryFn: ({ signal }) =>
      fetchPaginatedAdmin<ExerciseWithRelations>(
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
): any {
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
    queryFn: ({ signal }) => fetchPaginatedLookup(type, params, signal),
    placeholderData: keepPreviousData,
  });
}
// --- Non-paginated hooks (for dropdowns in ExerciseFormModal, etc.) ---
export function useAdminEquipment(): any {
  return useQuery({
    queryKey: queryKeys.admin.equipment(),
    queryFn: () => fetchAdminLookups("equipment"),
  });
}
export function useAdminCategories(): any {
  return useQuery({
    queryKey: queryKeys.admin.categories(),
    queryFn: () => fetchAdminLookups("categories"),
  });
}
export function useAdminMuscleGroups(): any {
  return useQuery({
    queryKey: queryKeys.admin.muscleGroups(),
    queryFn: () => fetchAdminLookups("muscleGroups"),
  });
}
export function useAdminRepetitionUnits(): any {
  return useQuery({
    queryKey: queryKeys.admin.repetitionUnits(),
    queryFn: () => fetchAdminLookups("repetitionUnits"),
  });
}
export function useAdminWeightUnits(): any {
  return useQuery({
    queryKey: queryKeys.admin.weightUnits(),
    queryFn: () => fetchAdminLookups("weightUnits"),
  });
}
export type {
  UserWithProfile,
  ExerciseWithRelations,
  LookupItem,
  PaginatedResponse,
  AdminPaginationParams,
};
