"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import type { WorkoutSetGroup } from "@/lib/convex-types";

export const DeleteSetGroupModal = ({
  open,
  onClose,
  setGroup,
}: {
  open: boolean;
  onClose: () => void;
  setGroup: WorkoutSetGroup;
}) => {
  const deleteSetGroup = useMutation(api.mutations.setGroups.remove);

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Exercise</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this exercise and its group of sets?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            No
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              await deleteSetGroup({ id: setGroup._id });
              onClose();
            }}
          >
            Yes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
