
import { queryKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";

interface Gym {
  id: string;
  userId: string;
  name: string;
  equipmentIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Fetch gyms
async function fetchGyms(): Promise<Gym[]> {
  const response = await fetch("/api/gyms");
  if (!response.ok) throw new Error("Failed to fetch gyms");
  return response.json();
}

// Fetch single gym
async function fetchGym(id: string): Promise<Gym | null> {
  const response = await fetch(`/api/gyms/${id}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Failed to fetch gym");
  return response.json();
}

// Hook for all gyms
export function useGyms() {
  return useQuery({
    queryKey: queryKeys.gyms.list(),
    queryFn: fetchGyms,
  });
}

// Hook for single gym
export function useGym(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.gyms.detail(id || ""),
    queryFn: () => fetchGym(id!),
    enabled: !!id,
  });
}
