/* eslint-disable eslint-plugin-import(prefer-default-export), eslint-plugin-unicorn(filename-case), typescript-eslint(explicit-module-boundary-types), typescript-eslint(no-restricted-types) */

import { DeleteDayModal } from "@/components/routines/delete-day-modal";
import { WeekdaySelector } from "@/components/routines/weekday-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WorkoutList } from "@/components/workoutSet/workout-list";
import {
  useCreateSession,
  useRoutineDay,
  useUnits,
  useUpdateRoutineDay,
} from "@/hooks";
import { ListView } from '@/lib/types';
import type { WorkoutSessionWithData } from '@/lib/types';
import { Calendar, Loader2, Play, Trash2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const RoutineDayTab = ({
  dayId,
  currentSession,
  onDeleted,
}: {
  dayId: string;
  currentSession: WorkoutSessionWithData | null | undefined;
  onDeleted: () => void;
}) => {
  const navigate = useNavigate();
  const { data: routineDay } = useRoutineDay(dayId);
  const { data: units } = useUnits();

  const [description, setDescription] = useState("");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const updateDayMutation = useUpdateRoutineDay();
  const createSessionMutation = useCreateSession();

  // Sync local state when routineDay loads
  useEffect(() => {
    if (routineDay) {
      setDescription(routineDay.description);
      setWeekdays(routineDay.weekdays);
    }
  }, [routineDay]);

  const handleDescriptionBlur = async () => {
    if (routineDay && description !== routineDay.description) {
      await updateDayMutation.mutateAsync({
        id: dayId,
        description,
      });
    }
  };

  const handleWeekdaysChange = async (newWeekdays: number[]) => {
    setWeekdays(newWeekdays);
    if (routineDay) {
      await updateDayMutation.mutateAsync({
        id: dayId,
        weekdays: newWeekdays,
      });
    }
  };

  const handleStartWorkout = async () => {
    setIsStarting(true);
    try {
      const result = await createSessionMutation.mutateAsync({
        templateId: dayId,
      });
      if (result?.id) {
        navigate({ to: "/workout" });
      }
    } finally {
      setIsStarting(false);
    }
  };

  if (!routineDay || !units) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Day Settings */}
      <div className="px-6 py-4 border-b border-border/50 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="day-name" className="text-sm font-medium">
            Day Name
          </Label>
          <Input
            id="day-name"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescriptionBlur}
            placeholder="e.g., Chest & Triceps"
            className="h-10"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Schedule
          </Label>
          <WeekdaySelector
            selectedWeekdays={weekdays}
            onChange={handleWeekdaysChange}
          />
        </div>
      </div>

      {/* Workout List */}
      <div className="flex-1 overflow-y-auto px-6 min-h-0">
        <WorkoutList
          view={ListView.EditTemplate}
          sessionOrDayId={dayId}
          setGroups={routineDay.setGroups}
          units={units}
        />
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 border-t border-border/50 bg-muted/30 flex items-center justify-between gap-4">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setIsDeleting(true)}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Delete Day
        </Button>

        <Button
          onClick={handleStartWorkout}
          disabled={Boolean(currentSession) || isStarting}
          className="gap-2"
        >
          {isStarting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Starting...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Start Workout
            </>
          )}
        </Button>
      </div>

      <DeleteDayModal
        open={isDeleting}
        onClose={() => setIsDeleting(false)}
        dayId={dayId}
        onSuccess={onDeleted}
      />
    </div>
  );
};
