"use client";

import { AutocompleteExercise } from "@/components/exercises/AutocompleteExercise";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateSetGroup } from "@/hooks";
import { Plus } from "lucide-react";
import { useState } from "react";
import type { Exercise, RoutineDayId, WorkoutSessionId } from "@/lib/types";

export const AddExerciseRow = ({
  sessionOrDayId,
  isSession,
}: {
  sessionOrDayId: RoutineDayId | WorkoutSessionId;
  isSession: boolean;
}) => {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [numSets, setNumSets] = useState<string>("1");

  const createSetGroupMutation = useCreateSetGroup();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!exercise) {
      return;
    }
    await createSetGroupMutation.mutateAsync({
      sessionId: isSession ? sessionOrDayId : undefined,
      routineDayId: isSession ? undefined : sessionOrDayId,
      type: "NORMAL",
      exerciseId: exercise.id,
      numSets: parseInt(numSets, 10),
    });
    setExercise(null);
    setNumSets("1");
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <AutocompleteExercise
          value={exercise}
          onChange={(newExercise) => setExercise(newExercise)}
        />
      </div>
      <div className="flex items-center gap-2">
        <div className="w-16">
          <Input
            type="number"
            placeholder="Sets"
            value={numSets}
            onChange={(event) => setNumSets(event.target.value)}
            min={1}
            className="h-9 text-center"
          />
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={!exercise}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add</span>
        </Button>
      </div>
    </form>
  );
};
