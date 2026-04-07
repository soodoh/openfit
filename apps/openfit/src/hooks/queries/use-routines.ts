import type {
	InfiniteData,
	UseInfiniteQueryResult,
	UseQueryResult,
} from "@tanstack/react-query";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { CursorPage, RoutineDayDto, RoutineDto } from "@/lib/api-types";
import { queryKeys } from "@/lib/query-keys";
import { fetchJson } from "@/lib/request-helpers";

type RoutineQueryDto = Omit<
	RoutineDto,
	"createdAt" | "updatedAt" | "routineDays"
> & {
	createdAt: Date;
	updatedAt: Date;
	routineDays: Array<
		Omit<RoutineDayDto, "createdAt" | "updatedAt"> & {
			createdAt: Date;
			updatedAt: Date;
		}
	>;
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
): Promise<CursorPage<RoutineQueryDto>> {
	const params = new URLSearchParams();
	if (filters.search) {
		params.set("search", filters.search);
	}
	if (cursor) {
		params.set("cursor", cursor);
	}
	params.set("limit", String(limit));
	const response = await fetch(`/api/routines?${params}`, { signal });
	return fetchJson<CursorPage<RoutineQueryDto>>(
		response,
		"Failed to fetch routines",
	);
}
// Fetch single routine
async function fetchRoutine(id: string): Promise<RoutineQueryDto | undefined> {
	const response = await fetch(`/api/routines/${id}`);
	if (response.status === 404) {
		return undefined;
	}
	return fetchJson<RoutineQueryDto>(response, "Failed to fetch routine");
}
// Hook for paginated routine list
export function useRoutines(
	filters: RoutineFilters = {},
): UseInfiniteQueryResult<
	InfiniteData<CursorPage<RoutineQueryDto>, string | undefined>
> {
	return useInfiniteQuery({
		queryKey: queryKeys.routines.list(filters),
		queryFn: async ({ pageParam, signal }) =>
			fetchRoutines(filters, pageParam, 20, signal),
		getNextPageParam: (lastPage) =>
			lastPage.isDone ? undefined : (lastPage.continueCursor ?? undefined),
		initialPageParam: undefined as string | undefined,
	});
}
// Hook for single routine
export function useRoutine(
	id: string | undefined,
): UseQueryResult<RoutineQueryDto | undefined> {
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
	InfiniteData<CursorPage<RoutineQueryDto>, string | undefined>
> {
	return useRoutines({ search: term });
}
