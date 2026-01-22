import { ExerciseDetailModal } from "@/components/exercises/ExerciseDetailModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { api } from "@/convex/_generated/api";
import {
  type Exercise,
  ListView,
  type SetGroupWithRelations,
  SetType,
  type SetWithRelations,
  type Units,
} from "@/lib/convex-types";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation } from "convex/react";
import {
  AlertCircle,
  Edit,
  GripVertical,
  Image as ImageIcon,
  Info,
  MessageSquare,
  Plus,
  Trash2,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useOptimistic,
  useState,
  useTransition,
} from "react";
import { DeleteSetGroupModal } from "@/components/routines/DeleteSetGroupModal";
import { BulkEditSetModal } from "./BulkEditSetModal";
import { EditSetCommentModal } from "./EditSetCommentModal";
import { WorkoutSetRow } from "./WorkoutSetRow";

export const WorkoutSetGroup = ({
  view,
  setGroup,
  isReorderActive,
  units,
  startRestTimer,
}: {
  view: ListView;
  setGroup: SetGroupWithRelations;
  isReorderActive: boolean;
  units: Units;
  startRestTimer: (seconds: number) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: setGroup._id });
  const [, startTransition] = useTransition();
  const [sets, optimisticUpdateSets] = useOptimistic<
    SetWithRelations[],
    SetWithRelations[]
  >(setGroup.sets, (_, newSets) => newSets);
  const [expanded, setExpanded] = useState(
    view === ListView.CurrentSession && sets.some((set) => !set.completed),
  );
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  );
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const createSet = useMutation(api.mutations.sets.create);
  const reorderSets = useMutation(api.mutations.sets.reorder);

  useEffect(() => {
    if (sets.every((set) => set.completed)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpanded(false);
    }
  }, [sets]);

  const exercise = sets[0]?.exercise;
  const setsWithNumber = useMemo(
    () =>
      sets.map((set, index) => {
        const setNum = sets.slice(0, index + 1).reduce((total, set) => {
          if (set.type === SetType.NORMAL) {
            return total + 1;
          }
          return total;
        }, 0);
        return { set, setNum };
      }),
    [sets],
  );

  const mouseSensor = useSensor(MouseSensor);
  const touchSensor = useSensor(TouchSensor);
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor);

  const handleAdd = async () => {
    if (!exercise) return;
    await createSet({
      setGroupId: setGroup._id,
      exerciseId: exercise._id,
    });
  };

  const handleSort = (event: DragEndEvent) => {
    const dragId = event.active.id as string;
    const overId = event.over?.id as string;
    if (!overId || dragId === overId) {
      return;
    }

    const oldIndex = sets.findIndex((set) => set._id === dragId);
    const newIndex = sets.findIndex((set) => set._id === overId);
    const newSets = arrayMove(sets, oldIndex, newIndex);
    startTransition(async () => {
      optimisticUpdateSets(newSets);
      await reorderSets({
        setGroupId: setGroup._id,
        setIds: newSets.map(({ _id }) => _id),
      });
    });
  };

  const isCompleted = setGroup.sets.every((set) => set.completed);

  return (
    <>
      {selectedExercise && (
        <ExerciseDetailModal
          exercise={selectedExercise}
          open={!!selectedExercise}
          onClose={() => setSelectedExercise(null)}
        />
      )}
      <BulkEditSetModal
        open={showBulkEdit}
        onClose={() => setShowBulkEdit(false)}
        setGroup={setGroup}
        units={units}
      />
      <EditSetCommentModal
        open={showComment}
        onClose={() => setShowComment(false)}
        setGroup={setGroup}
      />
      <DeleteSetGroupModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        setGroup={setGroup}
      />
      <Collapsible open={!isReorderActive && expanded} className="w-full">
        <div
          ref={setNodeRef}
          style={{ transform: CSS.Transform.toString(transform), transition }}
          className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
        >
          <CollapsibleTrigger
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-3 flex-1 text-left"
          >
            {isReorderActive && (
              <Button
                variant="ghost"
                size="icon"
                className="touch-manipulation h-8 w-8 text-muted-foreground hover:text-foreground"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-4 w-4" />
              </Button>
            )}

            <Avatar className="h-10 w-10 rounded-lg">
              {exercise ? (
                <>
                  <AvatarImage
                    src={`/exercises/${exercise.images[0]}`}
                    alt={`${exercise.name} set item`}
                    className="object-cover"
                  />
                  <AvatarFallback className="rounded-lg bg-muted">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  </AvatarFallback>
                </>
              ) : (
                <AvatarFallback className="rounded-lg bg-destructive/10">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </AvatarFallback>
              )}
            </Avatar>

            <div className="flex-1 min-w-0">
              <div
                className={`font-medium text-sm truncate ${
                  isCompleted
                    ? "line-through text-muted-foreground"
                    : "text-foreground"
                }`}
              >
                {exercise?.name ?? "Unknown exercise"}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {sets.length} {sets.length === 1 ? "set" : "sets"}
                </span>
                {isCompleted && (
                  <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 text-[10px] font-medium">
                    Done
                  </span>
                )}
              </div>
            </div>
          </CollapsibleTrigger>

          {!isReorderActive && exercise && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="View exercise details"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setSelectedExercise(exercise)}
            >
              <Info className="h-4 w-4" />
            </Button>
          )}
        </div>

        <CollapsibleContent>
          <div className="bg-muted/20">
            {setGroup.comment && (
              <div className="px-4 py-3 text-sm text-muted-foreground border-b border-border/50 bg-muted/30">
                <span className="font-medium text-foreground/80">Note:</span>{" "}
                {setGroup.comment}
              </div>
            )}

            <div className="divide-y divide-border/50">
              <DndContext id="sets" onDragEnd={handleSort} sensors={sensors}>
                <SortableContext
                  items={sets.map((s) => s._id)}
                  strategy={verticalListSortingStrategy}
                >
                  {setsWithNumber.map(({ set, setNum }) => {
                    return (
                      <WorkoutSetRow
                        key={`set-row-${set._id}`}
                        view={view}
                        set={set}
                        setNum={setNum}
                        units={units}
                        startRestTimer={startRestTimer}
                      />
                    );
                  })}
                </SortableContext>
              </DndContext>
            </div>

            <div className="flex items-center justify-between p-3 border-t border-border/50">
              <Button
                onClick={handleAdd}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Set
              </Button>
              <div className="flex items-center gap-1">
                <Button
                  onClick={() => setShowBulkEdit(true)}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  aria-label="Bulk edit sets"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setShowComment(true)}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  aria-label="Add comment"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setShowDelete(true)}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  aria-label="Delete exercise"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </>
  );
};
