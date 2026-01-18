"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { ChevronDown, ChevronRight, Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { EquipmentId } from "@/lib/convex-types";

// Equipment category mappings based on common gym equipment names
const EQUIPMENT_CATEGORIES: Record<string, string[]> = {
  "Free Weights": [
    "dumbbell",
    "barbell",
    "ez curl bar",
    "kettlebell",
    "weight plate",
  ],
  Machines: [
    "machine",
    "press",
    "leg extension",
    "leg curl",
    "lat pulldown",
    "row machine",
    "smith",
    "hack squat",
    "pec deck",
  ],
  Cables: ["cable", "pulley"],
  Benches: ["bench", "preacher"],
  Cardio: ["treadmill", "bike", "rowing", "elliptical", "stair"],
  Bodyweight: ["body only", "pull-up bar", "dip", "parallel bars"],
  Other: [],
};

function categorizeEquipment(equipmentName: string): string {
  const lowerName = equipmentName.toLowerCase();

  for (const [category, keywords] of Object.entries(EQUIPMENT_CATEGORIES)) {
    if (category === "Other") continue;
    if (keywords.some((keyword) => lowerName.includes(keyword))) {
      return category;
    }
  }

  return "Other";
}

interface EquipmentSelectorProps {
  selectedIds: EquipmentId[];
  onSelectionChange: (ids: EquipmentId[]) => void;
}

export function EquipmentSelector({
  selectedIds,
  onSelectionChange,
}: EquipmentSelectorProps) {
  const equipment = useQuery(api.queries.lookups.getEquipment);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["Free Weights", "Machines"]),
  );

  // Debounce search for performance (NFR3: 200ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const groupedEquipment = useMemo(() => {
    if (!equipment) return {};

    const filtered = debouncedSearch
      ? equipment.filter((e) =>
          e.name.toLowerCase().includes(debouncedSearch.toLowerCase()),
        )
      : equipment;

    const groups: Record<string, typeof equipment> = {};

    for (const item of filtered) {
      const category = categorizeEquipment(item.name);
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    }

    // Sort items within each category
    for (const category of Object.keys(groups)) {
      groups[category].sort((a, b) => a.name.localeCompare(b.name));
    }

    return groups;
  }, [equipment, debouncedSearch]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const toggleEquipment = (equipmentId: EquipmentId) => {
    const isSelected = selectedIds.includes(equipmentId);
    if (isSelected) {
      onSelectionChange(selectedIds.filter((id) => id !== equipmentId));
    } else {
      onSelectionChange([...selectedIds, equipmentId]);
    }
  };

  const categoryOrder = [
    "Free Weights",
    "Machines",
    "Cables",
    "Benches",
    "Cardio",
    "Bodyweight",
    "Other",
  ];

  if (equipment === undefined) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search equipment..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="max-h-[300px] overflow-y-auto space-y-1 pr-1">
        {categoryOrder.map((category) => {
          const items = groupedEquipment[category];
          if (!items || items.length === 0) return null;

          const isExpanded = expandedCategories.has(category);
          const selectedCount = items.filter((item) =>
            selectedIds.includes(item._id),
          ).length;

          return (
            <Collapsible
              key={category}
              open={isExpanded}
              onOpenChange={() => toggleCategory(category)}
            >
              <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-muted/50 transition-colors text-sm font-medium">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span className="flex-1 text-left">{category}</span>
                <span className="text-xs text-muted-foreground">
                  {selectedCount > 0 && `${selectedCount}/`}
                  {items.length}
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 space-y-1">
                {items.map((item) => (
                  <label
                    key={item._id}
                    className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={selectedIds.includes(item._id)}
                      onCheckedChange={() => toggleEquipment(item._id)}
                    />
                    <span className="text-sm">{item.name}</span>
                  </label>
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}

        {Object.keys(groupedEquipment).length === 0 && debouncedSearch && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No equipment found matching "{debouncedSearch}"
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {selectedIds.length} equipment selected
      </p>
    </div>
  );
}
