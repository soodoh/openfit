
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WorkoutList } from "@/components/workoutSet/WorkoutList";
import { useUpdateSession } from "@/hooks";
import { ListView, type Units, type WorkoutSessionWithData } from "@/lib/types";
import dayjs from "dayjs";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MessageSquare,
  Play,
  Square,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { CurrentDuration } from "./CurrentDuration";
import { EditSessionMenu } from "./EditSessionMenu";

export const CurrentSessionPage = ({
  session,
  units,
}: {
  session: WorkoutSessionWithData;
  units: Units;
}) => {
  const navigate = useNavigate();
  const updateSessionMutation = useUpdateSession();
  const [isEndSessionDialogOpen, setIsEndSessionDialogOpen] = useState(false);

  const completedSets = session.setGroups.reduce(
    (acc, group) => acc + group.sets.filter((set) => set.completed).length,
    0,
  );
  const totalSets = session.setGroups.reduce(
    (acc, group) => acc + group.sets.length,
    0,
  );

  const handleEndSession = async () => {
    await updateSessionMutation.mutateAsync({
      id: session.id,
      endTime: Date.now(),
    });
    setIsEndSessionDialogOpen(false);
    navigate({ to: "/logs" });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Header Section */}
      <div className="border-b border-border/50 bg-linear-to-b from-accent/5 to-transparent">
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-(--breakpoint-lg) py-6">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" asChild className="gap-2">
              <Link to="/logs">
                <ArrowLeft className="h-4 w-4" />
                Back to Logs
              </Link>
            </Button>
            <EditSessionMenu session={session} />
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-foreground/10 flex items-center justify-center shrink-0">
              <Play
                className="h-6 w-6 text-primary dark:text-foreground"
                fill="currentColor"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{dayjs(session.startTime).format("MMMM D, YYYY")}</span>
                <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">
                  In Progress
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight truncate">
                {session.name || "Workout Session"}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-(--breakpoint-lg) py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Duration Card */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
            <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-foreground/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary dark:text-foreground" />
            </div>
            <CurrentDuration startTime={session.startTime} />
          </div>

          {/* Progress Card */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <span className="text-sm font-bold text-accent-foreground">
                {totalSets > 0
                  ? Math.round((completedSets / totalSets) * 100)
                  : 0}
                %
              </span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Progress</p>
              <p className="text-sm font-semibold">
                {completedSets} / {totalSets} sets
              </p>
            </div>
          </div>

          {/* Notes Card */}
          {session.notes && (
            <div className="col-span-2 sm:col-span-1 flex items-start gap-3 p-4 rounded-xl bg-card border">
              <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="text-sm line-clamp-2">{session.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Workout List */}
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-(--breakpoint-lg)">
        <WorkoutList
          view={ListView.CurrentSession}
          sessionOrDayId={session.id}
          setGroups={session.setGroups}
          units={units}
        />
      </div>

      {/* End Session Button */}
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-(--breakpoint-lg) py-6">
        <Button
          variant="destructive"
          size="lg"
          className="w-full"
          onClick={() => setIsEndSessionDialogOpen(true)}
        >
          <Square className="h-4 w-4" />
          End Session
        </Button>
      </div>

      <Dialog
        open={isEndSessionDialogOpen}
        onOpenChange={setIsEndSessionDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Session?</DialogTitle>
            <DialogDescription>
              Are you sure you want to end this workout session?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEndSessionDialogOpen(false)}
            >
              No
            </Button>
            <Button
              variant="destructive"
              onClick={handleEndSession}
              disabled={updateSessionMutation.isPending}
            >
              Yes, End Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
