"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/convex/_generated/api";
import { type WorkoutSessionWithData } from "@/lib/convex-types";
import { useMutation } from "convex/react";
import { format } from "date-fns";
import { Clock, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export const EditDurationPopover = ({
  session,
  formattedDuration,
}: {
  session: WorkoutSessionWithData;
  formattedDuration: string | null;
}) => {
  const [open, setOpen] = useState(false);
  const [startTime, setStartTime] = useState<Date | undefined>(
    session.startTime ? new Date(session.startTime) : undefined,
  );
  const [endTime, setEndTime] = useState<Date | undefined>(
    session.endTime ? new Date(session.endTime) : undefined,
  );
  const [startTimeValue, setStartTimeValue] = useState(
    session.startTime ? format(session.startTime, "HH:mm") : "00:00",
  );
  const [endTimeValue, setEndTimeValue] = useState(
    session.endTime ? format(session.endTime, "HH:mm") : "00:00",
  );
  const [isPending, setIsPending] = useState(false);
  const [editingField, setEditingField] = useState<"start" | "end">("start");
  const updateSession = useMutation(api.mutations.sessions.update);

  useEffect(() => {
    if (open) {
      setStartTime(session.startTime ? new Date(session.startTime) : undefined);
      setEndTime(session.endTime ? new Date(session.endTime) : undefined);
      setStartTimeValue(
        session.startTime ? format(session.startTime, "HH:mm") : "00:00",
      );
      setEndTimeValue(
        session.endTime ? format(session.endTime, "HH:mm") : "00:00",
      );
    }
  }, [open, session.startTime, session.endTime]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;

    if (editingField === "start") {
      const [hours, minutes] = startTimeValue.split(":").map(Number);
      selectedDate.setHours(hours, minutes, 0, 0);
      setStartTime(selectedDate);
    } else {
      const [hours, minutes] = endTimeValue.split(":").map(Number);
      selectedDate.setHours(hours, minutes, 0, 0);
      setEndTime(selectedDate);
    }
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTimeValue = e.target.value;
    setStartTimeValue(newTimeValue);
    if (startTime) {
      const [hours, minutes] = newTimeValue.split(":").map(Number);
      const newDate = new Date(startTime);
      newDate.setHours(hours, minutes, 0, 0);
      setStartTime(newDate);
    }
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTimeValue = e.target.value;
    setEndTimeValue(newTimeValue);
    if (endTime) {
      const [hours, minutes] = newTimeValue.split(":").map(Number);
      const newDate = new Date(endTime);
      newDate.setHours(hours, minutes, 0, 0);
      setEndTime(newDate);
    }
  };

  const handleSave = async () => {
    setIsPending(true);
    try {
      await updateSession({
        id: session._id,
        startTime: startTime?.getTime(),
        endTime: endTime?.getTime(),
      });
      setOpen(false);
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
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b">
          <div className="flex gap-2">
            <Button
              variant={editingField === "start" ? "default" : "outline"}
              size="sm"
              onClick={() => setEditingField("start")}
            >
              Start
            </Button>
            <Button
              variant={editingField === "end" ? "default" : "outline"}
              size="sm"
              onClick={() => setEditingField("end")}
            >
              End
            </Button>
          </div>
        </div>
        <Calendar
          mode="single"
          selected={editingField === "start" ? startTime : endTime}
          onSelect={handleDateSelect}
        />
        <div className="border-t p-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Start Time</Label>
              <Input
                type="time"
                value={startTimeValue}
                onChange={handleStartTimeChange}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">End Time</Label>
              <Input
                type="time"
                value={endTimeValue}
                onChange={handleEndTimeChange}
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
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
