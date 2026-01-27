"use client";

import { CurrentSessionPage } from "@/components/sessions/CurrentSessionPage";
import { EditSessionModal } from "@/components/sessions/EditSessionModal";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Dumbbell, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Page() {
  return <WorkoutPageContent />;
}

function WorkoutPageContent() {
  const router = useRouter();
  const currentSession = useQuery(api.queries.sessions.getCurrent);
  const units = useQuery(api.queries.units.list);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);

  const handleModalClose = () => {
    setShowNewSessionModal(false);
  };

  // Loading state
  if (currentSession === undefined || units === undefined) {
    return (
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-(--breakpoint-lg) mt-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // No active session - show empty state with option to start
  if (!currentSession) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-(--breakpoint-sm)">
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-linear-to-br from-primary/10 to-accent/20 dark:from-primary/20 dark:to-accent/30 flex items-center justify-center mx-auto mb-6">
              <Dumbbell className="w-10 h-10 text-primary/70 dark:text-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">No Active Workout</h1>
            <p className="text-muted-foreground mb-6">
              Start a new workout session to begin tracking your exercises.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => setShowNewSessionModal(true)}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                Start New Workout
              </Button>
              <Button variant="outline" onClick={() => router.push("/")}>
                Back to Dashboard
              </Button>
            </div>
          </div>
          <EditSessionModal
            open={showNewSessionModal}
            onClose={handleModalClose}
          />
        </div>
      </div>
    );
  }

  return <CurrentSessionPage session={currentSession} units={units} />;
}
