import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dumbbell, FolderOpen, PersonStanding, Repeat, Scale, Wrench, } from "lucide-react";
import { ExerciseTable } from "./exercise-table";
import { LookupTable } from "./lookup-table";
export function SharedEntitiesView(): any {
    return (<Tabs defaultValue="exercises" orientation="vertical" className="flex gap-6">
      <TabsList className="flex flex-col h-fit w-48 shrink-0">
        <TabsTrigger value="exercises" className="w-full justify-start gap-2 px-3">
          <Dumbbell className="h-4 w-4"/>
          Exercises
        </TabsTrigger>
        <TabsTrigger value="equipment" className="w-full justify-start gap-2 px-3">
          <Wrench className="h-4 w-4"/>
          Equipment
        </TabsTrigger>
        <TabsTrigger value="muscles" className="w-full justify-start gap-2 px-3">
          <PersonStanding className="h-4 w-4"/>
          Muscles
        </TabsTrigger>
        <TabsTrigger value="categories" className="w-full justify-start gap-2 px-3">
          <FolderOpen className="h-4 w-4"/>
          Categories
        </TabsTrigger>
        <TabsTrigger value="weightUnits" className="w-full justify-start gap-2 px-3">
          <Scale className="h-4 w-4"/>
          Weight Units
        </TabsTrigger>
        <TabsTrigger value="repUnits" className="w-full justify-start gap-2 px-3">
          <Repeat className="h-4 w-4"/>
          Rep Units
        </TabsTrigger>
      </TabsList>

      <div className="flex-1 min-w-0">
        <TabsContent value="exercises" className="mt-0">
          <ExerciseTable />
        </TabsContent>

        <TabsContent value="equipment" className="mt-0">
          <LookupTable title="Equipment" singularTitle="Equipment" lookupType="equipment"/>
        </TabsContent>

        <TabsContent value="muscles" className="mt-0">
          <LookupTable title="Muscle Groups" singularTitle="Muscle Group" lookupType="muscleGroups"/>
        </TabsContent>

        <TabsContent value="categories" className="mt-0">
          <LookupTable title="Categories" singularTitle="Category" lookupType="categories"/>
        </TabsContent>

        <TabsContent value="weightUnits" className="mt-0">
          <LookupTable title="Weight Units" singularTitle="Weight Unit" lookupType="weightUnits"/>
        </TabsContent>

        <TabsContent value="repUnits" className="mt-0">
          <LookupTable title="Repetition Units" singularTitle="Repetition Unit" lookupType="repetitionUnits"/>
        </TabsContent>
      </div>
    </Tabs>);
}

export default SharedEntitiesView;
