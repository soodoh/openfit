import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchJson } from "@/lib/request-helpers";
import type { RoutineDayWithData, RoutineDayWithRoutine } from "@/lib/types";

// Fetch routine day with full data
async function fetchRoutineDay(
	id: string,
): Promise<RoutineDayWithData | undefined> {
	const response = await fetch(`/api/routine-days/${id}`);
	if (response.status === 404) {
		return undefined;
	}
	return fetchJson<RoutineDayWithData>(response, "Failed to fetch routine day");
}
// Search routine days
async function searchRoutineDays(
	term: string,
	limit = 10,
): Promise<RoutineDayWithRoutine[]> {
	const params = new URLSearchParams();
	if (term) {
		params.set("search", term);
	}
	params.set("limit", String(limit));
	const response = await fetch(`/api/routine-days?${params}`);
	return fetchJson<RoutineDayWithRoutine[]>(
		response,
		"Failed to search routine days",
	);
}
// Hook for single routine day with full data
export function useRoutineDay(
	id: string | undefined,
): UseQueryResult<RoutineDayWithData | undefined> {
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
): UseQueryResult<RoutineDayWithRoutine[]> {
	return useQuery({
		queryKey: queryKeys.routineDays.search(term),
		queryFn: async () => searchRoutineDays(term, limit),
	});
}
