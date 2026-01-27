"use client";

import { WeekdaySelector } from "@/components/routines/WeekdaySelector";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { CalendarDays, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { RoutineDay, RoutineDayId, RoutineId } from "@/lib/convex-types";

export const EditDayModal = ({
  open,
  onClose,
  routineId,
  routineDay,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  routineId: RoutineId;
  routineDay?: RoutineDay;
  onSuccess?: (dayId: RoutineDayId) => void;
}) => {
  const [selectedWeekdays, setWeekdays] = useState<number[]>(
    routineDay?.weekdays ?? [],
  );
  const [description, setDescription] = useState(routineDay?.description ?? "");
  const [isPending, setIsPending] = useState(false);

  // Reset form when modal opens/closes or routineDay changes
  useEffect(() => {
    if (open) {
      setWeekdays(routineDay?.weekdays ?? []);
      setDescription(routineDay?.description ?? "");
    }
  }, [open, routineDay]);

  const createDay = useMutation(api.mutations.routineDays.create);
  const updateDay = useMutation(api.mutations.routineDays.update);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsPending(true);

    try {
      if (routineDay) {
        await updateDay({
          id: routineDay._id,
          description,
          weekdays: selectedWeekdays,
        });
        onSuccess?.(routineDay._id);
      } else {
        const newDayId = await createDay({
          routineId,
          description,
          weekdays: selectedWeekdays,
        });
        if (newDayId) {
          onSuccess?.(newDayId);
        }
      }

      onClose();
      setWeekdays([]);
      setDescription("");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
        <form onSubmit={onSubmit}>
          {/* Header with gradient */}
          <DialogHeader className="px-6 pt-6 pb-4 bg-linear-to-br from-accent/10 via-transparent to-primary/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-foreground/10 flex items-center justify-center">
                <CalendarDays className="h-5 w-5 text-primary dark:text-foreground" />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  {routineDay ? "Edit Workout Day" : "Add Workout Day"}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  {routineDay
                    ? "Update workout day details and schedule"
                    : "Create a new workout day for this routine"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Form Content */}
          <div className="px-6 py-5 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="workoutDay-name" className="text-sm font-medium">
                Day Name
              </Label>
              <Input
                id="workoutDay-name"
                name="description"
                placeholder="e.g., Chest & Triceps, Leg Day, Pull Day"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Schedule{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <p className="text-xs text-muted-foreground -mt-1">
                Select days of the week for this workout
              </p>

              <WeekdaySelector
                selectedWeekdays={selectedWeekdays}
                onChange={setWeekdays}
              />
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="px-6 py-4 bg-muted/30 border-t border-border/50">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="min-w-[100px]"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : routineDay ? (
                "Save Changes"
              ) : (
                "Add Day"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
