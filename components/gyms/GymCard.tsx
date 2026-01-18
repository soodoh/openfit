import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Star } from "lucide-react";
import { GymMenu } from "./GymMenu";
import type { Gym } from "@/lib/convex-types";

interface GymCardProps {
  gym: Gym;
  isDefault?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function GymCard({
  gym,
  isDefault = false,
  onEdit,
  onDelete,
}: GymCardProps) {
  const equipmentCount = gym.equipmentIds.length;

  return (
    <Card className="group flex flex-col overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-lg hover:border-border transition-all duration-300">
      <CardHeader className="relative pb-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold text-foreground truncate">
                {gym.name}
              </CardTitle>
              {isDefault && (
                <Badge
                  variant="secondary"
                  className="bg-accent/20 text-accent-foreground shrink-0"
                >
                  <Star className="h-3 w-3 mr-1" />
                  Default
                </Badge>
              )}
            </div>
          </div>
          <GymMenu
            gym={gym}
            isDefault={isDefault}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>

        {/* Meta info */}
        <div className="relative flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Dumbbell className="h-3.5 w-3.5" />
            <span>
              {equipmentCount} equipment{" "}
              {equipmentCount === 1 ? "item" : "items"}
            </span>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
