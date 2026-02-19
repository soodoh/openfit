/* eslint-disable eslint-plugin-unicorn(no-array-for-each), typescript-eslint(explicit-module-boundary-types), typescript-eslint(no-restricted-types) */

import { queryKeys } from "@/lib/query-keys";
import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import type { ExerciseWithImageUrl } from "@/lib/types";

type ExerciseFilters = {
  search?: string;
  equipmentId?: string;
  equipmentIds?: string[];
  level?: "beginner" | "intermediate" | "expert";
  categoryId?: string;
  primaryMuscleId?: string;
}

// Use the proper type from convex-types
type Exercise = ExerciseWithImageUrl;

type PaginatedResponse<T> = {
  page: T[];
  isDone: boolean;
  continueCursor: string | null;
}

// Helper to build query string
function buildExerciseQueryString(
  filters: ExerciseFilters,
  cursor?: string,
  limit?: number,
): string {
  const params = new URLSearchParams();
  if (filters.search) {params.set("search", filters.search);}
  if (filters.equipmentId) {params.set("equipmentId", filters.equipmentId);}
  if (filters.equipmentIds) {
    filters.equipmentIds.forEach((id) => params.append("equipmentIds", id));
  }
  if (filters.level) {params.set("level", filters.level);}
  if (filters.categoryId) {params.set("categoryId", filters.categoryId);}
  if (filters.primaryMuscleId)
    {params.set("primaryMuscleId", filters.primaryMuscleId);}
  if (cursor) {params.set("cursor", cursor);}
  if (limit) {params.set("limit", String(limit));}
  return params.toString();
}

// Fetch paginated exercises
async function fetchExercises(
  filters: ExerciseFilters = {},
  cursor?: string,
  limit = 20,
  signal?: AbortSignal,
): Promise<PaginatedResponse<Exercise>> {
  const queryString = buildExerciseQueryString(filters, cursor, limit);
  const response = await fetch(`/api/exercises?${queryString}`, { signal });
  if (!response.ok) {throw new Error("Failed to fetch exercises");}
  return response.json();
}

// Fetch single exercise
async function fetchExercise(id: string): Promise<Exercise | null> {
  const response = await fetch(`/api/exercises/${id}`);
  if (response.status === 404) {return null;}
  if (!response.ok) {throw new Error("Failed to fetch exercise");}
  return response.json();
}

// Search exercises (simple list, not paginated)
async function searchExercises(
  term: string,
  equipmentIds?: string[],
  limit = 20,
  signal?: AbortSignal,
): Promise<Exercise[]> {
  const params = new URLSearchParams();
  if (term) {params.set("q", term);}
  if (equipmentIds) {
    equipmentIds.forEach((id) => params.append("equipmentIds", id));
  }
  params.set("limit", String(limit));

  const response = await fetch(`/api/exercises/search?${params}`, { signal });
  if (!response.ok) {throw new Error("Failed to search exercises");}
  return response.json();
}

// Search similar exercises
async function searchSimilarExercises(
  primaryMuscleIds: string[],
  options: {
    search?: string;
    equipmentIds?: string[];
    excludeExerciseId?: string;
    limit?: number;
  } = {},
): Promise<Exercise[]> {
  const params = new URLSearchParams();
  if (options.search) {params.set("q", options.search);}
  if (options.equipmentIds) {
    options.equipmentIds.forEach((id) => params.append("equipmentIds", id));
  }
  primaryMuscleIds.forEach((id) => params.append("primaryMuscleIds", id));
  if (options.excludeExerciseId)
    {params.set("exclude", options.excludeExerciseId);}
  if (options.limit) {params.set("limit", String(options.limit));}

  const response = await fetch(`/api/exercises/similar?${params}`);
  if (!response.ok) {throw new Error("Failed to search similar exercises");}
  return response.json();
}

// Hook for paginated exercise list
export function useExercises(filters: ExerciseFilters = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.exercises.list(filters as Record<string, unknown>),
    queryFn: ({ pageParam, signal }) =>
      fetchExercises(filters, pageParam, 20, signal),
    getNextPageParam: (lastPage) =>
      lastPage.isDone ? undefined : lastPage.continueCursor,
    initialPageParam: undefined as string | undefined,
  });
}

// Hook for single exercise
export function useExercise(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.exercises.detail(id || ""),
    queryFn: () => fetchExercise(id!),
    enabled: Boolean(id),
  });
}

// Hook for exercise search (simple list)
export function useExerciseSearch(
  term: string,
  equipmentIds?: string[],
  limit = 20,
) {
  return useQuery({
    queryKey: queryKeys.exercises.search(term, { equipmentIds }),
    queryFn: ({ signal }) => searchExercises(term, equipmentIds, limit, signal),
    enabled: true,
    placeholderData: keepPreviousData,
  });
}

// Hook for similar exercises
export function useSimilarExercises(
  primaryMuscleIds: string[] | undefined,
  options: {
    search?: string;
    equipmentIds?: string[];
    excludeExerciseId?: string;
    limit?: number;
  } = {},
) {
  const muscleIds = primaryMuscleIds ?? [];
  return useQuery({
    queryKey: queryKeys.exercises.similar({
      primaryMuscleIds: muscleIds,
      ...options,
    }),
    queryFn: () => searchSimilarExercises(muscleIds, options),
    enabled: muscleIds.length > 0,
  });
}
