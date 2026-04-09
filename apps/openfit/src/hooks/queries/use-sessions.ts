import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchJson } from "@/lib/request-helpers";
import type {
	WorkoutSessionSummary,
	WorkoutSessionWithData,
} from "@/lib/types";

// Fetch all sessions
async function fetchSessions(): Promise<WorkoutSessionWithData[]> {
	const response = await fetch("/api/sessions");
	return fetchJson<WorkoutSessionWithData[]>(
		response,
		"Failed to fetch sessions",
	);
}
// Fetch sessions by date range (for calendar)
async function fetchSessionsByDateRange(
	startDate: number,
	endDate: number,
): Promise<WorkoutSessionSummary[]> {
	const params = new URLSearchParams();
	params.set("startDate", String(startDate));
	params.set("endDate", String(endDate));
	const response = await fetch(`/api/sessions?${params}`);
	return fetchJson<WorkoutSessionSummary[]>(
		response,
		"Failed to fetch sessions",
	);
}
// Fetch current active session
async function fetchCurrentSession(): Promise<WorkoutSessionWithData | null> {
	const response = await fetch("/api/sessions/current");
	return fetchJson<WorkoutSessionWithData | null>(
		response,
		"Failed to fetch current session",
	);
}
// Fetch single session
async function fetchSession(
	id: string,
): Promise<WorkoutSessionWithData | null> {
	const response = await fetch(`/api/sessions/${id}`);
	if (response.status === 404) {
		return null;
	}
	return fetchJson<WorkoutSessionWithData>(response, "Failed to fetch session");
}
// Hook for all sessions
export function useSessions(): UseQueryResult<WorkoutSessionWithData[]> {
	return useQuery({
		queryKey: queryKeys.sessions.lists(),
		queryFn: fetchSessions,
	});
}
// Hook for sessions in date range
export function useSessionsByDateRange(
	startDate: number,
	endDate: number,
): UseQueryResult<WorkoutSessionSummary[]> {
	return useQuery({
		queryKey: queryKeys.sessions.byDateRange(startDate, endDate),
		queryFn: async () => fetchSessionsByDateRange(startDate, endDate),
	});
}
// Hook for current active session
export function useCurrentSession(): UseQueryResult<
	WorkoutSessionWithData | undefined
> {
	return useQuery({
		queryKey: queryKeys.sessions.current(),
		queryFn: fetchCurrentSession,
		select: (session) => session ?? undefined,
		refetchInterval: 30_000, // Refetch every 30 seconds to keep session fresh
	});
}
// Hook for single session
export function useSession(
	id: string | undefined,
): UseQueryResult<WorkoutSessionWithData | undefined> {
	return useQuery({
		queryKey: queryKeys.sessions.detail(id ?? ""),
		queryFn: async () => fetchSession(id!),
		select: (session) => session ?? undefined,
		enabled: Boolean(id),
	});
}
