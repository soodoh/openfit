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
import { useDeleteSetGroup } from "@/hooks";
import type { WorkoutSetGroup } from "@/lib/types";

export const DeleteSetGroupModal = ({
  open,
  onClose,
  setGroup,
}: {
  open: boolean;
  onClose: () => void;
  setGroup: WorkoutSetGroup;
}) => {
  const deleteSetGroupMutation = useDeleteSetGroup();

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
              await deleteSetGroupMutation.mutateAsync(setGroup.id);
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
