import { queryKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";
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
type RoutineDayWithData = {
  id: string;
  routineId: string;
  userId: string;
  description: string;
  weekdays: number[];
  routine:
    | {
        id: string;
        name: string;
      }
    | undefined;
  setGroups: SetGroupWithSets[];
  createdAt: Date;
  updatedAt: Date;
};
type RoutineDayWithRoutine = {
  id: string;
  routineId: string;
  description: string;
  weekdays: number[];
  routine:
    | {
        id: string;
        name: string;
      }
    | undefined;
};
// Fetch routine day with full data
async function fetchRoutineDay(
  id: string,
): Promise<RoutineDayWithData | undefined> {
  const response = await fetch(`/api/routine-days/${id}`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error("Failed to fetch routine day");
  }
  return response.json();
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
  if (!response.ok) {
    throw new Error("Failed to search routine days");
  }
  return response.json();
}
// Hook for single routine day with full data
export function useRoutineDay(id: string | undefined): any {
  return useQuery({
    queryKey: queryKeys.routineDays.detail(id || ""),
    queryFn: () => fetchRoutineDay(id!),
    enabled: Boolean(id),
  });
}
// Hook for searching routine days
export function useRoutineDaySearch(term: string, limit = 10): any {
  return useQuery({
    queryKey: queryKeys.routineDays.search(term),
    queryFn: () => searchRoutineDays(term, limit),
  });
}
