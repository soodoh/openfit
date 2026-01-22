"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { WorkoutList } from "@/components/workoutSet/WorkoutList";
import { api } from "@/convex/_generated/api";
import {
  ListView,
  type Units,
  type WorkoutSessionWithData,
} from "@/lib/convex-types";
import { useMutation } from "convex/react";
import { format } from "date-fns";
import dayjs from "dayjs";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Loader2,
  MessageSquare,
  Pencil,
  Star,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DeleteSessionModal } from "./DeleteSessionModal";

export const SessionDetailModal = ({
  session,
  units,
  open,
  onClose,
  isActive = false,
}: {
  session: WorkoutSessionWithData | null;
  units: Units;
  open: boolean;
  onClose: () => void;
  isActive?: boolean;
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!session) return null;

  const durationDate =
    session.startTime && session.endTime
      ? dayjs.duration(dayjs(session.endTime).diff(dayjs(session.startTime)))
      : null;

  const formatDuration = () => {
    if (!durationDate) return null;
    const hours = durationDate.hours();
    const mins = durationDate.minutes();
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins} min`;
  };

  const handleDeleteSuccess = () => {
    setShowDeleteModal(false);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={() => onClose()}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] p-0 overflow-hidden flex flex-col">
          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-br from-accent/10 via-transparent to-primary/5 shrink-0">
            <div className="flex items-start gap-4 pr-8">
              <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-foreground/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-6 w-6 text-primary dark:text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  <span>{dayjs(session.startTime).format("MMMM D, YYYY")}</span>
                  {isActive && (
                    <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                      In Progress
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl font-bold tracking-tight truncate">
                    {session.name || "Workout Session"}
                  </DialogTitle>
                  <EditNamePopover session={session} />
                </div>
                <DialogDescription className="sr-only">
                  View workout session details
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3 py-4">
              {/* Duration Card */}
              <EditDurationPopover session={session} formattedDuration={formatDuration()} />

              {/* Rating Card */}
              <EditRatingPopover session={session} />

              {/* Notes Card */}
              <EditNotesPopover session={session} />
            </div>

            {/* Continue Workout for active sessions */}
            {isActive && (
              <div className="pb-4">
                <Button asChild className="w-full">
                  <Link href={`/logs/${session._id}`}>Continue Workout</Link>
                </Button>
              </div>
            )}

            {/* Workout List */}
            <div className="pt-2 border-t">
              <WorkoutList
                view={isActive ? ListView.CurrentSession : ListView.ViewSession}
                sessionOrDayId={session._id}
                setGroups={session.setGroups}
                units={units}
              />
            </div>

            {/* Delete Button */}
            <div className="pt-6 mt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(true)}
                className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
              >
                <Trash2 className="h-4 w-4" />
                Delete Session
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <DeleteSessionModal
        open={showDeleteModal}
        onClose={handleDeleteSuccess}
        sessionId={session._id}
      />
    </>
  );
};

// Edit Name Popover
const EditNamePopover = ({ session }: { session: WorkoutSessionWithData }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(session.name);
  const [isPending, setIsPending] = useState(false);
  const updateSession = useMutation(api.mutations.sessions.update);

  useEffect(() => {
    if (open) {
      setName(session.name);
    }
  }, [open, session.name]);

  const handleSave = async () => {
    setIsPending(true);
    try {
      await updateSession({ id: session._id, name });
      setOpen(false);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <Label htmlFor="edit-name">Session Name</Label>
          <Input
            id="edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Morning Workout"
          />
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
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Edit Duration Popover
const EditDurationPopover = ({
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
      setStartTime(
        session.startTime ? new Date(session.startTime) : undefined,
      );
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
        <button className="flex items-center gap-3 p-3 rounded-xl bg-card border hover:bg-accent/50 transition-colors text-left w-full">
          <div className="w-9 h-9 rounded-lg bg-primary/10 dark:bg-foreground/10 flex items-center justify-center">
            <Clock className="h-4 w-4 text-primary dark:text-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="text-sm font-semibold">{formattedDuration ?? "—"}</p>
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
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Edit Rating Popover
const EditRatingPopover = ({
  session,
}: {
  session: WorkoutSessionWithData;
}) => {
  const [open, setOpen] = useState(false);
  const [impression, setImpression] = useState<number | null>(
    session.impression ?? null,
  );
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [isPending, setIsPending] = useState(false);
  const updateSession = useMutation(api.mutations.sessions.update);

  useEffect(() => {
    if (open) {
      setImpression(session.impression ?? null);
      setHoveredStar(null);
    }
  }, [open, session.impression]);

  const handleSave = async () => {
    setIsPending(true);
    try {
      await updateSession({
        id: session._id,
        impression: impression ?? undefined,
      });
      setOpen(false);
    } finally {
      setIsPending(false);
    }
  };

  const activeRating = hoveredStar ?? impression ?? 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-3 p-3 rounded-xl bg-card border hover:bg-accent/50 transition-colors text-left w-full">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Star
              className={`h-4 w-4 ${session.impression ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Rating</p>
            {session.impression ? (
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < session.impression!
                        ? "text-amber-400 fill-amber-400"
                        : "text-muted/40"
                    }`}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm font-semibold">—</p>
            )}
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto" align="center">
        <div className="space-y-3">
          <Label>How did it feel?</Label>
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
                  className="p-1 rounded-md transition-all duration-150 hover:scale-110"
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
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Edit Notes Popover
const EditNotesPopover = ({
  session,
}: {
  session: WorkoutSessionWithData;
}) => {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(session.notes ?? "");
  const [isPending, setIsPending] = useState(false);
  const updateSession = useMutation(api.mutations.sessions.update);

  useEffect(() => {
    if (open) {
      setNotes(session.notes ?? "");
    }
  }, [open, session.notes]);

  const handleSave = async () => {
    setIsPending(true);
    try {
      await updateSession({ id: session._id, notes });
      setOpen(false);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-start gap-3 p-3 rounded-xl bg-card border hover:bg-accent/50 transition-colors text-left w-full">
          <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Notes</p>
            {session.notes ? (
              <p className="text-sm line-clamp-2">{session.notes}</p>
            ) : (
              <p className="text-sm font-semibold">—</p>
            )}
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <Label htmlFor="edit-notes">Notes</Label>
          <textarea
            id="edit-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did the workout go?"
            rows={4}
            className="flex w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          />
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
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
