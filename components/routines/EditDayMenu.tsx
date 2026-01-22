"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { Edit, Play, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { DeleteDayModal } from "./DeleteDayModal";
import { EditDayModal } from "./EditDayModal";
import type { RoutineDay, WorkoutSessionWithData } from "@/lib/convex-types";

enum Modal {
  EDIT = "edit",
  DELETE = "delete",
}

export const EditDayMenu = ({
  routineDay,
  currentSession,
  icon,
}: {
  routineDay: RoutineDay;
  currentSession: WorkoutSessionWithData | null | undefined;
  icon?: ReactNode;
}) => {
  const router = useRouter();
  const [modal, setModal] = useState<Modal | null>(null);
  const handleClose = () => setModal(null);

  const createSession = useMutation(api.mutations.sessions.create);

  return (
    <>
      <EditDayModal
        open={modal === Modal.EDIT}
        onClose={handleClose}
        routineDay={routineDay}
        routineId={routineDay.routineId}
      />
      <DeleteDayModal
        open={modal === Modal.DELETE}
        onClose={handleClose}
        dayId={routineDay._id}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Actions for ${routineDay.description}`}
            className="h-8 w-8 opacity-0 group-hover/item:opacity-70 hover:opacity-100! transition-opacity shrink-0"
          >
            {icon}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            onClick={async () => {
              const session = await createSession({
                templateId: routineDay._id,
              });
              if (session) {
                router.push(`/logs/${session}`);
              }
            }}
            disabled={!!currentSession}
            className="cursor-pointer gap-2"
          >
            <Play className="h-4 w-4" />
            Start Workout
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setModal(Modal.EDIT)}
            className="cursor-pointer gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Day
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setModal(Modal.DELETE)}
            className="cursor-pointer gap-2 text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete Day
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
