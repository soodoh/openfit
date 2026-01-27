"use client";

import { DeleteDayModal } from "@/components/routines/DeleteDayModal";
import { DeleteRoutineModal } from "@/components/routines/DeleteRoutineModal";
import { EditDayModal } from "@/components/routines/EditDayModal";
import { EditRoutineModal } from "@/components/routines/EditRoutineModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import dayjs from "dayjs";
import {
  Calendar,
  ChevronRight,
  Edit,
  Layers,
  Loader2,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type {
  RoutineDay,
  RoutineDayId,
  RoutineWithDays,
  WorkoutSessionWithData,
} from "@/lib/convex-types";

export const RoutineOverviewTab = ({
  routine,
  currentSession,
  onSelectDay,
  onDayAdded,
}: {
  routine: RoutineWithDays;
  currentSession: WorkoutSessionWithData | null | undefined;
  onSelectDay: (dayId: RoutineDayId) => void;
  onDayAdded?: (dayId: RoutineDayId) => void;
}) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingDay, setIsAddingDay] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [startingDayId, setStartingDayId] = useState<RoutineDayId | null>(null);
  const [deletingDayId, setDeletingDayId] = useState<RoutineDayId | null>(null);

  const createSession = useMutation(api.mutations.sessions.create);

  const handleStartWorkout = async (dayId: RoutineDayId) => {
    setStartingDayId(dayId);
    try {
      const sessionId = await createSession({ templateId: dayId });
      if (sessionId) {
        router.push("/workout");
      }
    } finally {
      setStartingDayId(null);
    }
  };

  const handleDayAdded = (dayId: RoutineDayId) => {
    onDayAdded?.(dayId);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Routine Header */}
      <div className="px-6 py-5 border-b border-border/50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold truncate">{routine.name}</h2>
            {routine.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {routine.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                <span>
                  {routine.routineDays.length}{" "}
                  {routine.routineDays.length === 1 ? "day" : "days"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Updated {dayjs(routine.updatedAt).fromNow()}</span>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="gap-2 shrink-0"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Days List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {routine.routineDays.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Layers className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-muted-foreground mb-1">
              No workout days yet
            </h3>
            <p className="text-sm text-muted-foreground/70 text-center mb-4">
              Add your first workout day to get started
            </p>
            <Button onClick={() => setIsAddingDay(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Workout Day
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {routine.routineDays.map((day, index) => (
              <DayListItem
                key={day._id}
                day={day}
                index={index}
                currentSession={currentSession}
                isStarting={startingDayId === day._id}
                onSelect={() => onSelectDay(day._id)}
                onStartWorkout={() => handleStartWorkout(day._id)}
                onDelete={() => setDeletingDayId(day._id)}
              />
            ))}
          </div>
        )}
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
          Delete Routine
        </Button>

        {routine.routineDays.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddingDay(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Day
          </Button>
        )}
      </div>

      {/* Modals */}
      <EditRoutineModal
        open={isEditing}
        onClose={() => setIsEditing(false)}
        routine={routine}
      />
      <EditDayModal
        open={isAddingDay}
        onClose={() => setIsAddingDay(false)}
        routineId={routine._id}
        onSuccess={handleDayAdded}
      />
      <DeleteRoutineModal
        open={isDeleting}
        onClose={() => setIsDeleting(false)}
        routineId={routine._id}
      />
      {deletingDayId && (
        <DeleteDayModal
          open={!!deletingDayId}
          onClose={() => setDeletingDayId(null)}
          dayId={deletingDayId}
        />
      )}
    </div>
  );
};

const DayListItem = ({
  day,
  index,
  currentSession,
  isStarting,
  onSelect,
  onStartWorkout,
  onDelete,
}: {
  day: RoutineDay;
  index: number;
  currentSession: WorkoutSessionWithData | null | undefined;
  isStarting: boolean;
  onSelect: () => void;
  onStartWorkout: () => void;
  onDelete: () => void;
}) => {
  return (
    <div className="group flex items-center gap-3 p-4 hover:bg-accent/30 transition-colors">
      {/* Day Number Indicator */}
      <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 dark:bg-foreground/10 flex items-center justify-center">
        <span className="text-sm font-semibold text-primary dark:text-foreground">
          {index + 1}
        </span>
      </div>

      {/* Main Content - Clickable to open day tab */}
      <button onClick={onSelect} className="flex-1 min-w-0 text-left">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-foreground truncate">
              {day.description}
            </h4>
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
          {day.weekdays.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {day.weekdays.map((weekday) => (
                <Badge
                  key={`${day._id}-weekday-${weekday}`}
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-5 font-medium border-border/50 text-muted-foreground"
                >
                  {dayjs().day(weekday).format("ddd")}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </button>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onStartWorkout();
          }}
          disabled={!!currentSession || isStarting}
          className="gap-2"
        >
          {isStarting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Play className="h-4 w-4" />
              Start
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
