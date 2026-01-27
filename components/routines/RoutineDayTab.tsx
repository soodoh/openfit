"use client";

import { DeleteDayModal } from "@/components/routines/DeleteDayModal";
import { WeekdaySelector } from "@/components/routines/WeekdaySelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WorkoutList } from "@/components/workoutSet/WorkoutList";
import { api } from "@/convex/_generated/api";
import {
  ListView,
  type RoutineDayId,
  type WorkoutSessionWithData,
} from "@/lib/convex-types";
import { useMutation, useQuery } from "convex/react";
import { Calendar, Loader2, Play, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export const RoutineDayTab = ({
  dayId,
  currentSession,
  onDeleted,
}: {
  dayId: RoutineDayId;
  currentSession: WorkoutSessionWithData | null | undefined;
  onDeleted: () => void;
}) => {
  const router = useRouter();
  const routineDay = useQuery(api.queries.routineDays.get, { id: dayId });
  const units = useQuery(api.queries.units.list);

  const [description, setDescription] = useState("");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const updateDay = useMutation(api.mutations.routineDays.update);
  const createSession = useMutation(api.mutations.sessions.create);

  // Sync local state when routineDay loads
  useEffect(() => {
    if (routineDay) {
      setDescription(routineDay.description);
      setWeekdays(routineDay.weekdays);
    }
  }, [routineDay]);

  const handleDescriptionBlur = async () => {
    if (routineDay && description !== routineDay.description) {
      await updateDay({
        id: dayId,
        description,
      });
    }
  };

  const handleWeekdaysChange = async (newWeekdays: number[]) => {
    setWeekdays(newWeekdays);
    if (routineDay) {
      await updateDay({
        id: dayId,
        weekdays: newWeekdays,
      });
    }
  };

  const handleStartWorkout = async () => {
    setIsStarting(true);
    try {
      const sessionId = await createSession({ templateId: dayId });
      if (sessionId) {
        router.push("/workout");
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
          disabled={!!currentSession || isStarting}
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
