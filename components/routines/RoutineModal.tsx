"use client";

import { RoutineDayTab } from "@/components/routines/RoutineDayTab";
import { RoutineOverviewTab } from "@/components/routines/RoutineOverviewTab";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo, useState } from "react";
import type {
  RoutineDayId,
  RoutineWithDays,
  WorkoutSessionWithData,
} from "@/lib/convex-types";

const OVERVIEW_TAB = "overview";

export const RoutineModal = ({
  open,
  onClose,
  routine,
  currentSession,
  initialTab,
}: {
  open: boolean;
  onClose: () => void;
  routine: RoutineWithDays;
  currentSession: WorkoutSessionWithData | null | undefined;
  initialTab?: string;
}) => {
  const [activeTab, setActiveTab] = useState(initialTab || OVERVIEW_TAB);

  // Compute valid tab - if current tab doesn't exist, show overview
  const validTab = useMemo(() => {
    if (activeTab === OVERVIEW_TAB) return OVERVIEW_TAB;
    const dayExists = routine.routineDays.some(
      (day) => `day-${day._id}` === activeTab,
    );
    return dayExists ? activeTab : OVERVIEW_TAB;
  }, [activeTab, routine.routineDays]);

  const handleSelectDay = (dayId: RoutineDayId) => {
    setActiveTab(`day-${dayId}`);
  };

  const handleDayAdded = (dayId: RoutineDayId) => {
    // Auto-switch to the newly created day tab
    setActiveTab(`day-${dayId}`);
  };

  const handleDayDeleted = () => {
    // Switch back to overview when a day is deleted
    setActiveTab(OVERVIEW_TAB);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    } else {
      // Reset to initial tab when opening
      setActiveTab(initialTab || OVERVIEW_TAB);
    }
  };

  const truncateName = (name: string, maxLength = 15) => {
    if (name.length <= maxLength) return name;
    return `${name.slice(0, maxLength)}...`;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden max-h-[85vh] flex flex-col">
        <DialogTitle className="sr-only">{routine.name}</DialogTitle>

        <Tabs
          value={validTab}
          onValueChange={setActiveTab}
          className="flex flex-col h-full"
        >
          {/* Tab List - Horizontally scrollable */}
          <div className="border-b border-border/50 px-4 pt-4">
            <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 overflow-x-auto flex-nowrap">
              <TabsTrigger
                value={OVERVIEW_TAB}
                className="shrink-0 data-[state=active]:bg-background"
              >
                Overview
              </TabsTrigger>

              {routine.routineDays.map((day, index) => (
                <TabsTrigger
                  key={day._id}
                  value={`day-${day._id}`}
                  className="shrink-0 data-[state=active]:bg-background"
                >
                  Day {index + 1}: {truncateName(day.description)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            <TabsContent
              value={OVERVIEW_TAB}
              className="h-full m-0 data-[state=inactive]:hidden"
            >
              <RoutineOverviewTab
                routine={routine}
                currentSession={currentSession}
                onSelectDay={handleSelectDay}
                onDayAdded={handleDayAdded}
              />
            </TabsContent>

            {routine.routineDays.map((day) => (
              <TabsContent
                key={day._id}
                value={`day-${day._id}`}
                className="h-full m-0 data-[state=inactive]:hidden"
              >
                <RoutineDayTab
                  dayId={day._id}
                  currentSession={currentSession}
                  onDeleted={handleDayDeleted}
                />
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
