import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import dayjs from "dayjs";
import { Minus, Pause, Play, Plus, RotateCcw, Timer, X } from "lucide-react";
import { useTimer } from "react-timer-hook";

export const RestTimer = ({
  open,
  setOpen,
  totalSeconds,
  setTotalSeconds,
  timer,
}: {
  open: boolean;
  setOpen: (isOpen: boolean) => void;
  totalSeconds: number;
  setTotalSeconds: (seconds: number) => void;
  timer: ReturnType<typeof useTimer>;
}) => {
  const {
    isRunning,
    totalSeconds: remainingSeconds,
    start,
    pause,
    restart,
  } = timer;
  const percentage = (remainingSeconds / totalSeconds) * 100;
  const circumference = 2 * Math.PI * 45;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 bg-linear-to-br from-primary/10 via-transparent to-accent/5">
            <DialogTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-primary" />
              Rest Timer
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-8">
            <div className="relative flex justify-center items-center">
              {/* Background circle */}
              <svg
                className="w-52 h-52 transform -rotate-90"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  className="text-muted/30"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - percentage / 100)}
                  className="text-primary transition-all duration-1000 ease-linear"
                  strokeLinecap="round"
                />
              </svg>

              {/* Timer content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-5xl font-bold tabular-nums tracking-tight">
                  {dayjs.duration(remainingSeconds, "seconds").format("m:ss")}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isRunning ? "remaining" : "paused"}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <Button
                size="icon"
                variant="outline"
                className="h-12 w-12 rounded-full"
                onClick={() => {
                  setTotalSeconds(Math.max(10, totalSeconds - 10));
                  restart(
                    dayjs()
                      .add(Math.max(0, remainingSeconds - 10), "seconds")
                      .toDate(),
                    isRunning,
                  );
                }}
              >
                <Minus className="h-5 w-5" />
              </Button>

              <Button
                size="icon"
                className="h-16 w-16 rounded-full"
                onClick={() => {
                  if (isRunning) {
                    pause();
                  } else {
                    start();
                  }
                }}
              >
                {isRunning ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-0.5" />
                )}
              </Button>

              <Button
                size="icon"
                variant="outline"
                className="h-12 w-12 rounded-full"
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
                <Plus className="h-5 w-5" />
              </Button>
            </div>

            {/* Quick actions */}
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => {
                  restart(dayjs().add(totalSeconds, "seconds").toDate(), true);
                }}
              >
                <RotateCcw className="h-4 w-4 mr-1.5" />
                Reset
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => {
                  setOpen(false);
                  restart(dayjs().add(totalSeconds, "seconds").toDate(), false);
                }}
              >
                <X className="h-4 w-4 mr-1.5" />
                Skip
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating timer button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 h-9 px-3 rounded-full bg-card border shadow-xs hover:shadow-md transition-shadow"
      >
        <Timer className="h-4 w-4 text-muted-foreground" />
        {remainingSeconds > 0 && (
          <span className="text-sm font-medium tabular-nums">
            {dayjs.duration(remainingSeconds, "seconds").format("m:ss")}
          </span>
        )}
        {isRunning && remainingSeconds > 0 && (
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        )}
      </button>
    </>
  );
};
