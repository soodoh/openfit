"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import {
  type ExerciseWithRelations,
  useAdminDeleteExercise,
  useAdminExercisesPaginated,
} from "@/hooks";
import { Edit2, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DeleteExerciseModal } from "./DeleteExerciseModal";
import { ExerciseFormModal } from "./ExerciseFormModal";

const DEFAULT_PAGE_SIZE = 10;

const levelColors = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  intermediate:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  expert: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

function ExerciseTableSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="h-6 w-32 rounded bg-linear-to-br from-muted/50 to-muted/30 animate-pulse" />
        <div className="h-9 w-28 rounded-md bg-linear-to-br from-muted/50 to-muted/30 animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="h-10 w-full rounded-md bg-linear-to-br from-muted/50 to-muted/30 animate-pulse" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-40 rounded bg-linear-to-br from-muted/50 to-muted/30 animate-pulse" />
                  <div className="h-5 w-16 rounded-full bg-linear-to-br from-muted/50 to-muted/30 animate-pulse" />
                </div>
                <div className="h-3 w-56 rounded bg-linear-to-br from-muted/50 to-muted/30 animate-pulse" />
              </div>
              <div className="flex items-center gap-2 ml-4">
                <div className="h-8 w-8 rounded bg-linear-to-br from-muted/50 to-muted/30 animate-pulse" />
                <div className="h-8 w-8 rounded bg-linear-to-br from-muted/50 to-muted/30 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ExerciseTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editExercise, setEditExercise] =
    useState<ExerciseWithRelations | null>(null);
  const [deleteExercise, setDeleteExercise] =
    useState<ExerciseWithRelations | null>(null);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const { data, isLoading } = useAdminExercisesPaginated({
    page: currentPage,
    pageSize,
    search: searchQuery || undefined,
  });
  const deleteExerciseMutation = useAdminDeleteExercise();

  const total = data?.total ?? 0;
  const items = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, total);

  const goToPage = useCallback(
    (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages))),
    [totalPages],
  );
  const nextPage = useCallback(
    () => goToPage(currentPage + 1),
    [currentPage, goToPage],
  );
  const prevPage = useCallback(
    () => goToPage(currentPage - 1),
    [currentPage, goToPage],
  );
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

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

  if (isLoading && !data) {
    return <ExerciseTableSkeleton />;
  }

  const paginationProps = {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    totalItems: total,
    pageSize,
    onPageChange: goToPage,
    onPrevPage: prevPage,
    onNextPage: nextPage,
    onPageSizeChange: handlePageSizeChange,
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Exercises ({total})</CardTitle>
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

          <Pagination {...paginationProps} />

          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery
                ? `No exercises found matching "${searchQuery}"`
                : "No exercises yet"}
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((exercise) => (
                <div
                  key={exercise.id}
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

          <Pagination {...paginationProps} />
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
        onDelete={(id: string) => deleteExerciseMutation.mutate(id)}
      />
    </>
  );
}
