import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import type {
	RoutineDayDetailDto,
	RoutineDayDetailResult,
	RoutineDaySearchDto,
	RoutineDaySearchResult,
} from "@/lib/api-types";
import { queryKeys } from "@/lib/query-keys";
import { fetchJson } from "@/lib/request-helpers";

function parseRoutineDaySearch(
	routineDay: RoutineDaySearchDto,
): RoutineDaySearchResult {
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
	};
}

function parseRoutineDayDetail(
	routineDay: RoutineDayDetailDto,
): RoutineDayDetailResult {
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
		setGroups: routineDay.setGroups.map((setGroup) => ({
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

// Fetch routine day with full data
async function fetchRoutineDay(
	id: string,
): Promise<RoutineDayDetailResult | undefined> {
	const response = await fetch(`/api/routine-days/${id}`);
	if (response.status === 404) {
		return undefined;
	}
	const payload = await fetchJson<RoutineDayDetailDto>(
		response,
		"Failed to fetch routine day",
	);
	return parseRoutineDayDetail(payload);
}
// Search routine days
async function searchRoutineDays(
	term: string,
	limit = 10,
): Promise<RoutineDaySearchResult[]> {
	const params = new URLSearchParams();
	if (term) {
		params.set("search", term);
	}
	params.set("limit", String(limit));
	const response = await fetch(`/api/routine-days?${params}`);
	const payload = await fetchJson<RoutineDaySearchDto[]>(
		response,
		"Failed to search routine days",
	);
	return payload.map(parseRoutineDaySearch);
}
// Hook for single routine day with full data
export function useRoutineDay(
	id: string | undefined,
): UseQueryResult<RoutineDayDetailResult | undefined> {
	return useQuery({
		queryKey: queryKeys.routineDays.detail(id ?? ""),
		queryFn: async () => fetchRoutineDay(id ?? ""),
		enabled: Boolean(id),
	});
}
// Hook for searching routine days
export function useRoutineDaySearch(
	term: string,
	limit = 10,
): UseQueryResult<RoutineDaySearchResult[]> {
	return useQuery({
		queryKey: queryKeys.routineDays.search(term),
		queryFn: async () => searchRoutineDays(term, limit),
	});
}
