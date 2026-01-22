"use client";

import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
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
import { AlertCircle, CalendarPlus, Loader2, Star, X } from "lucide-react";
import { useEffect, useState } from "react";
import { SelectTemplate } from "./SelectTemplate";
import type {
  RoutineDayWithRoutine,
  WorkoutSessionWithData,
} from "@/lib/convex-types";

export const EditSessionModal = ({
  session,
  open,
  onClose,
}: {
  open: boolean;
  session?: WorkoutSessionWithData;
  onClose: () => void;
}) => {
  const [name, setName] = useState<string>(session?.name ?? "");
  const [notes, setNotes] = useState<string>(session?.notes ?? "");
  const [impression, setImpression] = useState<number | null>(
    session?.impression ?? null,
  );
  const [startTime, setStartTime] = useState<Date | null>(
    session?.startTime ? new Date(session.startTime) : new Date(),
  );
  const [endTime, setEndTime] = useState<Date | null>(
    session?.endTime ? new Date(session.endTime) : null,
  );
  const [workoutTemplate, setWorkoutTemplate] =
    useState<RoutineDayWithRoutine | null>(null);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSession = useMutation(api.mutations.sessions.create);
  const updateSession = useMutation(api.mutations.sessions.update);

  // Reset form when modal opens/closes or session changes
  useEffect(() => {
    if (open) {
      setName(session?.name ?? "");
      setNotes(session?.notes ?? "");
      setImpression(session?.impression ?? null);
      setStartTime(
        session?.startTime ? new Date(session.startTime) : new Date(),
      );
      setEndTime(session?.endTime ? new Date(session.endTime) : null);
      setWorkoutTemplate(null);
      setHoveredStar(null);
      setError(null);
    }
  }, [open, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Must be null or valid date
    const isStartValid = startTime === null || !isNaN(startTime.getTime());
    const isEndValid = endTime === null || !isNaN(endTime.getTime());
    // Prevent negative durations (if both are valid dates)
    const isDurationValid =
      !startTime || !endTime || startTime.getTime() < endTime.getTime();

    if (!isStartValid || !isEndValid) {
      setError("Please enter valid dates");
      return;
    }
    if (!isDurationValid) {
      setError("End time must be after start time");
      return;
    }

    setIsPending(true);
    try {
      if (session) {
        await updateSession({
          id: session._id,
          name,
          startTime: startTime?.getTime(),
          endTime: endTime?.getTime() ?? undefined,
          notes,
          impression: impression ?? undefined,
        });
      } else {
        await createSession({
          templateId: workoutTemplate?._id,
          name,
          startTime: startTime?.getTime() ?? Date.now(),
          endTime: endTime?.getTime(),
          notes,
          impression: impression ?? undefined,
        });
      }
      onClose();
    } catch {
      setError("Failed to save session. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  const isEditing = !!session;
  const activeRating = hoveredStar ?? impression ?? 0;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
        <form onSubmit={handleSubmit}>
          {/* Header with gradient */}
          <DialogHeader className="px-6 pt-6 pb-4 bg-linear-to-br from-accent/10 via-transparent to-primary/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-foreground/10 flex items-center justify-center">
                <CalendarPlus className="h-5 w-5 text-primary dark:text-foreground" />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  {isEditing ? "Edit Session" : "New Session"}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  {isEditing
                    ? "Update your workout session details"
                    : "Create a new workout session to track your exercises"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Form Content */}
          <div className="px-6 py-5 space-y-5">
            {/* Template Selection */}
            {!isEditing && (
              <div className="space-y-2">
                <SelectTemplate
                  disabled={isEditing}
                  label="Start from a Routine"
                  value={workoutTemplate}
                  onChange={(selectedTemplate) => {
                    setWorkoutTemplate(selectedTemplate);
                    if (selectedTemplate?.description) {
                      setName(selectedTemplate.description);
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Select a routine to pre-populate exercises and sets, or leave
                  empty to start fresh
                </p>
              </div>
            )}

            {/* Session Name */}
            <div className="space-y-2">
              <Label htmlFor="session-name" className="text-sm font-medium">
                Session Name
              </Label>
              <Input
                id="session-name"
                name="name"
                placeholder="e.g., Morning Workout, Leg Day"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-11"
              />
            </div>

            {/* Time Pickers */}
            <div className="grid grid-cols-2 gap-3">
              <DateTimePicker
                label="Start Time"
                value={startTime}
                onChange={(newTime) => setStartTime(newTime)}
              />
              <DateTimePicker
                label="End Time"
                value={endTime}
                onChange={(newTime) => setEndTime(newTime)}
              />
            </div>

            {/* Rating */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                How did it feel?{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => {
                  const starValue = i + 1;
                  const isFilled = starValue <= activeRating;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setImpression(starValue)}
                      onMouseEnter={() => setHoveredStar(starValue)}
                      onMouseLeave={() => setHoveredStar(null)}
                      className="p-1 rounded-md transition-all duration-150 hover:scale-110 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-1"
                    >
                      <Star
                        className={`h-6 w-6 transition-colors ${
                          isFilled
                            ? "text-amber-400 fill-amber-400"
                            : "text-muted/40 hover:text-amber-300"
                        }`}
                      />
                    </button>
                  );
                })}
                {impression && (
                  <button
                    type="button"
                    onClick={() => setImpression(null)}
                    className="ml-2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="session-notes" className="text-sm font-medium">
                Notes{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <textarea
                id="session-notes"
                name="notes"
                placeholder="How did the workout go? Any PRs or things to remember?"
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive dark:text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
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
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Session"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
