import { fetchJson } from "@/lib/request-helpers";
import { queryKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
type DashboardStats = {
  totalSessions: number;
  totalRoutines: number;
  thisWeekSessions: number;
  currentStreak: number;
};
type RecentSession = {
  id: string;
  name: string;
  startTime: string;
  endTime: string | undefined;
  impression: number | undefined;
  setGroups: Array<{
    id: string;
    type: string;
    order: number;
    sets: Array<{
      id: string;
      exerciseId: string;
      exercise:
        | {
            id: string;
            name: string;
            imageUrl: string | undefined;
          }
        | undefined;
    }>;
  }>;
};
// Fetch dashboard stats
async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await fetch("/api/dashboard/stats");
  return fetchJson<DashboardStats>(response, "Failed to fetch dashboard stats");
}
// Fetch recent sessions
async function fetchRecentSessions(): Promise<RecentSession[]> {
  const response = await fetch("/api/dashboard/recent-sessions");
  return fetchJson<RecentSession[]>(
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
export function useRecentSessions(): UseQueryResult<RecentSession[]> {
  return useQuery({
    queryKey: queryKeys.dashboard.recentSessions(),
    queryFn: fetchRecentSessions,
  });
}
