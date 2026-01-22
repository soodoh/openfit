import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WorkoutList } from "@/components/workoutSet/WorkoutList";
import { api } from "@/convex/_generated/api";
import { ListView, type Units } from "@/lib/convex-types";
import { useQuery } from "convex/react";
import dayjs from "dayjs";
import { Activity, Calendar as CalendarIcon, CheckCircle2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { DeleteSessionModal } from "./DeleteSessionModal";
import { EditDurationPopover } from "./EditDurationPopover";
import { EditNamePopover } from "./EditNamePopover";
import { EditNotesPopover } from "./EditNotesPopover";
import { EditRatingPopover } from "./EditRatingPopover";
import type { Id } from "@/convex/_generated/dataModel";

export const SessionDetailModal = ({
  sessionId,
  units,
  open,
  onClose,
  isActive = false,
}: {
  sessionId: Id<"workoutSessions"> | null;
  units: Units;
  open: boolean;
  onClose: () => void;
  isActive?: boolean;
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch full session data when modal is open
  const session = useQuery(
    api.queries.sessions.get,
    sessionId ? { id: sessionId } : "skip",
  );

  if (!sessionId || !session) {
    return (
      <Dialog open={open} onOpenChange={() => onClose()}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogTitle className="sr-only">Loading session</DialogTitle>
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Loading session...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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
          <DialogHeader className="px-6 pt-6 pb-4 bg-linear-to-br from-accent/10 via-transparent to-primary/5 shrink-0">
            <div className="flex items-start gap-4 pr-8">
              <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-foreground/10 flex items-center justify-center shrink-0">
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
              <EditDurationPopover
                session={session}
                formattedDuration={formatDuration()}
              />

              {/* Rating Card */}
              <EditRatingPopover session={session} />

              {/* Notes Card */}
              <EditNotesPopover session={session} />
            </div>

            {/* Exercise/Set Stats Card */}
            {session.setGroups.length > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-card border mb-4">
                <div className="w-9 h-9 rounded-lg bg-primary/10 dark:bg-foreground/10 flex items-center justify-center shrink-0">
                  <Activity className="h-4 w-4 text-primary dark:text-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground leading-none mb-1">
                    Workout
                  </p>
                  <p className="text-sm font-semibold leading-none">
                    {session.setGroups.length} {session.setGroups.length === 1 ? "exercise" : "exercises"} • {session.setGroups.reduce((acc, group) => acc + group.sets.length, 0)} {session.setGroups.reduce((acc, group) => acc + group.sets.length, 0) === 1 ? "set" : "sets"}
                  </p>
                </div>
              </div>
            )}

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
            <div className="pt-4">
              <Button
                variant="destructive"
                onClick={() => setShowDeleteModal(true)}
                className="w-full gap-2"
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
