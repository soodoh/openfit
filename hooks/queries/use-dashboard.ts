"use client";

import { queryKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";

interface DashboardStats {
  totalSessions: number;
  totalRoutines: number;
  thisWeekSessions: number;
  currentStreak: number;
}

interface RecentSession {
  id: string;
  name: string;
  startTime: string;
  endTime: string | null;
  impression: number | null;
  setGroups: {
    id: string;
    type: string;
    order: number;
    sets: {
      id: string;
      exerciseId: string;
      exercise: {
        id: string;
        name: string;
        imageUrl: string | null;
      } | null;
    }[];
  }[];
}

// Fetch dashboard stats
async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await fetch("/api/dashboard/stats");
  if (!response.ok) throw new Error("Failed to fetch dashboard stats");
  return response.json();
}

// Fetch recent sessions
async function fetchRecentSessions(): Promise<RecentSession[]> {
  const response = await fetch("/api/dashboard/recent-sessions");
  if (!response.ok) throw new Error("Failed to fetch recent sessions");
  return response.json();
}

// Hook for dashboard stats
export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: fetchDashboardStats,
  });
}

// Hook for recent sessions
export function useRecentSessions() {
  return useQuery({
    queryKey: queryKeys.dashboard.recentSessions(),
    queryFn: fetchRecentSessions,
  });
}
