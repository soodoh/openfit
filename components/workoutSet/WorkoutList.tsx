"use client";

import { AddExerciseRow } from "@/components/routines/AddExerciseRow";
import { RestTimer } from "@/components/sessions/RestTimer";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api } from "@/convex/_generated/api";
import {
  ListView,
  type RoutineDayId,
  type SetGroupWithRelations,
  type Units,
  type WorkoutSessionId,
} from "@/lib/convex-types";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMutation } from "convex/react";
import dayjs from "dayjs";
import { ArrowUpDown, Dumbbell } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { useTimer } from "react-timer-hook";
import { WorkoutSetGroup } from "./WorkoutSetGroup";

export const WorkoutList = ({
  view = ListView.EditTemplate,
  setGroups,
  units,
  sessionOrDayId,
}: {
  view: ListView;
  setGroups: SetGroupWithRelations[];
  units: Units;
  sessionOrDayId: RoutineDayId | WorkoutSessionId;
}) => {
  const [, startTransition] = useTransition();
  const [optimisticSetGroups, optimisticUpdateSetGroups] = useOptimistic<
    SetGroupWithRelations[],
    SetGroupWithRelations[]
  >(setGroups, (_, newSetGroups) => newSetGroups);
  const [isReorderActive, setReorderActive] = useState(false);
  const [isTimerOpen, setTimerOpen] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState<number>(90);
  const expiryTimestamp = dayjs().add(totalSeconds, "seconds").toDate();
  const timer = useTimer({
    expiryTimestamp,
    autoStart: false,
  });

  const reorderSetGroups = useMutation(api.mutations.setGroups.reorder);

  const startRestTimer = (seconds: number) => {
    setTotalSeconds(seconds);
    timer.restart(dayjs().add(seconds, "seconds").toDate(), true);
    setTimerOpen(true);
  };

  const mouseSensor = useSensor(MouseSensor);
  const touchSensor = useSensor(TouchSensor);
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor);

  const handleSort = (event: DragEndEvent) => {
    const dragId = event.active.id as string;
    const overId = event.over?.id as string;
    if (!overId || dragId === overId || !optimisticSetGroups.length) {
      return;
    }
    const oldIndex = optimisticSetGroups.findIndex((set) => set._id === dragId);
    const newIndex = optimisticSetGroups.findIndex((set) => set._id === overId);
    const newSetGroups = arrayMove(optimisticSetGroups, oldIndex, newIndex);
    startTransition(async () => {
      optimisticUpdateSetGroups(newSetGroups);
      await reorderSetGroups({
        sessionOrDayId,
        isSession: view !== ListView.EditTemplate,
        setGroupIds: newSetGroups.map((setGroup) => setGroup._id),
      });
    });
  };

  return (
    <div className="pb-4">
      {/* Add Exercise Section */}
      <div className="py-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-foreground/10 flex items-center justify-center">
              <Dumbbell className="h-4 w-4 text-primary dark:text-foreground" />
            </div>
            <div>
              <h3 className="font-medium text-sm">Add Exercise</h3>
              <p className="text-xs text-muted-foreground">
                Search and add exercises to your workout
              </p>
            </div>
          </div>
          <AddExerciseRow
            sessionOrDayId={sessionOrDayId}
            isSession={view !== ListView.EditTemplate}
          />
        </div>
      </div>

      {/* Controls Section */}
      <div className="py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 px-1">
            <div className="flex items-center gap-2">
              <Switch
                id="reorder-switch"
                checked={isReorderActive}
                onCheckedChange={setReorderActive}
              />
              <Label
                htmlFor="reorder-switch"
                className="text-sm text-muted-foreground flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                Reorder exercises
              </Label>
            </div>
          </div>

          {view === ListView.CurrentSession && (
            <RestTimer
              open={isTimerOpen}
              setOpen={setTimerOpen}
              totalSeconds={totalSeconds}
              setTotalSeconds={setTotalSeconds}
              timer={timer}
            />
          )}
        </div>
      </div>

      {/* Exercise List */}
      {optimisticSetGroups.length > 0 ? (
        <div className="py-4">
          <div className="rounded-xl border bg-card overflow-hidden divide-y divide-border">
            <DndContext
              id="set-groups"
              onDragEnd={handleSort}
              sensors={sensors}
            >
              <SortableContext
                items={optimisticSetGroups.map((sg) => sg._id)}
                strategy={verticalListSortingStrategy}
              >
                {optimisticSetGroups.map((setGroup) => {
                  return (
                    <WorkoutSetGroup
                      view={view}
                      key={`set-${setGroup._id}`}
                      isReorderActive={isReorderActive}
                      setGroup={setGroup}
                      units={units}
                      startRestTimer={startRestTimer}
                    />
                  );
                })}
              </SortableContext>
            </DndContext>
          </div>
        </div>
      ) : (
        <div className="py-8">
          <div className="text-center py-12 rounded-xl border border-dashed bg-muted/20">
            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-muted-foreground mb-1">
              No exercises yet
            </h3>
            <p className="text-sm text-muted-foreground/70">
              Add your first exercise using the form above
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
