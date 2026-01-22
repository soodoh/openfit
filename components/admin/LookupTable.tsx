"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Edit2, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { DeleteLookupModal } from "./DeleteLookupModal";
import { LookupFormModal } from "./LookupFormModal";

type AdminQueryKey =
  | "listEquipment"
  | "listMuscleGroups"
  | "listCategories"
  | "listWeightUnits"
  | "listRepetitionUnits";

type AdminMutationKey =
  | "createEquipment"
  | "updateEquipment"
  | "deleteEquipment"
  | "createMuscleGroup"
  | "updateMuscleGroup"
  | "deleteMuscleGroup"
  | "createCategory"
  | "updateCategory"
  | "deleteCategory"
  | "createWeightUnit"
  | "updateWeightUnit"
  | "deleteWeightUnit"
  | "createRepetitionUnit"
  | "updateRepetitionUnit"
  | "deleteRepetitionUnit";

interface LookupTableProps {
  title: string;
  singularTitle: string;
  queryKey: AdminQueryKey;
  createMutation: AdminMutationKey;
  updateMutation: AdminMutationKey;
  deleteMutation: AdminMutationKey;
}

interface LookupItem {
  _id: string;
  name: string;
}

export function LookupTable({
  title,
  singularTitle,
  queryKey,
  createMutation,
  updateMutation,
  deleteMutation,
}: LookupTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<LookupItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<LookupItem | null>(null);

  // Use the query key to get the appropriate query
  const data = useQuery(api.queries.admin[queryKey]);

  // Mutations - using type assertions for generic handling
  const createMut = useMutation(
    api.mutations.admin[createMutation],
  ) as unknown as (args: { name: string }) => Promise<unknown>;
  const updateMut = useMutation(
    api.mutations.admin[updateMutation],
  ) as unknown as (args: { id: unknown; name: string }) => Promise<unknown>;
  const deleteMut = useMutation(
    api.mutations.admin[deleteMutation],
  ) as unknown as (args: { id: unknown }) => Promise<unknown>;

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!data) return [];
    const items = data as LookupItem[];
    if (!searchQuery.trim()) return items;
    return items.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [data, searchQuery]);

  const handleCreate = () => {
    setEditItem(null);
    setFormModalOpen(true);
  };

  const handleEdit = (item: LookupItem) => {
    setEditItem(item);
    setFormModalOpen(true);
  };

  const handleCloseForm = () => {
    setFormModalOpen(false);
    setEditItem(null);
  };

  if (data === undefined) {
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
          <CardTitle>{title}</CardTitle>
          <Button onClick={handleCreate} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add {singularTitle}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={`Search ${title.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery
                ? `No ${title.toLowerCase()} found matching "${searchQuery}"`
                : `No ${title.toLowerCase()} yet`}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <span className="font-medium">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteItem(item)}
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

      <LookupFormModal
        open={formModalOpen}
        onClose={handleCloseForm}
        title={singularTitle}
        item={editItem}
        onCreate={createMut}
        onUpdate={updateMut}
      />

      <DeleteLookupModal
        item={deleteItem}
        title={singularTitle}
        onClose={() => setDeleteItem(null)}
        onDelete={deleteMut}
      />
    </>
  );
}
