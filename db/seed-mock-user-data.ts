/* eslint-disable eslint(complexity), eslint(no-console), eslint(no-plusplus), eslint-plugin-unicorn(no-process-exit), eslint-plugin-unicorn(prefer-top-level-await), typescript-eslint(array-type), typescript-eslint(no-restricted-types) */
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
    console.error("Usage: tsx db/seed-mock-user-data.ts <email>");
    process.exit(1);
  }

  try {
    // 1. Look up user
    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });
    if (!user) {
      console.error(`User not found with email: ${email}`);
      process.exit(1);
    }
    console.log(`Found user: ${user.name} (${user.id})`);

    // 2. Look up user profile
    const profile = await db.query.userProfiles.findFirst({
      where: eq(schema.userProfiles.userId, user.id),
    });
    if (!profile) {
      console.error(`User profile not found for user: ${user.id}`);
      process.exit(1);
    }

    // 3. Fetch reference data
    const repUnit = await db.query.repetitionUnits.findFirst({
      where: eq(schema.repetitionUnits.name, "Repetitions"),
    });
    if (!repUnit) {
      console.error(
        'Repetition unit "Repetitions" not found. Run db:seed first.',
      );
      process.exit(1);
    }

    const weightUnit = await db.query.weightUnits.findFirst({
      where: eq(schema.weightUnits.name, "lb"),
    });
    if (!weightUnit) {
      console.error('Weight unit "lb" not found. Run db:seed first.');
      process.exit(1);
    }

    const allExercises = await db.query.exercises.findMany();
    if (allExercises.length === 0) {
      console.error("No exercises found. Run db:seed first.");
      process.exit(1);
    }
    const exerciseIds = allExercises.map((e) => e.id);
    console.log(`Found ${exerciseIds.length} exercises to use.`);

    // 4. Create 50 routines with 2 routine days each
    console.log("Creating 50 routines...");
    let firstRoutineDayId: string | null = null;
    const firstRoutineDaySetGroups: Array<{
      order: number;
      sets: { exerciseId: string; order: number }[];
    }> = [];

    for (let r = 1; r <= 50; r++) {
      const routineId = nanoid();
      await db.insert(schema.routines).values({
        id: routineId,
        userId: user.id,
        name: `Routine ${r}`,
      });

      // 2 routine days per routine
      for (let d = 0; d < 2; d++) {
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
        for (let w = 0; w < 2; w++) {
          await db.insert(schema.routineDayWeekdays).values({
            id: nanoid(),
            routineDayId,
            weekday: shuffled[w],
          });
        }

        // 10 set groups per routine day, 4 sets per group
        for (let sg = 0; sg < 10; sg++) {
          const setGroupId = nanoid();
          await db.insert(schema.workoutSetGroups).values({
            id: setGroupId,
            userId: user.id,
            routineDayId,
            sessionId: null,
            type: "NORMAL",
            order: sg,
          });

          const sets: Array<{ exerciseId: string; order: number }> = [];
          for (let s = 0; s < 4; s++) {
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

      if (r % 10 === 0) {
        console.log(`  Created ${r}/50 routines`);
      }
    }

    // 5. Create 100 workout sessions
    console.log("Creating 100 workout sessions...");
    const now = Date.now();

    for (let n = 1; n <= 100; n++) {
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

      if (n % 20 === 0) {
        console.log(`  Created ${n}/100 sessions`);
      }
    }

    console.log("Mock data seeding complete!");
    console.log(
      "  - 50 routines (2 days each, 10 set groups per day, 4 sets per group)",
    );
    console.log(
      "  - 100 workout sessions (10 set groups each, 4 sets per group)",
    );
  } catch (error) {
    console.error("Error seeding mock data:", error);
    process.exit(1);
  }

  process.exit(0);
}

main();
