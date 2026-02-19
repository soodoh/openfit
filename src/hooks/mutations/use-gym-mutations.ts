/* eslint-disable typescript-eslint(explicit-module-boundary-types) */

import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type CreateGymInput = {
  name: string;
  equipmentIds?: string[];
}

type UpdateGymInput = {
  id: string;
  name?: string;
  equipmentIds?: string[];
}

// Create gym
async function createGym(input: CreateGymInput) {
  const response = await fetch("/api/gyms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create gym");
  }
  return response.json();
}

// Update gym
async function updateGym({ id, ...input }: UpdateGymInput) {
  const response = await fetch(`/api/gyms/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update gym");
  }
  return response.json();
}

// Delete gym
async function deleteGym(id: string) {
  const response = await fetch(`/api/gyms/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete gym");
  }
  return response.json();
}

export function useCreateGym() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGym,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gyms.all });
    },
  });
}

export function useUpdateGym() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateGym,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.gyms.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.gyms.list() });
    },
  });
}

export function useDeleteGym() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGym,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gyms.all });
    },
  });
}
