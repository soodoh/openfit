"use client";

import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/convex/_generated/api";
import { type WorkoutSessionWithData } from "@/lib/convex-types";
import { useMutation } from "convex/react";
import { AlertCircle, Clock, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export const EditDurationPopover = ({
  session,
  formattedDuration,
}: {
  session: WorkoutSessionWithData;
  formattedDuration: string | null;
}) => {
  const [open, setOpen] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(
    session.startTime ? new Date(session.startTime) : null,
  );
  const [endTime, setEndTime] = useState<Date | null>(
    session.endTime ? new Date(session.endTime) : null,
  );
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateSession = useMutation(api.mutations.sessions.update);

  useEffect(() => {
    if (open) {
      setStartTime(session.startTime ? new Date(session.startTime) : null);
      setEndTime(session.endTime ? new Date(session.endTime) : null);
      setError(null);
    }
  }, [open, session.startTime, session.endTime]);

  const handleSave = async () => {
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
      await updateSession({
        id: session._id,
        startTime: startTime?.getTime(),
        endTime: endTime?.getTime(),
      });
      setOpen(false);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-3 p-3 rounded-xl bg-card border hover:bg-accent/50 transition-colors text-left w-full h-full">
          <div className="w-9 h-9 rounded-lg bg-primary/10 dark:bg-foreground/10 flex items-center justify-center shrink-0">
            <Clock className="h-4 w-4 text-primary dark:text-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground leading-none mb-1">
              Duration
            </p>
            <p className="text-sm font-semibold leading-none">
              {formattedDuration ?? "—"}
            </p>
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
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
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive dark:text-red-400 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
