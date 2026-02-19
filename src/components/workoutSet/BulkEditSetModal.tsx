
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DurationInput,
  parseDurationToSeconds,
} from "@/components/ui/duration-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBulkEditSetGroup } from "@/hooks";
import { useState } from "react";
import { RepUnitMenu } from "./RepUnitMenu";
import { WeightUnitMenu } from "./WeightUnitMenu";
import type {
  RepetitionUnit,
  SetGroupWithRelations,
  Units,
  WeightUnit,
} from "@/lib/types";

export const BulkEditSetModal = ({
  open,
  onClose,
  setGroup,
  units,
}: {
  open: boolean;
  onClose: () => void;
  units: Units;
  setGroup: SetGroupWithRelations;
}) => {
  const firstSet = setGroup.sets[0];
  const [reps, setReps] = useState<string>("");
  const [restTime, setRestTime] = useState<string>("");
  const [repUnit, setRepUnit] = useState<RepetitionUnit | null>(
    firstSet?.repetitionUnit ?? null,
  );
  const [weight, setWeight] = useState<string>("");
  const [weightUnit, setWeightUnit] = useState<WeightUnit | null>(
    firstSet?.weightUnit ?? null,
  );

  const bulkEditSetGroupMutation = useBulkEditSetGroup();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Update Sets</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Input
              type="text"
              value={reps}
              placeholder={`${firstSet?.reps ?? ""}`}
              onChange={(event) => setReps(event.target.value)}
              className="pr-12"
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2">
              <RepUnitMenu
                id={`bulk-rep-${setGroup.id}`}
                label={repUnit?.name ?? "Repetitions"}
                units={units}
                onChange={(repUnit) => setRepUnit(repUnit)}
              />
            </div>
          </div>

          <div className="relative">
            <Input
              type="text"
              value={weight}
              placeholder={`${firstSet?.weight ?? ""}`}
              onChange={(event) => setWeight(event.target.value)}
              className="pr-12"
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2">
              <WeightUnitMenu
                id={`bulk-weight-${setGroup.id}`}
                label={weightUnit?.name ?? "lbs"}
                units={units}
                onChange={(weightUnit) => setWeightUnit(weightUnit)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="rest-timer">Rest Timer (MM:ss)</Label>
            <DurationInput
              id="rest-timer"
              value={restTime}
              placeholder="1:30"
              onChange={setRestTime}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              await bulkEditSetGroupMutation.mutateAsync({
                id: setGroup.id,
                // If empty string, leave unchanged (undefined)
                reps: reps ? parseInt(reps, 10) : undefined,
                weight: weight ? parseInt(weight, 10) : undefined,
                repetitionUnitId: repUnit?.id,
                weightUnitId: weightUnit?.id,
                restTime: parseDurationToSeconds(restTime),
              });
              onClose();
            }}
          >
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
