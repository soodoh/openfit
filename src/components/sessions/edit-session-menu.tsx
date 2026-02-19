/* eslint-disable eslint-plugin-import(prefer-default-export), eslint-plugin-unicorn(filename-case), typescript-eslint(explicit-module-boundary-types), typescript-eslint(no-restricted-types) */

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, MoreVertical, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { DeleteSessionModal } from "./delete-session-modal";
import { EditSessionModal } from "./edit-session-modal";
import type { WorkoutSessionWithData } from "@/lib/types";

enum Modal {
  EDIT = "edit",
  DELETE = "delete",
}

export const EditSessionMenu = ({
  session,
}: {
  session: WorkoutSessionWithData;
}) => {
  const [modal, setModal] = useState<Modal | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const handleClose = () => setModal(null);

  useEffect(() => {
    if (modal) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMenuOpen(false);
    }
  }, [modal]);

  return (
    <>
      <DeleteSessionModal
        open={modal === Modal.DELETE}
        onClose={handleClose}
        sessionId={session.id}
      />

      <EditSessionModal
        open={modal === Modal.EDIT}
        onClose={handleClose}
        session={session}
      />

      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label={`Edit actions for workout session ${session.id}`}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setModal(Modal.EDIT)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setModal(Modal.DELETE)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
