import { queryKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";
type Equipment = {
  id: string;
  name: string;
  createdAt: Date;
};
type MuscleGroup = {
  id: string;
  name: string;
  createdAt: Date;
};
type Category = {
  id: string;
  name: string;
  createdAt: Date;
};
type RepetitionUnit = {
  id: string;
  name: string;
  createdAt: Date;
};
type WeightUnit = {
  id: string;
  name: string;
  createdAt: Date;
};
type Units = {
  repetitionUnits: RepetitionUnit[];
  weightUnits: WeightUnit[];
};
// Fetch equipment
async function fetchEquipment(): Promise<Equipment[]> {
  const response = await fetch("/api/lookups/equipment");
  if (!response.ok) {
    throw new Error("Failed to fetch equipment");
  }
  return response.json();
}
// Fetch muscle groups
async function fetchMuscleGroups(): Promise<MuscleGroup[]> {
  const response = await fetch("/api/lookups/muscle-groups");
  if (!response.ok) {
    throw new Error("Failed to fetch muscle groups");
  }
  return response.json();
}
// Fetch categories
async function fetchCategories(): Promise<Category[]> {
  const response = await fetch("/api/lookups/categories");
  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }
  return response.json();
}
// Fetch units
async function fetchUnits(): Promise<Units> {
  const response = await fetch("/api/lookups/units");
  if (!response.ok) {
    throw new Error("Failed to fetch units");
  }
  return response.json();
}
// Hook for equipment
export function useEquipment(): any {
  return useQuery({
    queryKey: queryKeys.lookups.equipment(),
    queryFn: fetchEquipment,
    staleTime: Number.POSITIVE_INFINITY, // Lookup data rarely changes
  });
}
// Hook for muscle groups
export function useMuscleGroups(): any {
  return useQuery({
    queryKey: queryKeys.lookups.muscleGroups(),
    queryFn: fetchMuscleGroups,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
// Hook for categories
export function useCategories(): any {
  return useQuery({
    queryKey: queryKeys.lookups.categories(),
    queryFn: fetchCategories,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
// Hook for units
export function useUnits(): any {
  return useQuery({
    queryKey: queryKeys.lookups.units(),
    queryFn: fetchUnits,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
