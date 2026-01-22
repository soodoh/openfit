"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dumbbell,
  FolderOpen,
  PersonStanding,
  Repeat,
  Scale,
  Users,
  Wrench,
} from "lucide-react";
import { ExerciseTable } from "./ExerciseTable";
import { LookupTable } from "./LookupTable";
import { UserTable } from "./UserTable";

export function AdminPage() {
  return (
    <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-(--breakpoint-xl) mt-8 pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">
          Manage global lookup data and users
        </p>
      </div>

      <Tabs defaultValue="exercises" className="w-full">
        <TabsList className="grid w-full grid-cols-7 mb-6">
          <TabsTrigger value="exercises" className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            <span className="hidden sm:inline">Exercises</span>
          </TabsTrigger>
          <TabsTrigger value="equipment" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            <span className="hidden sm:inline">Equipment</span>
          </TabsTrigger>
          <TabsTrigger value="muscles" className="flex items-center gap-2">
            <PersonStanding className="h-4 w-4" />
            <span className="hidden sm:inline">Muscles</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Categories</span>
          </TabsTrigger>
          <TabsTrigger value="weightUnits" className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            <span className="hidden sm:inline">Weight</span>
          </TabsTrigger>
          <TabsTrigger value="repUnits" className="flex items-center gap-2">
            <Repeat className="h-4 w-4" />
            <span className="hidden sm:inline">Reps</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exercises">
          <ExerciseTable />
        </TabsContent>

        <TabsContent value="equipment">
          <LookupTable
            title="Equipment"
            singularTitle="Equipment"
            queryKey="listEquipment"
            createMutation="createEquipment"
            updateMutation="updateEquipment"
            deleteMutation="deleteEquipment"
          />
        </TabsContent>

        <TabsContent value="muscles">
          <LookupTable
            title="Muscle Groups"
            singularTitle="Muscle Group"
            queryKey="listMuscleGroups"
            createMutation="createMuscleGroup"
            updateMutation="updateMuscleGroup"
            deleteMutation="deleteMuscleGroup"
          />
        </TabsContent>

        <TabsContent value="categories">
          <LookupTable
            title="Categories"
            singularTitle="Category"
            queryKey="listCategories"
            createMutation="createCategory"
            updateMutation="updateCategory"
            deleteMutation="deleteCategory"
          />
        </TabsContent>

        <TabsContent value="weightUnits">
          <LookupTable
            title="Weight Units"
            singularTitle="Weight Unit"
            queryKey="listWeightUnits"
            createMutation="createWeightUnit"
            updateMutation="updateWeightUnit"
            deleteMutation="deleteWeightUnit"
          />
        </TabsContent>

        <TabsContent value="repUnits">
          <LookupTable
            title="Repetition Units"
            singularTitle="Repetition Unit"
            queryKey="listRepetitionUnits"
            createMutation="createRepetitionUnit"
            updateMutation="updateRepetitionUnit"
            deleteMutation="deleteRepetitionUnit"
          />
        </TabsContent>

        <TabsContent value="users">
          <UserTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
