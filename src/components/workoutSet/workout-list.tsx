import { AddExerciseRow } from "@/components/routines/add-exercise-row";
import { RestTimer } from "@/components/sessions/rest-timer";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCountdownTimer, useReorderSetGroups } from "@/hooks";
import { ListView } from '@/lib/types';
import type { RoutineDayId, SetGroupWithRelations, Units, WorkoutSessionId } from '@/lib/types';
import { DndContext, KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, } from "@dnd-kit/sortable";
import dayjs from "dayjs";
import { ArrowUpDown, Dumbbell } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { WorkoutSetGroup } from "./workout-set-group";
export const WorkoutList = ({ view = ListView.EditTemplate, setGroups, units, sessionOrDayId, }: {
    view: ListView;
    setGroups: SetGroupWithRelations[];
    units: Units;
    sessionOrDayId: RoutineDayId | WorkoutSessionId;
}): any => {
    const [, startTransition] = useTransition();
    const [optimisticSetGroups, optimisticUpdateSetGroups] = useOptimistic<SetGroupWithRelations[], SetGroupWithRelations[]>(setGroups, (_, newSetGroups) => newSetGroups);
    const [isReorderActive, setReorderActive] = useState(false);
    const [isTimerOpen, setTimerOpen] = useState(false);
    const [totalSeconds, setTotalSeconds] = useState<number>(90);
    const expiryTimestamp = dayjs().add(totalSeconds, "seconds").toDate();
    const timer = useCountdownTimer({
        expiryTimestamp,
        autoStart: false,
    });
    const reorderSetGroupsMutation = useReorderSetGroups();
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
        if (!overId || dragId === overId || optimisticSetGroups.length === 0) {
            return;
        }
        const oldIndex = optimisticSetGroups.findIndex((set) => set.id === dragId);
        const newIndex = optimisticSetGroups.findIndex((set) => set.id === overId);
        const newSetGroups = arrayMove(optimisticSetGroups, oldIndex, newIndex);
        startTransition(async () => {
            optimisticUpdateSetGroups(newSetGroups);
            await reorderSetGroupsMutation.mutateAsync({
                setGroupIds: newSetGroups.map((setGroup) => setGroup.id),
            });
        });
    };
    return (<div className="pb-4">
      {/* Add Exercise Section */}
      <div className="py-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-foreground/10 flex items-center justify-center">
              <Dumbbell className="h-4 w-4 text-primary dark:text-foreground"/>
            </div>
            <div>
              <h3 className="font-medium text-sm">Add Exercise</h3>
              <p className="text-xs text-muted-foreground">
                Search and add exercises to your workout
              </p>
            </div>
          </div>
          <AddExerciseRow sessionOrDayId={sessionOrDayId} isSession={view !== ListView.EditTemplate}/>
        </div>
      </div>

      {/* Controls Section */}
      <div className="py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 px-1">
            <div className="flex items-center gap-2">
              <Switch id="reorder-switch" checked={isReorderActive} onCheckedChange={setReorderActive}/>
              <Label htmlFor="reorder-switch" className="text-sm text-muted-foreground flex items-center gap-1.5 cursor-pointer">
                <ArrowUpDown className="h-3.5 w-3.5"/>
                Reorder exercises
              </Label>
            </div>
          </div>

          {view === ListView.CurrentSession && (<RestTimer open={isTimerOpen} setOpen={setTimerOpen} totalSeconds={totalSeconds} setTotalSeconds={setTotalSeconds} timer={timer}/>)}
        </div>
      </div>

      {/* Exercise List */}
      {optimisticSetGroups.length > 0 ? (<div className="py-4">
          <div className="rounded-xl border bg-card overflow-hidden divide-y divide-border">
            <DndContext id="set-groups" onDragEnd={handleSort} sensors={sensors}>
              <SortableContext items={optimisticSetGroups.map((sg) => sg.id)} strategy={verticalListSortingStrategy}>
                {optimisticSetGroups.map((setGroup) => {
                return (<WorkoutSetGroup view={view} key={`set-${setGroup.id}`} isReorderActive={isReorderActive} setGroup={setGroup} units={units} startRestTimer={startRestTimer}/>);
            })}
              </SortableContext>
            </DndContext>
          </div>
        </div>) : (<div className="py-8">
          <div className="text-center py-12 rounded-xl border border-dashed bg-muted/20">
            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="h-6 w-6 text-muted-foreground"/>
            </div>
            <h3 className="font-medium text-muted-foreground mb-1">
              No exercises yet
            </h3>
            <p className="text-sm text-muted-foreground/70">
              Add your first exercise using the form above
            </p>
          </div>
        </div>)}
    </div>);
};

export default WorkoutList;
