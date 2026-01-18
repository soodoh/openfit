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
import { Edit, MoreVertical, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { DeleteGymModal } from "./DeleteGymModal";
import { GymFormModal } from "./GymFormModal";
import type { Gym } from "@/lib/convex-types";

enum Modal {
  EDIT = "edit",
  DELETE = "delete",
}

interface GymMenuProps {
  gym: Gym;
  isDefault?: boolean;
}

export function GymMenu({ gym, isDefault = false }: GymMenuProps) {
  const [modal, setModal] = useState<Modal | null>(null);
  const handleClose = () => setModal(null);
  const setDefaultGym = useMutation(api.mutations.userProfiles.setDefaultGym);

  const handleSetDefault = async () => {
    await setDefaultGym({ gymId: gym._id });
  };

  return (
    <>
      <GymFormModal
        open={modal === Modal.EDIT}
        onClose={handleClose}
        gym={gym}
      />
      <DeleteGymModal
        open={modal === Modal.DELETE}
        onClose={handleClose}
        gym={gym}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Edit gym: ${gym.name}`}
            className="h-8 w-8 opacity-70 hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {!isDefault && (
            <DropdownMenuItem
              onClick={handleSetDefault}
              className="cursor-pointer gap-2"
            >
              <Star className="h-4 w-4" />
              Set as Default
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => setModal(Modal.EDIT)}
            className="cursor-pointer gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setModal(Modal.DELETE)}
            className="cursor-pointer gap-2 text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
