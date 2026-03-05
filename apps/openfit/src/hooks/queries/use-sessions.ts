import { fetchJson } from "@/lib/request-helpers";
import { queryKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
type SetWithRelations = {
  id: string;
  userId: string;
  setGroupId: string;
  exerciseId: string;
  type: string;
  order: number;
  reps: number;
  repetitionUnitId: string;
  weight: number;
  weightUnitId: string;
  restTime: number;
  completed: boolean;
  exercise:
    | {
        id: string;
        name: string;
        imageUrl: string | undefined;
      }
    | undefined;
  repetitionUnit:
    | {
        id: string;
        name: string;
      }
    | undefined;
  weightUnit:
    | {
        id: string;
        name: string;
      }
    | undefined;
};
type SetGroupWithSets = {
  id: string;
  userId: string;
  routineDayId: string | undefined;
  sessionId: string | undefined;
  type: string;
  order: number;
  comment: string | undefined;
  sets: SetWithRelations[];
};
type WorkoutSessionWithData = {
  id: string;
  userId: string;
  name: string;
  notes: string;
  impression: number | undefined;
  startTime: Date;
  endTime: Date | undefined;
  templateId: string | undefined;
  setGroups: SetGroupWithSets[];
  createdAt: Date;
  updatedAt: Date;
};
type WorkoutSessionSummary = {
  id: string;
  createdAt: Date;
  name: string;
  startTime: Date;
  endTime: Date | undefined;
  impression: number | undefined;
};
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
async function fetchCurrentSession(): Promise<
  WorkoutSessionWithData | undefined
> {
  const response = await fetch("/api/sessions/current");
  return fetchJson<WorkoutSessionWithData | undefined>(
    response,
    "Failed to fetch current session",
  );
}
// Fetch single session
async function fetchSession(
  id: string,
): Promise<WorkoutSessionWithData | undefined> {
  const response = await fetch(`/api/sessions/${id}`);
  if (response.status === 404) {
    return undefined;
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
    enabled: Boolean(startDate) && Boolean(endDate),
  });
}
// Hook for current active session
export function useCurrentSession(): UseQueryResult<
  WorkoutSessionWithData | undefined
> {
  return useQuery({
    queryKey: queryKeys.sessions.current(),
    queryFn: fetchCurrentSession,
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
    enabled: Boolean(id),
  });
}
