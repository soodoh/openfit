import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import fs from "node:fs/promises";
import { nanoid } from "nanoid";
import path from "node:path";
import { db } from "./index";
import { schema } from "./schema";
// Base URL for exercise images from the free-exercise-db repository
const IMAGE_BASE_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";
// Directory to store uploaded images
const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const IMAGE_DOWNLOAD_CONCURRENCY = 50;
const IMAGE_INSERT_CHUNK_SIZE = 150;

async function mapWithConcurrencyLimit<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      if (currentIndex >= items.length) {
        return;
      }

      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}
// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch {
    // Directory already exists
  }
}
// Download an image and save it locally
async function downloadImage(
  imageUrl: string,
  exerciseId: string,
  imageIndex: number,
): Promise<string | undefined> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return undefined;
    }
    const buffer = await response.arrayBuffer();
    const ext = path.extname(imageUrl).slice(1) || "jpg";
    const filename = `${exerciseId}_${imageIndex}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    await fs.writeFile(filepath, Buffer.from(buffer));
    return `/api/uploads/${filename}`;
  } catch {
    return undefined;
  }
}
// Helper function to capitalize each word in a string
function capitalize(str: string): string {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
// Equipment names for seeding
const EQUIPMENT_NAMES = [
  "body only",
  "machine",
  "cable",
  "foam roll",
  "dumbbell",
  "barbell",
  "e-z curl bar",
  "kettlebells",
  "medicine ball",
  "exercise ball",
  "bands",
  "other",
];
// Muscle group names for seeding
const MUSCLE_GROUP_NAMES = [
  "abdominals",
  "chest",
  "quadriceps",
  "hamstrings",
  "glutes",
  "adductors",
  "abductors",
  "calves",
  "forearms",
  "shoulders",
  "biceps",
  "triceps",
  "traps",
  "lats",
  "middle back",
  "lower back",
  "neck",
];
// Category names for seeding
const CATEGORY_NAMES = [
  "strength",
  "cardio",
  "stretching",
  "plyometrics",
  "powerlifting",
  "strongman",
  "olympic weightlifting",
];
// Repetition unit names
const REPETITION_UNITS = [
  "Repetitions",
  "Seconds",
  "Minutes",
  "Miles",
  "Kilometers",
];
// Weight unit names
const WEIGHT_UNITS = ["lb", "kg", "Body Weight"];
// Lookup maps for IDs (populated during seeding)
type LookupMaps = {
  equipment: Map<string, string>;
  muscleGroups: Map<string, string>;
  categories: Map<string, string>;
};

type ExerciseImageInsert = typeof schema.exerciseImages.$inferInsert;
async function seedReferenceData() {
  // oxlint-disable-next-line no-console
  console.log("Seeding reference data...");
  const equipmentNames = EQUIPMENT_NAMES.map(capitalize);
  const muscleGroupNames = MUSCLE_GROUP_NAMES.map(capitalize);
  const categoryNames = CATEGORY_NAMES.map(capitalize);

  await db
    .insert(schema.repetitionUnits)
    .values(REPETITION_UNITS.map((name) => ({ id: nanoid(), name })))
    .onConflictDoNothing({ target: schema.repetitionUnits.name });
  await db
    .insert(schema.weightUnits)
    .values(WEIGHT_UNITS.map((name) => ({ id: nanoid(), name })))
    .onConflictDoNothing({ target: schema.weightUnits.name });
  await db
    .insert(schema.equipment)
    .values(equipmentNames.map((name) => ({ id: nanoid(), name })))
    .onConflictDoNothing({ target: schema.equipment.name });
  await db
    .insert(schema.muscleGroups)
    .values(muscleGroupNames.map((name) => ({ id: nanoid(), name })))
    .onConflictDoNothing({ target: schema.muscleGroups.name });
  await db
    .insert(schema.categories)
    .values(categoryNames.map((name) => ({ id: nanoid(), name })))
    .onConflictDoNothing({ target: schema.categories.name });

  const [equipmentRows, muscleGroupRows, categoryRows] = await Promise.all([
    db.select().from(schema.equipment),
    db.select().from(schema.muscleGroups),
    db.select().from(schema.categories),
  ]);

  const equipmentByName = new Map(
    equipmentRows.map((record) => [record.name, record.id]),
  );
  const muscleGroupByName = new Map(
    muscleGroupRows.map((record) => [record.name, record.id]),
  );
  const categoryByName = new Map(
    categoryRows.map((record) => [record.name, record.id]),
  );

  const equipmentMap = new Map<string, string>();
  for (const name of EQUIPMENT_NAMES) {
    const id = equipmentByName.get(capitalize(name));
    if (id) {
      equipmentMap.set(name, id);
    }
  }

  const muscleGroupMap = new Map<string, string>();
  for (const name of MUSCLE_GROUP_NAMES) {
    const id = muscleGroupByName.get(capitalize(name));
    if (id) {
      muscleGroupMap.set(name, id);
    }
  }

  const categoryMap = new Map<string, string>();
  for (const name of CATEGORY_NAMES) {
    const id = categoryByName.get(capitalize(name));
    if (id) {
      categoryMap.set(name, id);
    }
  }

  return {
    equipment: equipmentMap,
    muscleGroups: muscleGroupMap,
    categories: categoryMap,
  };
}
async function seedExercises(lookups: LookupMaps) {
  // Import exercises data - this is a dynamic import since it's a large file
  const { exercises: rawExercises } = await import("./seedData/exercises");
  const totalImages = rawExercises.reduce(
    (sum, ex) => sum + (ex.images?.length || 0),
    0,
  );
  // oxlint-disable-next-line no-console
  console.log(
    `Seeding ${rawExercises.length} exercises (${totalImages} images)...`,
  );
  await ensureUploadDir();
  let count = 0;
  let skipped = 0;
  const existingExercises = await db.select().from(schema.exercises);
  const existingExerciseNames = new Set(
    existingExercises.map((exercise) => exercise.name),
  );
  const imageJobs: Array<{
    imageUrl: string;
    exerciseId: string;
    order: number;
  }> = [];

  for (const exercise of rawExercises) {
    if (existingExerciseNames.has(exercise.name)) {
      skipped += 1;
      continue;
    }
    const equipmentId = exercise.equipment
      ? lookups.equipment.get(exercise.equipment)
      : null;
    const categoryId = lookups.categories.get(exercise.category);
    if (!categoryId) {
      continue;
    }
    // Create exercise
    const exerciseId = nanoid();
    await db.insert(schema.exercises).values({
      id: exerciseId,
      name: exercise.name,
      equipmentId,
      force: exercise.force || null,
      level: exercise.level,
      mechanic: exercise.mechanic || null,
      categoryId,
    });
    const primaryMuscleRows = exercise.primaryMuscles.flatMap((muscle) => {
      const muscleGroupId = lookups.muscleGroups.get(muscle);
      if (!muscleGroupId) {
        return [];
      }
      return [{ id: nanoid(), exerciseId, muscleGroupId }];
    });
    if (primaryMuscleRows.length > 0) {
      await db.insert(schema.exercisePrimaryMuscles).values(primaryMuscleRows);
    }

    const secondaryMuscleRows = exercise.secondaryMuscles.flatMap((muscle) => {
      const muscleGroupId = lookups.muscleGroups.get(muscle);
      if (!muscleGroupId) {
        return [];
      }
      return [{ id: nanoid(), exerciseId, muscleGroupId }];
    });
    if (secondaryMuscleRows.length > 0) {
      await db
        .insert(schema.exerciseSecondaryMuscles)
        .values(secondaryMuscleRows);
    }

    const instructionRows = exercise.instructions.map((instruction, index) => ({
      id: nanoid(),
      exerciseId,
      order: index,
      instruction,
    }));
    if (instructionRows.length > 0) {
      await db.insert(schema.exerciseInstructions).values(instructionRows);
    }
    // Queue images for bounded parallel download after exercise rows exist.
    if (exercise.images && exercise.images.length > 0) {
      for (let i = 0; i < exercise.images.length; i += 1) {
        const imagePath = exercise.images[i];
        const imageUrl = `${IMAGE_BASE_URL}/${imagePath}`;
        imageJobs.push({ imageUrl, exerciseId, order: i });
      }
    }
    existingExerciseNames.add(exercise.name);
    count += 1;
    if (count % 50 === 0) {
      // oxlint-disable-next-line no-console
      console.log(
        `  Progress: ${count} exercises seeded, ${imageJobs.length} images queued`,
      );
    }
  }

  // oxlint-disable-next-line no-console
  console.log(
    `Downloading ${imageJobs.length} images with concurrency ${IMAGE_DOWNLOAD_CONCURRENCY}...`,
  );
  let completedImageJobs = 0;

  const downloadedImageRows = await mapWithConcurrencyLimit(
    imageJobs,
    IMAGE_DOWNLOAD_CONCURRENCY,
    async (job) => {
      const localPath = await downloadImage(
        job.imageUrl,
        job.exerciseId,
        job.order,
      );
      completedImageJobs += 1;
      if (
        completedImageJobs % 100 === 0 ||
        completedImageJobs === imageJobs.length
      ) {
        // oxlint-disable-next-line no-console
        console.log(
          `  Image progress: ${completedImageJobs}/${imageJobs.length} processed`,
        );
      }

      if (!localPath) {
        return undefined;
      }

      return {
        id: nanoid(),
        exerciseId: job.exerciseId,
        order: job.order,
        path: localPath,
      } satisfies ExerciseImageInsert;
    },
  );

  const imageRows = downloadedImageRows.filter(
    (row): row is ExerciseImageInsert => row !== undefined,
  );

  for (let i = 0; i < imageRows.length; i += IMAGE_INSERT_CHUNK_SIZE) {
    const chunk = imageRows.slice(i, i + IMAGE_INSERT_CHUNK_SIZE);
    await db.insert(schema.exerciseImages).values(chunk);
  }

  const imageCount = imageRows.length;
  if (skipped > 0) {
    // oxlint-disable-next-line no-console
    console.log(`Skipped ${skipped} exercises (already exist).`);
  }
  // oxlint-disable-next-line no-console
  console.log(
    `Seeded ${count} exercises with ${imageCount}/${totalImages} images downloaded.`,
  );
}
async function seedAdminUser() {
  const email = process.env.ADMIN_USER;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    // oxlint-disable-next-line no-console
    console.log(
      "ADMIN_USER and ADMIN_PASSWORD not set, skipping admin user creation.",
    );
    return;
  }
  // Check if admin already exists
  const existing = await db.query.users.findFirst({
    where: eq(schema.users.email, email),
  });
  if (existing) {
    // oxlint-disable-next-line no-console
    console.log(`Admin user ${email} already exists, skipping.`);
    return;
  }
  // oxlint-disable-next-line no-console
  console.log(`Creating admin user: ${email}...`);
  // Use BetterAuth API to create the user (handles password hashing, user + account creation)
  // The databaseHook will create a USER profile automatically
  const result = await auth.api.signUpEmail({
    body: {
      email,
      password,
      name: email.split("@")[0],
    },
  });
  if (!result.user) {
    return;
  }
  // Upgrade the auto-created profile to ADMIN
  await db
    .update(schema.userProfiles)
    .set({ role: "ADMIN" })
    .where(eq(schema.userProfiles.userId, result.user.id));
  // oxlint-disable-next-line no-console
  console.log(`Admin user ${email} created successfully.`);
}
async function main() {
  // oxlint-disable-next-line no-console
  console.log("Starting database seed...");
  // oxlint-disable-next-line no-console
  console.log("Assuming migrations already ran (bun run db:migrate).");
  // oxlint-disable-next-line no-console
  console.log("Downloading exercise images from GitHub...");
  try {
    // Seed reference data
    const lookups = await seedReferenceData();
    // Seed exercises
    await seedExercises(lookups);
    // Seed admin user (after reference data so default units exist for the profile hook)
    await seedAdminUser();
    // oxlint-disable-next-line no-console
    console.log("Database seeding complete!");
  } catch (error) {
    throw new Error("Error seeding database", { cause: error });
  }
}
await main();
