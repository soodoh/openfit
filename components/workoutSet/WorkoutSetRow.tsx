"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import {
  ListView,
  type SetWithRelations,
  type Units,
} from "@/lib/convex-types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation } from "convex/react";
import { GripVertical, Trash2 } from "lucide-react";
import { RepUnitMenu } from "./RepUnitMenu";
import { SetTypeMenu } from "./SetTypeMenu";
import { WeightUnitMenu } from "./WeightUnitMenu";
import { WorkoutTimer } from "./WorkoutTimer";

export const WorkoutSetRow = ({
  view,
  set,
  setNum,
  units,
  startRestTimer,
}: {
  view: ListView;
  set: SetWithRelations;
  setNum: number;
  units: Units;
  startRestTimer: (seconds: number) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: set._id });
  const isRowDisabled = set.completed && view === ListView.CurrentSession;

  const updateSet = useMutation(api.mutations.sets.update);
  const deleteSet = useMutation(api.mutations.sets.remove);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 min-h-[56px] transition-colors ${
        isRowDisabled ? "bg-muted/40" : "hover:bg-muted/20"
      }`}
    >
      <Button
        variant="ghost"
        size="icon"
        className="touch-manipulation h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </Button>

      <SetTypeMenu set={set} setNum={setNum} />

      <div className="flex gap-2 flex-1 items-center">
        <div className="flex items-center gap-0.5 flex-1 min-w-0">
          <Input
            key={`reps-${set._id}-${set.reps}`}
            type="text"
            disabled={isRowDisabled}
            defaultValue={set.reps}
            className="h-9 text-sm text-center font-medium flex-1 min-w-0"
            onBlur={async (event) => {
              updateSet({
                id: set._id,
                reps: parseInt(event.target.value, 10) || 0,
              });
            }}
          />
          <RepUnitMenu
            id={set._id}
            label={set.repetitionUnit?.name ?? "reps"}
            units={units}
            onChange={(repUnit) => {
              updateSet({
                id: set._id,
                repetitionUnitId: repUnit._id,
              });
            }}
          />
        </div>

        <div className="flex items-center gap-0.5 flex-1 min-w-0">
          <Input
            key={`weight-${set._id}-${set.weight}`}
            type="text"
            disabled={isRowDisabled}
            defaultValue={set.weight}
            className="h-9 text-sm text-center font-medium flex-1 min-w-0"
            onBlur={async (event) => {
              updateSet({
                id: set._id,
                weight: parseInt(event.target.value, 10) || 0,
              });
            }}
          />
          <WeightUnitMenu
            id={set._id}
            label={set.weightUnit?.name ?? "lbs"}
            units={units}
            onChange={(weightUnit) => {
              updateSet({
                id: set._id,
                weightUnitId: weightUnit._id,
              });
            }}
          />
        </div>

        {view === ListView.CurrentSession &&
          (set.repetitionUnit?.name === "Seconds" && !set.completed ? (
            <WorkoutTimer
              set={set}
              onComplete={async () => {
                updateSet({
                  id: set._id,
                  completed: true,
                });
                if (set.restTime) {
                  startRestTimer(set.restTime);
                }
              }}
            />
          ) : (
            <div className="flex items-center justify-center w-8 shrink-0">
              <Checkbox
                aria-label="Mark as Completed"
                checked={set.completed}
                className="h-5 w-5 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                onCheckedChange={(checked: boolean) => {
                  updateSet({
                    id: set._id,
                    completed: checked,
                  });
                  if (set.restTime && checked) {
                    startRestTimer(set.restTime);
                  }
                }}
              />
            </div>
          ))}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
        onClick={() => deleteSet({ id: set._id })}
        aria-label="Delete set"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};
