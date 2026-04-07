import type {
	InfiniteData,
	UseInfiniteQueryResult,
	UseQueryResult,
} from "@tanstack/react-query";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchJson } from "@/lib/request-helpers";
import type { RoutineWithDays } from "@/lib/types";

type PaginatedResponse<T> = {
	page: T[];
	isDone: boolean;
	continueCursor: string | undefined;
};
type RoutineFilters = Record<string, unknown> & {
	search?: string;
};
// Fetch paginated routines
async function fetchRoutines(
	filters: RoutineFilters = {},
	cursor?: string,
	limit = 20,
	signal?: AbortSignal,
): Promise<PaginatedResponse<RoutineWithDays>> {
	const params = new URLSearchParams();
	if (filters.search) {
		params.set("search", filters.search);
	}
	if (cursor) {
		params.set("cursor", cursor);
	}
	params.set("limit", String(limit));
	const response = await fetch(`/api/routines?${params}`, { signal });
	return fetchJson<PaginatedResponse<RoutineWithDays>>(
		response,
		"Failed to fetch routines",
	);
}
// Fetch single routine
async function fetchRoutine(id: string): Promise<RoutineWithDays | undefined> {
	const response = await fetch(`/api/routines/${id}`);
	if (response.status === 404) {
		return undefined;
	}
	return fetchJson<RoutineWithDays>(response, "Failed to fetch routine");
}
// Hook for paginated routine list
export function useRoutines(
	filters: RoutineFilters = {},
): UseInfiniteQueryResult<
	InfiniteData<PaginatedResponse<RoutineWithDays>, string | undefined>
> {
	return useInfiniteQuery({
		queryKey: queryKeys.routines.list(filters),
		queryFn: async ({ pageParam, signal }) =>
			fetchRoutines(filters, pageParam, 20, signal),
		getNextPageParam: (lastPage) =>
			lastPage.isDone ? undefined : lastPage.continueCursor,
		initialPageParam: undefined as string | undefined,
	});
}
// Hook for single routine
export function useRoutine(
	id: string | undefined,
): UseQueryResult<RoutineWithDays | undefined> {
	return useQuery({
		queryKey: queryKeys.routines.detail(id ?? ""),
		queryFn: async () => fetchRoutine(id ?? ""),
		enabled: Boolean(id),
	});
}
// Hook for routine search (simple list, not paginated)
export function useRoutineSearch(
	term: string,
): UseInfiniteQueryResult<
	InfiniteData<PaginatedResponse<RoutineWithDays>, string | undefined>
> {
	return useRoutines({ search: term });
}
