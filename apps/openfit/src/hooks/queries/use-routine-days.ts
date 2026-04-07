import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import type { RoutineDayDetailDto, RoutineDaySearchDto } from "@/lib/api-types";
import { queryKeys } from "@/lib/query-keys";
import { fetchJson } from "@/lib/request-helpers";

// Fetch routine day with full data
async function fetchRoutineDay(
	id: string,
): Promise<RoutineDayDetailDto | undefined> {
	const response = await fetch(`/api/routine-days/${id}`);
	if (response.status === 404) {
		return undefined;
	}
	return fetchJson<RoutineDayDetailDto>(
		response,
		"Failed to fetch routine day",
	);
}
// Search routine days
async function searchRoutineDays(
	term: string,
	limit = 10,
): Promise<RoutineDaySearchDto[]> {
	const params = new URLSearchParams();
	if (term) {
		params.set("search", term);
	}
	params.set("limit", String(limit));
	const response = await fetch(`/api/routine-days?${params}`);
	return fetchJson<RoutineDaySearchDto[]>(
		response,
		"Failed to search routine days",
	);
}
// Hook for single routine day with full data
export function useRoutineDay(
	id: string | undefined,
): UseQueryResult<RoutineDayDetailDto | undefined> {
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
): UseQueryResult<RoutineDaySearchDto[]> {
	return useQuery({
		queryKey: queryKeys.routineDays.search(term),
		queryFn: async () => searchRoutineDays(term, limit),
	});
}
