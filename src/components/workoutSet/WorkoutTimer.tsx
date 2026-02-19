import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProgressCircle } from "@/components/ui/progress-circle";
import { useCountdownTimer } from "@/hooks";
import dayjs from "dayjs";
import { Pause, Play, Plus, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import type { SetWithRelations } from "@/lib/types";

export const WorkoutTimer = ({
  set,
  onComplete,
}: {
  set: SetWithRelations;
  onComplete: () => Promise<void>;
}) => {
  const [isTimerOpen, setTimerOpen] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState<number>(set.reps);
  const expiryTimestamp = dayjs().add(totalSeconds, "seconds").toDate();
  const {
    isRunning,
    totalSeconds: remainingSeconds,
    start,
    pause,
    restart,
  } = useCountdownTimer({
    expiryTimestamp,
    autoStart: false,
  });
  const percentage = !totalSeconds
    ? 0
    : (remainingSeconds / totalSeconds) * 100;

  useEffect(() => {
    setTotalSeconds(set.reps);
    restart(dayjs().add(set.reps, "seconds").toDate(), false);
  }, [restart, set.reps]);

  useEffect(() => {
    if (isTimerOpen) {
      start();
    }
  }, [isTimerOpen, start]);

  return (
    <>
      <Dialog open={isTimerOpen} onOpenChange={setTimerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Workout Timer</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center p-6">
            <ProgressCircle value={percentage} size={200} className="relative">
              <div className="flex flex-col items-center gap-4">
                <div className="text-3xl font-bold">
                  {dayjs.duration(remainingSeconds, "seconds").format("mm:ss")}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setTotalSeconds(Math.max(0, totalSeconds - 10));
                      restart(
                        dayjs()
                          .add(Math.max(0, remainingSeconds - 10), "seconds")
                          .toDate(),
                        isRunning,
                      );
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (isRunning) {
                        pause();
                      } else {
                        start();
                      }
                    }}
                  >
                    {isRunning ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => {
                      setTotalSeconds(totalSeconds + 10);
                      restart(
                        dayjs()
                          .add(remainingSeconds + 10, "seconds")
                          .toDate(),
                        isRunning,
                      );
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </ProgressCircle>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTimerOpen(false)}>
              Close
            </Button>
            <Button
              onClick={async () => {
                setTimerOpen(false);
                await onComplete();
              }}
            >
              Mark as Completed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTimerOpen(!isTimerOpen)}
          className="relative h-10 w-10"
        >
          {!isRunning && remainingSeconds < totalSeconds ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Timer className="h-4 w-4" />
          )}
          <ProgressCircle
            value={percentage}
            size={40}
            strokeWidth={2}
            className="absolute inset-0 text-gray-500"
          />
        </Button>
      </div>
    </>
  );
};
