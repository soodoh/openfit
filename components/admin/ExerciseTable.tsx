"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Edit2, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { DeleteExerciseModal } from "./DeleteExerciseModal";
import { ExerciseFormModal } from "./ExerciseFormModal";

interface MuscleInfo {
  _id: string;
  name: string;
}

interface ExerciseWithRelations {
  _id: string;
  name: string;
  level: "beginner" | "intermediate" | "expert";
  force?: "push" | "pull" | "static" | null;
  mechanic?: "compound" | "isolation" | null;
  equipmentId?: string;
  categoryId: string;
  primaryMuscleIds: string[];
  secondaryMuscleIds: string[];
  instructions: string[];
  imageIds: string[];
  imageUrls: (string | null)[];
  equipment: { _id: string; name: string } | null;
  category: { _id: string; name: string } | null;
  primaryMuscles: (MuscleInfo | null)[];
  secondaryMuscles: (MuscleInfo | null)[];
}

const levelColors = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  intermediate:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  expert: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function ExerciseTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editExercise, setEditExercise] =
    useState<ExerciseWithRelations | null>(null);
  const [deleteExercise, setDeleteExercise] =
    useState<ExerciseWithRelations | null>(null);

  const exercises = useQuery(api.queries.admin.listExercises);
  const deleteExerciseMut = useMutation(api.mutations.admin.deleteExercise);

  // Filter exercises based on search query
  const filteredExercises = useMemo(() => {
    if (!exercises) return [];
    if (!searchQuery.trim()) return exercises;
    const query = searchQuery.toLowerCase();
    return exercises.filter(
      (ex) =>
        ex.name.toLowerCase().includes(query) ||
        ex.category?.name.toLowerCase().includes(query) ||
        ex.equipment?.name.toLowerCase().includes(query) ||
        ex.primaryMuscles.some((m) => m?.name.toLowerCase().includes(query)),
    );
  }, [exercises, searchQuery]);

  const handleCreate = () => {
    setEditExercise(null);
    setFormModalOpen(true);
  };

  const handleEdit = (exercise: ExerciseWithRelations) => {
    setEditExercise(exercise);
    setFormModalOpen(true);
  };

  const handleCloseForm = () => {
    setFormModalOpen(false);
    setEditExercise(null);
  };

  if (exercises === undefined) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Exercises ({exercises.length})</CardTitle>
          <Button onClick={handleCreate} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Exercise
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {filteredExercises.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery
                ? `No exercises found matching "${searchQuery}"`
                : "No exercises yet"}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredExercises.map((exercise) => (
                <div
                  key={exercise._id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">
                        {exercise.name}
                      </span>
                      <Badge
                        variant="secondary"
                        className={levelColors[exercise.level]}
                      >
                        {exercise.level}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
                      {exercise.category && (
                        <span>{exercise.category.name}</span>
                      )}
                      {exercise.equipment && (
                        <>
                          <span>•</span>
                          <span>{exercise.equipment.name}</span>
                        </>
                      )}
                      {exercise.primaryMuscles.length > 0 && (
                        <>
                          <span>•</span>
                          <span>
                            {exercise.primaryMuscles
                              .filter(Boolean)
                              .map((m) => m!.name)
                              .join(", ")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(exercise)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteExercise(exercise)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ExerciseFormModal
        open={formModalOpen}
        onClose={handleCloseForm}
        exercise={editExercise}
      />

      <DeleteExerciseModal
        exercise={deleteExercise}
        onClose={() => setDeleteExercise(null)}
        onDelete={deleteExerciseMut}
      />
    </>
  );
}
