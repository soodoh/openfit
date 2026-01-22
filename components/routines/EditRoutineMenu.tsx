"use client";

import { EditRoutineModal } from "@/components/routines/EditRoutineModal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, MoreVertical, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { DeleteRoutineModal } from "./DeleteRoutineModal";
import { EditDayModal as AddDayModal } from "./EditDayModal";
import type { Routine } from "@/lib/convex-types";

enum Modal {
  EDIT = "edit",
  ADD = "add",
  DELETE = "delete",
}

export const EditRoutineMenu = ({ routine }: { routine: Routine }) => {
  const [modal, setModal] = useState<Modal | null>(null);
  const handleClose = () => setModal(null);

  return (
    <>
      <AddDayModal
        open={modal === Modal.ADD}
        onClose={handleClose}
        routineId={routine._id}
      />
      <EditRoutineModal
        open={modal === Modal.EDIT}
        onClose={handleClose}
        routine={routine}
      />
      <DeleteRoutineModal
        open={modal === Modal.DELETE}
        onClose={handleClose}
        routineId={routine._id}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Edit routine: ${routine.name}`}
            className="h-8 w-8 opacity-70 hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={() => setModal(Modal.ADD)}
            className="cursor-pointer gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Workout Day
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setModal(Modal.EDIT)}
            className="cursor-pointer gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Routine
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setModal(Modal.DELETE)}
            className="cursor-pointer gap-2 text-destructive focus:text-destructive dark:text-red-400 dark:focus:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
            Delete Routine
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
