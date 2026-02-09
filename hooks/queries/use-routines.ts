"use client";

import { queryKeys } from "@/lib/query-keys";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

interface RoutineDay {
  id: string;
  routineId: string;
  userId: string;
  description: string;
  weekdays: number[];
  createdAt: Date;
  updatedAt: Date;
}

interface Routine {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  routineDays: RoutineDay[];
  createdAt: Date;
  updatedAt: Date;
}

interface PaginatedResponse<T> {
  page: T[];
  isDone: boolean;
  continueCursor: string | null;
}

interface RoutineFilters {
  search?: string;
}

// Fetch paginated routines
async function fetchRoutines(
  filters: RoutineFilters = {},
  cursor?: string,
  limit = 20,
  signal?: AbortSignal,
): Promise<PaginatedResponse<Routine>> {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (cursor) params.set("cursor", cursor);
  params.set("limit", String(limit));

  const response = await fetch(`/api/routines?${params}`, { signal });
  if (!response.ok) throw new Error("Failed to fetch routines");
  return response.json();
}

// Fetch single routine
async function fetchRoutine(id: string): Promise<Routine | null> {
  const response = await fetch(`/api/routines/${id}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Failed to fetch routine");
  return response.json();
}

// Hook for paginated routine list
export function useRoutines(filters: RoutineFilters = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.routines.list(filters as Record<string, unknown>),
    queryFn: ({ pageParam, signal }) =>
      fetchRoutines(filters, pageParam, 20, signal),
    getNextPageParam: (lastPage) =>
      lastPage.isDone ? undefined : lastPage.continueCursor,
    initialPageParam: undefined as string | undefined,
  });
}

// Hook for single routine
export function useRoutine(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.routines.detail(id || ""),
    queryFn: () => fetchRoutine(id!),
    enabled: !!id,
  });
}

// Hook for routine search (simple list, not paginated)
export function useRoutineSearch(term: string) {
  return useRoutines({ search: term });
}
