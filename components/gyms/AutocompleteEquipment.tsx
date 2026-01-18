"use client";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { api } from "@/convex/_generated/api";
import type { EquipmentId } from "@/lib/convex-types";
import { useQuery } from "convex/react";
import { useMemo, useRef, useState } from "react";

interface AutocompleteEquipmentProps {
  selectedIds: EquipmentId[];
  onSelect: (equipmentId: EquipmentId) => void;
  disabled?: boolean;
}

export function AutocompleteEquipment({
  selectedIds,
  onSelect,
  disabled = false,
}: AutocompleteEquipmentProps) {
  const equipment = useQuery(api.queries.lookups.getEquipment);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter out already selected equipment and apply search filter
  const availableEquipment = useMemo(() => {
    if (!equipment) return [];
    return equipment
      .filter((e) => !selectedIds.includes(e._id))
      .filter(
        (e) =>
          !searchTerm ||
          e.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [equipment, selectedIds, searchTerm]);

  const allSelected = useMemo(() => {
    if (!equipment) return false;
    return equipment.every((e) => selectedIds.includes(e._id));
  }, [equipment, selectedIds]);

  const handleSelect = (equipmentId: EquipmentId) => {
    onSelect(equipmentId);
    setSearchTerm("");
    setOpen(false);
    // Keep focus on input for quick successive adds
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && availableEquipment.length > 0) {
      e.preventDefault();
      handleSelect(availableEquipment[0]._id);
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <Input
          ref={inputRef}
          placeholder={
            allSelected ? "All equipment added" : "Search equipment..."
          }
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => !disabled && !allSelected && setOpen(true)}
          onBlur={(e) => {
            // Don't close if clicking inside popover
            if (!e.relatedTarget?.closest("[data-radix-popper-content-wrapper]")) {
              setOpen(false);
            }
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled || allSelected}
          className="w-full"
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
      >
        <Command shouldFilter={false}>
          <CommandList>
            <CommandEmpty>
              {availableEquipment.length === 0 && !searchTerm
                ? "All equipment added"
                : "No equipment found"}
            </CommandEmpty>
            <CommandGroup>
              {availableEquipment.map((item, index) => (
                <CommandItem
                  key={item._id}
                  value={item._id}
                  onSelect={() => handleSelect(item._id)}
                  className={`cursor-pointer ${index === 0 ? "bg-accent" : ""}`}
                >
                  {item.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
