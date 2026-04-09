import type {
	InfiniteData,
	UseInfiniteQueryResult,
	UseQueryResult,
} from "@tanstack/react-query";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type {
	CursorPage,
	RoutineDayResult,
	RoutineQueryDto,
	RoutineQueryResult,
} from "@/lib/api-types";
import { queryKeys } from "@/lib/query-keys";
import { fetchJson } from "@/lib/request-helpers";

type RoutineFilters = Record<string, unknown> & {
	search?: string;
};

function parseRoutineDay(
	routineDay: RoutineQueryDto["routineDays"][number],
): RoutineDayResult {
	return {
		...routineDay,
		createdAt: new Date(routineDay.createdAt),
		updatedAt: new Date(routineDay.updatedAt),
		routine: routineDay.routine
			? {
					...routineDay.routine,
					createdAt: new Date(routineDay.routine.createdAt),
					updatedAt: new Date(routineDay.routine.updatedAt),
				}
			: routineDay.routine,
		setGroups: routineDay.setGroups?.map((setGroup) => ({
			...setGroup,
			createdAt: new Date(setGroup.createdAt),
			updatedAt: new Date(setGroup.updatedAt),
			sets: setGroup.sets.map((set) => ({
				...set,
				createdAt: new Date(set.createdAt),
				updatedAt: new Date(set.updatedAt),
				exercise: set.exercise
					? {
							...set.exercise,
							imageUrl: set.exercise.imageUrl ?? null,
						}
					: set.exercise,
			})),
		})),
	};
}

function parseRoutine(routine: RoutineQueryDto): RoutineQueryResult {
	return {
		...routine,
		createdAt: new Date(routine.createdAt),
		updatedAt: new Date(routine.updatedAt),
		routineDays: routine.routineDays.map(parseRoutineDay),
	};
}
// Fetch paginated routines
async function fetchRoutines(
	filters: RoutineFilters = {},
	cursor?: string,
	limit = 20,
	signal?: AbortSignal,
): Promise<CursorPage<RoutineQueryResult>> {
	const params = new URLSearchParams();
	if (filters.search) {
		params.set("search", filters.search);
	}
	if (cursor) {
		params.set("cursor", cursor);
	}
	params.set("limit", String(limit));
	const response = await fetch(`/api/routines?${params}`, { signal });
	const payload = await fetchJson<CursorPage<RoutineQueryDto>>(
		response,
		"Failed to fetch routines",
	);
	return {
		...payload,
		page: payload.page.map(parseRoutine),
	};
}
// Fetch single routine
async function fetchRoutine(id: string): Promise<RoutineQueryResult> {
	const response = await fetch(`/api/routines/${id}`);
	if (response.status === 404) {
		throw new Error("Routine not found");
	}
	const payload = await fetchJson<RoutineQueryDto>(
		response,
		"Failed to fetch routine",
	);
	return parseRoutine(payload);
}
// Hook for paginated routine list
export function useRoutines(
	filters: RoutineFilters = {},
): UseInfiniteQueryResult<
	InfiniteData<CursorPage<RoutineQueryResult>, string | undefined>
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
): UseQueryResult<RoutineQueryResult> {
	return useQuery({
		queryKey: queryKeys.routines.detail(id ?? ""),
		queryFn: async () => fetchRoutine(id!),
		enabled: Boolean(id),
	});
}
// Hook for routine search (simple list, not paginated)
export function useRoutineSearch(
	term: string,
): UseInfiniteQueryResult<
	InfiniteData<CursorPage<RoutineQueryResult>, string | undefined>
> {
	return useRoutines({ search: term });
}
