import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "./index";
import * as schema from "./schema";
// Helpers
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomElement<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}
const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6]; // Sun-Sat
async function main() {
  const email = process.argv[2];
  if (!email) {
    throw new Error("Email argument is required");
  }
  try {
    // 1. Look up user
    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });
    if (!user) {
      throw new Error(`User not found: ${email}`);
    }
    // 2. Look up user profile
    const profile = await db.query.userProfiles.findFirst({
      where: eq(schema.userProfiles.userId, user.id),
    });
    if (!profile) {
      throw new Error(`User profile not found for user: ${user.id}`);
    }
    // 3. Fetch reference data
    const repUnit = await db.query.repetitionUnits.findFirst({
      where: eq(schema.repetitionUnits.name, "Repetitions"),
    });
    if (!repUnit) {
      throw new Error("Repetition unit not found");
    }
    const weightUnit = await db.query.weightUnits.findFirst({
      where: eq(schema.weightUnits.name, "lb"),
    });
    if (!weightUnit) {
      throw new Error("Weight unit not found");
    }
    const allExercises = await db.query.exercises.findMany();
    if (allExercises.length === 0) {
      throw new Error("No exercises available to seed mock data");
    }
    const exerciseIds = allExercises.map((e) => e.id);
    let firstRoutineDayId: string | undefined = null;
    const firstRoutineDaySetGroups: Array<{
      order: number;
      sets: Array<{
        exerciseId: string;
        order: number;
      }>;
    }> = [];
    for (let r = 1; r <= 50; r += 1) {
      const routineId = nanoid();
      await db.insert(schema.routines).values({
        id: routineId,
        userId: user.id,
        name: `Routine ${r}`,
      });
      // 2 routine days per routine
      for (let d = 0; d < 2; d += 1) {
        const routineDayId = nanoid();
        await db.insert(schema.routineDays).values({
          id: routineDayId,
          routineId,
          userId: user.id,
          description: `Day ${d + 1}`,
        });
        // Save the first routine's first day for session templates
        if (r === 1 && d === 0) {
          firstRoutineDayId = routineDayId;
        }
        // Assign 2 random weekdays
        const shuffled = [...WEEKDAYS].toSorted(() => Math.random() - 0.5);
        for (let w = 0; w < 2; w += 1) {
          await db.insert(schema.routineDayWeekdays).values({
            id: nanoid(),
            routineDayId,
            weekday: shuffled[w],
          });
        }
        // 10 set groups per routine day, 4 sets per group
        for (let sg = 0; sg < 10; sg += 1) {
          const setGroupId = nanoid();
          await db.insert(schema.workoutSetGroups).values({
            id: setGroupId,
            userId: user.id,
            routineDayId,
            sessionId: null,
            type: "NORMAL",
            order: sg,
          });
          const sets: Array<{
            exerciseId: string;
            order: number;
          }> = [];
          for (let s = 0; s < 4; s += 1) {
            const exerciseId = randomElement(exerciseIds);
            sets.push({ exerciseId, order: s });
            await db.insert(schema.workoutSets).values({
              id: nanoid(),
              userId: user.id,
              setGroupId,
              exerciseId,
              type: "NORMAL",
              order: s,
              reps: 0,
              repetitionUnitId: repUnit.id,
              weight: 0,
              weightUnitId: weightUnit.id,
              restTime: 0,
              completed: false,
            });
          }
          // Save template data for first routine day
          if (r === 1 && d === 0) {
            firstRoutineDaySetGroups.push({ order: sg, sets });
          }
        }
      }
    }
    const now = Date.now();
    for (let n = 1; n <= 100; n += 1) {
      const daysAgo = 100 - n; // Session 1 is 99 days ago, Session 100 is today
      const dayStart = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
      dayStart.setHours(randomInt(6, 20), randomInt(0, 59), 0, 0);
      const endTime = new Date(dayStart.getTime() + 60 * 60 * 1000); // +1 hour
      const sessionId = nanoid();
      await db.insert(schema.workoutSessions).values({
        id: sessionId,
        userId: user.id,
        name: `Session ${n}`,
        notes: "",
        impression: randomInt(1, 5),
        startTime: dayStart,
        endTime,
        templateId: firstRoutineDayId,
      });
      // Copy set groups/sets from first routine day template
      for (const tplGroup of firstRoutineDaySetGroups) {
        const setGroupId = nanoid();
        await db.insert(schema.workoutSetGroups).values({
          id: setGroupId,
          userId: user.id,
          routineDayId: null,
          sessionId,
          type: "NORMAL",
          order: tplGroup.order,
        });
        for (const tplSet of tplGroup.sets) {
          await db.insert(schema.workoutSets).values({
            id: nanoid(),
            userId: user.id,
            setGroupId,
            exerciseId: tplSet.exerciseId,
            type: "NORMAL",
            order: tplSet.order,
            reps: randomInt(5, 15),
            repetitionUnitId: repUnit.id,
            weight: randomInt(20, 220),
            weightUnitId: weightUnit.id,
            restTime: 90,
            completed: true,
          });
        }
      }
    }
  } catch (error) {
    throw new Error("Failed to seed mock user data", { cause: error });
  }
}
await main();
