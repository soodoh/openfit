"use client";

import { DeleteGymModal } from "@/components/gyms/DeleteGymModal";
import { EquipmentSelector } from "@/components/gyms/EquipmentSelector";
import { GymCard } from "@/components/gyms/GymCard";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  Dumbbell,
  Loader2,
  Plus,
  Settings,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import type { EquipmentId, Gym } from "@/lib/convex-types";

type Theme = "light" | "dark" | "system";
type Tab = "settings" | "equipment";

export const ProfileModal = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const profileData = useQuery(api.queries.userProfiles.getCurrent);
  const gymsData = useQuery(api.queries.gyms.list);
  const updateProfile = useMutation(api.mutations.userProfiles.update);
  const createGym = useMutation(api.mutations.gyms.create);
  const updateGym = useMutation(api.mutations.gyms.update);
  const { setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<Tab>("settings");
  const [defaultRepUnitId, setDefaultRepUnitId] = useState<string>("");
  const [defaultWeightUnitId, setDefaultWeightUnitId] = useState<string>("");
  const [selectedTheme, setSelectedTheme] = useState<Theme>("system");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gym form state
  const [isAddingGym, setIsAddingGym] = useState(false);
  const [editingGym, setEditingGym] = useState<Gym | null>(null);
  const [gymName, setGymName] = useState("");
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<
    EquipmentId[]
  >([]);
  const [gymError, setGymError] = useState<string | null>(null);
  const [isGymPending, setIsGymPending] = useState(false);

  // Delete modal state
  const [gymToDelete, setGymToDelete] = useState<Gym | null>(null);

  // Reset form when modal opens or profile data changes
  useEffect(() => {
    if (open && profileData) {
      const repUnitId =
        profileData.profile?.defaultRepetitionUnitId ??
        profileData.repetitionUnits.find((u) => u.name === "Repetitions")
          ?._id ??
        profileData.repetitionUnits[0]?._id ??
        "";
      const weightUnitId =
        profileData.profile?.defaultWeightUnitId ??
        profileData.weightUnits.find((u) => u.name === "lb")?._id ??
        profileData.weightUnits[0]?._id ??
        "";
      const theme = profileData.profile?.theme ?? "system";

      setDefaultRepUnitId(repUnitId);
      setDefaultWeightUnitId(weightUnitId);
      setSelectedTheme(theme);
      setError(null);
      setActiveTab("settings");
      resetGymForm();
    }
  }, [open, profileData]);

  const resetGymForm = () => {
    setIsAddingGym(false);
    setEditingGym(null);
    setGymName("");
    setSelectedEquipmentIds([]);
    setGymError(null);
  };

  const handleEditGym = (gym: Gym) => {
    setEditingGym(gym);
    setGymName(gym.name);
    setSelectedEquipmentIds(gym.equipmentIds);
    setIsAddingGym(true);
  };

  const handleSubmitSettings = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!defaultRepUnitId || !defaultWeightUnitId) {
      setError("Please select both units");
      return;
    }

    setIsPending(true);
    setError(null);

    try {
      await updateProfile({
        defaultRepetitionUnitId: defaultRepUnitId as Id<"repetitionUnits">,
        defaultWeightUnitId: defaultWeightUnitId as Id<"weightUnits">,
        theme: selectedTheme,
      });
      setTheme(selectedTheme);
      onClose();
    } catch {
      setError("Failed to save profile settings");
    } finally {
      setIsPending(false);
    }
  };

  const handleSubmitGym = async (event: React.FormEvent) => {
    event.preventDefault();
    setGymError(null);

    if (!gymName.trim()) {
      setGymError("Gym name is required");
      return;
    }

    if (selectedEquipmentIds.length === 0) {
      setGymError("Select at least one piece of equipment");
      return;
    }

    setIsGymPending(true);

    try {
      if (editingGym) {
        await updateGym({
          id: editingGym._id,
          name: gymName.trim(),
          equipmentIds: selectedEquipmentIds,
        });
      } else {
        await createGym({
          name: gymName.trim(),
          equipmentIds: selectedEquipmentIds,
        });
      }
      resetGymForm();
    } catch (err) {
      setGymError(
        err instanceof Error
          ? err.message
          : `Failed to ${editingGym ? "update" : "create"} gym`,
      );
    } finally {
      setIsGymPending(false);
    }
  };

  const isLoading = profileData === undefined;
  const isGymsLoading = gymsData === undefined;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-br from-accent/10 via-transparent to-primary/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-foreground/10 flex items-center justify-center">
              {activeTab === "settings" ? (
                <Settings className="h-5 w-5 text-primary dark:text-foreground" />
              ) : (
                <Dumbbell className="h-5 w-5 text-primary dark:text-foreground" />
              )}
            </div>
            <div>
              <DialogTitle className="text-xl">Profile Settings</DialogTitle>
              <DialogDescription className="text-sm">
                Customize your preferences and manage gyms
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value as Tab);
            resetGymForm();
          }}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="ml-6 w-fit shrink-0">
            <TabsTrigger value="settings" className="gap-1.5">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="equipment" className="gap-1.5">
              <Dumbbell className="h-4 w-4" />
              Equipment
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <TabsContent
            value="settings"
            className="flex-1 overflow-y-auto min-h-0 mt-0"
          >
            <form
              onSubmit={handleSubmitSettings}
              className="flex flex-col h-full"
            >
              <div className="px-6 py-5 space-y-5 flex-1">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label
                        htmlFor="default-rep-unit"
                        className="text-sm font-medium"
                      >
                        Default Repetition Unit
                      </Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Used when adding new exercises to your workouts
                      </p>
                      <Select
                        value={defaultRepUnitId}
                        onValueChange={setDefaultRepUnitId}
                      >
                        <SelectTrigger id="default-rep-unit" className="h-11">
                          <SelectValue placeholder="Select repetition unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {profileData?.repetitionUnits.map((unit) => (
                            <SelectItem key={unit._id} value={unit._id}>
                              {unit.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="default-weight-unit"
                        className="text-sm font-medium"
                      >
                        Default Weight Unit
                      </Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Used when logging weights in your workouts
                      </p>
                      <Select
                        value={defaultWeightUnitId}
                        onValueChange={setDefaultWeightUnitId}
                      >
                        <SelectTrigger
                          id="default-weight-unit"
                          className="h-11"
                        >
                          <SelectValue placeholder="Select weight unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {profileData?.weightUnits.map((unit) => (
                            <SelectItem key={unit._id} value={unit._id}>
                              {unit.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="theme" className="text-sm font-medium">
                        Theme
                      </Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Choose your preferred color theme
                      </p>
                      <Select
                        value={selectedTheme}
                        onValueChange={(value) =>
                          setSelectedTheme(value as Theme)
                        }
                      >
                        <SelectTrigger id="theme" className="h-11">
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                          {profileData?.themeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {error && (
                      <p className="text-sm text-destructive flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {error}
                      </p>
                    )}
                  </>
                )}
              </div>

              <DialogFooter className="px-6 py-4 bg-muted/30 border-t border-border/50 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="mr-2"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || isLoading}
                  className="min-w-[100px]"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent
            value="equipment"
            className="flex-1 overflow-y-auto min-h-0 mt-0"
          >
            <div className="flex flex-col h-full">
              <div className="px-6 py-5 flex-1">
                {isGymsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : isAddingGym ? (
                  // Gym form (add/edit)
                  <form onSubmit={handleSubmitGym} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">
                        {editingGym ? "Edit Gym" : "Add New Gym"}
                      </h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={resetGymForm}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gym-name" className="text-sm font-medium">
                        Gym Name
                      </Label>
                      <Input
                        id="gym-name"
                        placeholder="e.g., Home Gym, Planet Fitness"
                        value={gymName}
                        onChange={(e) => setGymName(e.target.value)}
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

                    {gymError && (
                      <p className="text-sm text-destructive flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {gymError}
                      </p>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={resetGymForm}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isGymPending}>
                        {isGymPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : editingGym ? (
                          "Save Changes"
                        ) : (
                          "Add Gym"
                        )}
                      </Button>
                    </div>
                  </form>
                ) : (
                  // Gym list
                  <div className="space-y-3">
                    {gymsData && gymsData.length > 0 ? (
                      <>
                        {gymsData.map((gym) => (
                          <GymCard
                            key={gym._id}
                            gym={gym}
                            isDefault={
                              profileData?.profile?.defaultGymId === gym._id
                            }
                            onEdit={() => handleEditGym(gym)}
                            onDelete={() => setGymToDelete(gym)}
                          />
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => setIsAddingGym(true)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Gym
                        </Button>
                      </>
                    ) : (
                      <div className="text-center py-8 space-y-3">
                        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                          <Dumbbell className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            No gyms created yet
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Create a gym to filter exercises by available
                            equipment
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddingGym(true)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Your First Gym
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer for equipment tab - only show when not editing */}
              {!isAddingGym && (
                <DialogFooter className="px-6 py-4 bg-muted/30 border-t border-border/50 shrink-0">
                  <Button type="button" variant="ghost" onClick={onClose}>
                    Close
                  </Button>
                </DialogFooter>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>

      <DeleteGymModal
        gym={gymToDelete}
        isLastGym={gymsData?.length === 1}
        onClose={() => setGymToDelete(null)}
      />
    </Dialog>
  );
};
