"use client";

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

interface RoutineDayWithData {
  id: string;
  routineId: string;
  userId: string;
  description: string;
  weekdays: number[];
  routine: {
    id: string;
    name: string;
  } | null;
  setGroups: SetGroupWithSets[];
  createdAt: Date;
  updatedAt: Date;
}

interface RoutineDayWithRoutine {
  id: string;
  routineId: string;
  description: string;
  weekdays: number[];
  routine: {
    id: string;
    name: string;
  } | null;
}

// Fetch routine day with full data
async function fetchRoutineDay(id: string): Promise<RoutineDayWithData | null> {
  const response = await fetch(`/api/routine-days/${id}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Failed to fetch routine day");
  return response.json();
}

// Search routine days
async function searchRoutineDays(
  term: string,
  limit = 10,
): Promise<RoutineDayWithRoutine[]> {
  const params = new URLSearchParams();
  if (term) params.set("search", term);
  params.set("limit", String(limit));

  const response = await fetch(`/api/routine-days?${params}`);
  if (!response.ok) throw new Error("Failed to search routine days");
  return response.json();
}

// Hook for single routine day with full data
export function useRoutineDay(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.routineDays.detail(id || ""),
    queryFn: () => fetchRoutineDay(id!),
    enabled: !!id,
  });
}

// Hook for searching routine days
export function useRoutineDaySearch(term: string, limit = 10) {
  return useQuery({
    queryKey: queryKeys.routineDays.search(term),
    queryFn: () => searchRoutineDays(term, limit),
  });
}
