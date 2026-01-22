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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { AlertCircle, Dumbbell, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { EquipmentSelector } from "./EquipmentSelector";
import type { EquipmentId, Gym } from "@/lib/convex-types";

interface GymFormModalProps {
  open: boolean;
  onClose: () => void;
  gym?: Gym;
}

export function GymFormModal({ open, onClose, gym }: GymFormModalProps) {
  const createGym = useMutation(api.mutations.gyms.create);
  const updateGym = useMutation(api.mutations.gyms.update);

  const [name, setName] = useState("");
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<
    EquipmentId[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const isEditMode = !!gym;

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      if (gym) {
        setName(gym.name);
        setSelectedEquipmentIds(gym.equipmentIds);
      } else {
        setName("");
        setSelectedEquipmentIds([]);
      }
      setError(null);
    }
  }, [open, gym]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Gym name is required");
      return;
    }

    if (selectedEquipmentIds.length === 0) {
      setError("Select at least one piece of equipment");
      return;
    }

    setIsPending(true);

    try {
      if (gym) {
        await updateGym({
          id: gym._id,
          name: name.trim(),
          equipmentIds: selectedEquipmentIds,
        });
      } else {
        await createGym({
          name: name.trim(),
          equipmentIds: selectedEquipmentIds,
        });
      }
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${gym ? "update" : "create"} gym`,
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <DialogHeader className="pb-4 bg-linear-to-br from-accent/10 via-transparent to-primary/5 -mx-6 -mt-6 px-6 pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-foreground/10 flex items-center justify-center">
                <Dumbbell className="h-5 w-5 text-primary dark:text-foreground" />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  {isEditMode ? "Edit Gym" : "Create New Gym"}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  {isEditMode
                    ? "Update your gym configuration"
                    : "Add a new gym with available equipment"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-0">
            <div className="space-y-2">
              <Label htmlFor="gym-name" className="text-sm font-medium">
                Gym Name
              </Label>
              <Input
                id="gym-name"
                placeholder="e.g., Home Gym, Planet Fitness"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Equipment</Label>
              <p className="text-xs text-muted-foreground">
                Select the equipment available at this gym
              </p>
              <EquipmentSelector
                selectedIds={selectedEquipmentIds}
                onSelectionChange={setSelectedEquipmentIds}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                {error}
              </p>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-border/50">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="min-w-[100px]"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEditMode ? (
                "Save Changes"
              ) : (
                "Save Gym"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
