"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { AlertCircle, Loader2, X } from "lucide-react";
import { useMemo } from "react";
import { AutocompleteEquipment } from "./AutocompleteEquipment";
import type { EquipmentId } from "@/lib/convex-types";

interface EquipmentSelectorProps {
  selectedIds: EquipmentId[];
  onSelectionChange: (ids: EquipmentId[]) => void;
}

export function EquipmentSelector({
  selectedIds,
  onSelectionChange,
}: EquipmentSelectorProps) {
  const equipment = useQuery(api.queries.lookups.getEquipment);

  // Get selected equipment details sorted alphabetically
  const selectedEquipment = useMemo(() => {
    if (!equipment) return [];
    return equipment
      .filter((e) => selectedIds.includes(e._id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [equipment, selectedIds]);

  const handleSelect = (equipmentId: EquipmentId) => {
    onSelectionChange([...selectedIds, equipmentId]);
  };

  const handleRemove = (equipmentId: EquipmentId) => {
    onSelectionChange(selectedIds.filter((id) => id !== equipmentId));
  };

  if (equipment === undefined) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasValidSelection = selectedIds.length > 0;

  return (
    <div className="space-y-3">
      {/* Aria live region for screen reader announcements */}
      <div aria-live="polite" className="sr-only">
        {selectedIds.length} equipment selected
      </div>

      {/* Autocomplete input */}
      <AutocompleteEquipment
        selectedIds={selectedIds}
        onSelect={handleSelect}
      />

      {/* Selected equipment list */}
      {selectedEquipment.length > 0 && (
        <div className="space-y-1 max-h-[250px] overflow-y-auto">
          {selectedEquipment.map((item) => (
            <div
              key={item._id}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-muted/50 text-sm"
            >
              <span>{item.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={() => handleRemove(item._id)}
                aria-label={`Remove ${item.name}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Validation message */}
      {!hasValidSelection && (
        <p className="text-sm text-destructive flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5" />
          Select at least one piece of equipment
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        {selectedIds.length} equipment selected
      </p>
    </div>
  );
}
