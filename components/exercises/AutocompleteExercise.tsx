"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useExerciseLookups } from "@/lib/use-exercise-lookups";
import { useQuery } from "convex/react";
import { Check, ChevronDown, Image as FallbackImage } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Exercise = Doc<"exercises">;

export const AutocompleteExercise = ({
  value,
  onChange,
}: {
  value: Exercise | null;
  onChange: (exercise: Exercise | null) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedGymId, setSelectedGymId] = useState<Id<"gyms"> | "all" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { getMuscleGroupNames } = useExerciseLookups();

  // Fetch user profile for default gym
  const userProfile = useQuery(api.queries.userProfiles.getCurrent);
  const userGyms = useQuery(api.queries.gyms.list);

  // Fetch selected gym's equipment (skip if "all" or null/not yet initialized)
  const selectedGym = useQuery(
    api.queries.gyms.get,
    selectedGymId && selectedGymId !== "all" ? { id: selectedGymId } : "skip",
  );

  // Set selected gym to user's default gym on initial load only
  useEffect(() => {
    if (userProfile?.profile?.defaultGymId && selectedGymId === null) {
      setSelectedGymId(userProfile.profile.defaultGymId);
    }
  }, [selectedGymId, userProfile?.profile?.defaultGymId]);

  // Determine equipment IDs for filtering
  // - null: not initialized yet, don't filter
  // - "all": user selected all equipment, don't filter
  // - gym ID: filter by that gym's equipment
  const equipmentIdsForFilter = selectedGymId === "all" ? undefined : selectedGym?.equipmentIds;

  // Search with gym equipment filter (always query, even without search term)
  const options = useQuery(api.queries.exercises.searchSimple, {
    searchTerm: searchTerm || undefined,
    equipmentIds: equipmentIdsForFilter,
  });
  const isLoading = options === undefined;

  const handleSelect = (exercise: Exercise) => {
    onChange(exercise);
    setSearchTerm("");
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If there's a selected value, clear it on any keypress
    if (value) {
      onChange(null);
      // For backspace/delete, clear everything
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        setSearchTerm("");
        return;
      }
      // For other keys, start fresh with the new character
      if (e.key.length === 1) {
        e.preventDefault();
        setSearchTerm(e.key);
        setOpen(true);
        return;
      }
    }

    if (e.key === "Enter" && options && options.length > 0) {
      e.preventDefault();
      handleSelect(options[0]);
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const handleGymChange = (gymId: Id<"gyms"> | "all") => {
    setSelectedGymId(gymId);
  };

  const selectedGymName = selectedGymId && selectedGymId !== "all"
    ? userGyms?.find((g) => g._id === selectedGymId)?.name
    : null;
  const gymDisplayName = selectedGymName ?? "All";

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverAnchor asChild>
          <Input
            ref={inputRef}
            placeholder="Search exercises..."
            value={value?.name || searchTerm}
            onChange={(e) => {
              // If there's a selected value, keyDown handler takes care of clearing
              // This onChange is only for when there's no selected value
              if (!value) {
                setSearchTerm(e.target.value);
                if (!open && e.target.value) setOpen(true);
              }
            }}
            onFocus={() => !value && setOpen(true)}
            onBlur={(e) => {
              // Don't close if clicking inside popover
              if (
                !e.relatedTarget?.closest("[data-radix-popper-content-wrapper]")
              ) {
                setOpen(false);
              }
            }}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
        </PopoverAnchor>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            // Don't close if interacting with the input
            if (e.target === inputRef.current) {
              e.preventDefault();
            }
          }}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          {/* Gym Filter Header */}
          <div className="flex items-center gap-1 px-3 py-2 border-b bg-muted/30">
            <span className="text-xs text-muted-foreground">
              Available equipment:
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded hover:bg-accent transition-colors"
                >
                  <span>{gymDisplayName}</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {userGyms && userGyms.length > 0 ? (
                  <>
                    {userGyms.map((gym) => (
                      <DropdownMenuItem
                        key={gym._id}
                        onClick={() => handleGymChange(gym._id)}
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
                  onClick={() => handleGymChange("all")}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span>All Equipment</span>
                  {selectedGymId === "all" && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Command shouldFilter={false}>
            <CommandList
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              <CommandEmpty>
                {isLoading ? "Loading exercises..." : "No exercises found"}
              </CommandEmpty>
              <CommandGroup>
                {options?.map((option, index) => (
                  <CommandItem
                    key={option._id}
                    value={option._id}
                    onSelect={() => handleSelect(option)}
                    className={`flex items-center gap-3 p-3 cursor-pointer ${index === 0 ? "bg-accent" : ""}`}
                  >
                    <Avatar className="h-10 w-10">
                      {option.images[0] ? (
                        <AvatarImage
                          src={`/exercises/${option.images[0]}`}
                          alt={`${option.name} thumbnail`}
                        />
                      ) : null}
                      <AvatarFallback className="flex items-center justify-center">
                        <FallbackImage className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{option.name}</span>
                      {option.primaryMuscleIds &&
                        option.primaryMuscleIds.length > 0 && (
                          <span className="text-sm text-muted-foreground">
                            {getMuscleGroupNames(option.primaryMuscleIds).join(
                              ", ",
                            )}
                          </span>
                        )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
