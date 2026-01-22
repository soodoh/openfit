import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import type { Units, WeightUnit, WorkoutSetId } from "@/lib/convex-types";

export const WeightUnitMenu = ({
  id,
  label,
  onChange,
  units,
}: {
  id: WorkoutSetId | string;
  label: string;
  onChange: (weightUnit: WeightUnit) => void;
  units: Units;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0 underline decoration-dashed decoration-muted-foreground/50 underline-offset-2 hover:decoration-foreground/50 transition-colors"
        >
          {label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {units.weightUnits.map((unit) => (
          <DropdownMenuItem
            key={`weight-unit-${id}-${unit._id}`}
            onClick={() => {
              onChange(unit);
              setOpen(false);
            }}
          >
            {unit.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
