
import { queryKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";

interface SetWithRelations {
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
  exercise: {
    id: string;
    name: string;
    imageUrl: string | null;
  } | null;
  repetitionUnit: { id: string; name: string } | null;
  weightUnit: { id: string; name: string } | null;
}

interface SetGroupWithSets {
  id: string;
  userId: string;
  routineDayId: string | null;
  sessionId: string | null;
  type: string;
  order: number;
  comment: string | null;
  sets: SetWithRelations[];
}

interface WorkoutSessionWithData {
  id: string;
  userId: string;
  name: string;
  notes: string;
  impression: number | null;
  startTime: Date;
  endTime: Date | null;
  templateId: string | null;
  setGroups: SetGroupWithSets[];
  createdAt: Date;
  updatedAt: Date;
}

interface WorkoutSessionSummary {
  id: string;
  createdAt: Date;
  name: string;
  startTime: Date;
  endTime: Date | null;
  impression: number | null;
}

// Fetch all sessions
async function fetchSessions(): Promise<WorkoutSessionWithData[]> {
  const response = await fetch("/api/sessions");
  if (!response.ok) throw new Error("Failed to fetch sessions");
  return response.json();
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
  if (!response.ok) throw new Error("Failed to fetch sessions");
  return response.json();
}

// Fetch current active session
async function fetchCurrentSession(): Promise<WorkoutSessionWithData | null> {
  const response = await fetch("/api/sessions/current");
  if (!response.ok) throw new Error("Failed to fetch current session");
  const data = await response.json();
  return data;
}

// Fetch single session
async function fetchSession(
  id: string,
): Promise<WorkoutSessionWithData | null> {
  const response = await fetch(`/api/sessions/${id}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Failed to fetch session");
  return response.json();
}

// Hook for all sessions
export function useSessions() {
  return useQuery({
    queryKey: queryKeys.sessions.lists(),
    queryFn: fetchSessions,
  });
}

// Hook for sessions in date range
export function useSessionsByDateRange(startDate: number, endDate: number) {
  return useQuery({
    queryKey: queryKeys.sessions.byDateRange(startDate, endDate),
    queryFn: () => fetchSessionsByDateRange(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

// Hook for current active session
export function useCurrentSession() {
  return useQuery({
    queryKey: queryKeys.sessions.current(),
    queryFn: fetchCurrentSession,
    refetchInterval: 30000, // Refetch every 30 seconds to keep session fresh
  });
}

// Hook for single session
export function useSession(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.sessions.detail(id || ""),
    queryFn: () => fetchSession(id!),
    enabled: !!id,
  });
}
