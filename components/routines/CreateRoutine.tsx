"use client";

import { EditRoutineModal as CreateRoutineModal } from "@/components/routines/EditRoutineModal";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";
import { useState } from "react";

interface CreateRoutineProps {
  variant?: "default" | "empty-state";
}

export const CreateRoutine = ({ variant = "default" }: CreateRoutineProps) => {
  const [showEditModal, setEditModal] = useState(false);

  if (variant === "empty-state") {
    return (
      <>
        <Button
          onClick={() => setEditModal(true)}
          size="lg"
          className="gap-2 shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90"
        >
          <Sparkles className="h-5 w-5" />
          Create Your First Routine
        </Button>

        <CreateRoutineModal
          open={showEditModal}
          onClose={() => setEditModal(false)}
        />
      </>
    );
  }

  return (
    <>
      <Button
        onClick={() => setEditModal(true)}
        className="gap-2 shadow-xs hover:shadow-md transition-all duration-200"
      >
        <Plus className="h-4 w-4" />
        New Routine
      </Button>

      <CreateRoutineModal
        open={showEditModal}
        onClose={() => setEditModal(false)}
      />
    </>
  );
};
