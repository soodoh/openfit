import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchJson } from "@/lib/request-helpers";
import type { DashboardRecentSession, DashboardStats } from "@/lib/types";

// Fetch dashboard stats
async function fetchDashboardStats(): Promise<DashboardStats> {
	const response = await fetch("/api/dashboard/stats");
	return fetchJson<DashboardStats>(response, "Failed to fetch dashboard stats");
}
// Fetch recent sessions
async function fetchRecentSessions(): Promise<DashboardRecentSession[]> {
	const response = await fetch("/api/dashboard/recent-sessions");
	return fetchJson<DashboardRecentSession[]>(
		response,
		"Failed to fetch recent sessions",
	);
}
// Hook for dashboard stats
export function useDashboardStats(): UseQueryResult<DashboardStats> {
	return useQuery({
		queryKey: queryKeys.dashboard.stats(),
		queryFn: fetchDashboardStats,
	});
}
// Hook for recent sessions
export function useRecentSessions(): UseQueryResult<DashboardRecentSession[]> {
	return useQuery({
		queryKey: queryKeys.dashboard.recentSessions(),
		queryFn: fetchRecentSessions,
	});
}
