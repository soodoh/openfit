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
import { useEquipment } from "@/hooks";
import { useMemo, useRef, useState } from "react";
type AutocompleteEquipmentProps = {
  selectedIds: string[];
  onSelect: (equipmentId: string) => void;
  disabled?: boolean;
};
export function AutocompleteEquipment({
  selectedIds,
  onSelect,
  disabled = false,
}: AutocompleteEquipmentProps): any {
  const { data: equipment } = useEquipment();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  // Filter out already selected equipment and apply search filter
  const availableEquipment = useMemo(() => {
    if (!equipment) {
      return [];
    }
    return equipment
      .filter((e) => !selectedIds.includes(e.id))
      .filter(
        (e) =>
          !searchTerm ||
          e.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .toSorted((a, b) => a.name.localeCompare(b.name));
  }, [equipment, selectedIds, searchTerm]);
  const allSelected = useMemo(() => {
    if (!equipment) {
      return false;
    }
    return equipment.every((e) => selectedIds.includes(e.id));
  }, [equipment, selectedIds]);
  const handleSelect = (equipmentId: string) => {
    onSelect(equipmentId);
    setSearchTerm("");
    setOpen(false);
    // Keep focus on input for quick successive adds
    inputRef.current?.focus();
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && availableEquipment.length > 0) {
      e.preventDefault();
      handleSelect(availableEquipment[0].id);
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
            if (!open) {
              setOpen(true);
            }
          }}
          onFocus={() => !disabled && !allSelected && setOpen(true)}
          onBlur={(e) => {
            // Don't close if clicking inside popover
            if (
              !e.relatedTarget?.closest("[data-radix-popper-content-wrapper]")
            ) {
              setOpen(false);
            }
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled || allSelected}
          className="w-full"
        />
      </PopoverAnchor>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
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
                  key={item.id}
                  value={item.id}
                  onSelect={() => handleSelect(item.id)}
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

export default AutocompleteEquipment;
