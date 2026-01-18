"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Id } from "@/convex/_generated/dataModel";
import { Check, ChevronDown, Dumbbell, Loader2 } from "lucide-react";

export interface Gym {
  _id: Id<"gyms">;
  name: string;
  equipmentIds: Id<"equipment">[];
}

interface GymFilterDropdownProps {
  selectedGymId: Id<"gyms"> | null;
  userGyms: Gym[] | undefined;
  onGymChange: (gymId: Id<"gyms"> | null) => void;
  isLoading?: boolean;
}

export function GymFilterDropdown({
  selectedGymId,
  userGyms,
  onGymChange,
  isLoading = false,
}: GymFilterDropdownProps) {
  const selectedGym = userGyms?.find((g) => g._id === selectedGymId);
  const displayName = selectedGym?.name ?? "All Equipment";

  // Loading state
  if (isLoading) {
    return (
      <Button variant="outline" className="gap-2" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading...</span>
      </Button>
    );
  }

  return (
    <>
      {/* ARIA live region for filter changes */}
      <div aria-live="polite" className="sr-only">
        {`Now filtering by ${displayName}`}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="gap-2"
            aria-label={`Filtering exercises by ${displayName}. Click to change gym.`}
          >
            <Dumbbell className="h-4 w-4" />
            <span>{displayName}</span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-56">
          {userGyms && userGyms.length > 0 ? (
            <>
              {userGyms.map((gym) => (
                <DropdownMenuItem
                  key={gym._id}
                  onClick={() => onGymChange(gym._id)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span>{gym.name}</span>
                  {selectedGymId === gym._id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          ) : null}

          <DropdownMenuItem
            onClick={() => onGymChange(null)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span>All Equipment</span>
            {selectedGymId === null && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
