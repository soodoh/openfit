import { auth } from "@/lib/auth";
import { execSync } from "child_process";
import { eq } from "drizzle-orm";
import fs from "fs/promises";
import { nanoid } from "nanoid";
import path from "path";
import { db } from "./index";
import * as schema from "./schema";

// Push schema to database (creates tables if they don't exist)
function pushSchema() {
  if (process.env.SKIP_SCHEMA_PUSH) {
    console.log("Skipping schema push (migrations handle schema creation).");
    return;
  }
  console.log("Pushing database schema...");
  try {
    execSync("npx drizzle-kit push", {
      stdio: "inherit",
      cwd: process.cwd(),
    });
    console.log("Schema pushed successfully.");
  } catch (error) {
    console.error("Failed to push schema:", error);
    process.exit(1);
  }
}

// Base URL for exercise images from the free-exercise-db repository
const IMAGE_BASE_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

// Directory to store uploaded images
const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

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
): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.warn(`  ⚠ Failed to download: ${imageUrl} (${response.status})`);
      return null;
    }

    const buffer = await response.arrayBuffer();
    const ext = path.extname(imageUrl).slice(1) || "jpg";
    const filename = `${exerciseId}_${imageIndex}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    await fs.writeFile(filepath, Buffer.from(buffer));
    return `/api/uploads/${filename}`;
  } catch (error) {
    console.warn(`  ⚠ Error downloading image ${imageUrl}:`, error);
    return null;
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

async function seedReferenceData() {
  console.log("Seeding reference data...");

  // Seed repetition units
  console.log("Seeding repetition units...");
  for (const name of REPETITION_UNITS) {
    const existing = await db.query.repetitionUnits.findFirst({
      where: eq(schema.repetitionUnits.name, name),
    });
    if (!existing) {
      await db.insert(schema.repetitionUnits).values({
        id: nanoid(),
        name,
      });
      console.log(`Created repetition unit: ${name}`);
    }
  }

  // Seed weight units
  console.log("Seeding weight units...");
  for (const name of WEIGHT_UNITS) {
    const existing = await db.query.weightUnits.findFirst({
      where: eq(schema.weightUnits.name, name),
    });
    if (!existing) {
      await db.insert(schema.weightUnits).values({
        id: nanoid(),
        name,
      });
      console.log(`Created weight unit: ${name}`);
    }
  }

  // Seed equipment
  console.log("Seeding equipment...");
  const equipmentMap = new Map<string, string>();
  for (const name of EQUIPMENT_NAMES) {
    const displayName = capitalize(name);
    const existing = await db.query.equipment.findFirst({
      where: eq(schema.equipment.name, displayName),
    });
    if (!existing) {
      const id = nanoid();
      await db.insert(schema.equipment).values({
        id,
        name: displayName,
      });
      equipmentMap.set(name, id);
      console.log(`Created equipment: ${displayName}`);
    } else {
      equipmentMap.set(name, existing.id);
    }
  }

  // Seed muscle groups
  console.log("Seeding muscle groups...");
  const muscleGroupMap = new Map<string, string>();
  for (const name of MUSCLE_GROUP_NAMES) {
    const displayName = capitalize(name);
    const existing = await db.query.muscleGroups.findFirst({
      where: eq(schema.muscleGroups.name, displayName),
    });
    if (!existing) {
      const id = nanoid();
      await db.insert(schema.muscleGroups).values({
        id,
        name: displayName,
      });
      muscleGroupMap.set(name, id);
      console.log(`Created muscle group: ${displayName}`);
    } else {
      muscleGroupMap.set(name, existing.id);
    }
  }

  // Seed categories
  console.log("Seeding categories...");
  const categoryMap = new Map<string, string>();
  for (const name of CATEGORY_NAMES) {
    const displayName = capitalize(name);
    const existing = await db.query.categories.findFirst({
      where: eq(schema.categories.name, displayName),
    });
    if (!existing) {
      const id = nanoid();
      await db.insert(schema.categories).values({
        id,
        name: displayName,
      });
      categoryMap.set(name, id);
      console.log(`Created category: ${displayName}`);
    } else {
      categoryMap.set(name, existing.id);
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

  // Count total images for progress tracking
  const totalImages = rawExercises.reduce(
    (sum, ex) => sum + (ex.images?.length || 0),
    0,
  );

  console.log(
    `Seeding ${rawExercises.length} exercises (${totalImages} images)...`,
  );
  await ensureUploadDir();

  let count = 0;
  let skipped = 0;
  let imageCount = 0;

  for (const exercise of rawExercises) {
    // Check if exercise already exists
    const existing = await db.query.exercises.findFirst({
      where: eq(schema.exercises.name, exercise.name),
    });

    if (existing) {
      skipped++;
      continue;
    }

    const equipmentId = exercise.equipment
      ? lookups.equipment.get(exercise.equipment)
      : null;

    const categoryId = lookups.categories.get(exercise.category);
    if (!categoryId) {
      console.error(`Category not found: ${exercise.category}`);
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

    // Create primary muscles
    for (const muscle of exercise.primaryMuscles) {
      const muscleGroupId = lookups.muscleGroups.get(muscle);
      if (muscleGroupId) {
        await db.insert(schema.exercisePrimaryMuscles).values({
          id: nanoid(),
          exerciseId,
          muscleGroupId,
        });
      }
    }

    // Create secondary muscles
    for (const muscle of exercise.secondaryMuscles) {
      const muscleGroupId = lookups.muscleGroups.get(muscle);
      if (muscleGroupId) {
        await db.insert(schema.exerciseSecondaryMuscles).values({
          id: nanoid(),
          exerciseId,
          muscleGroupId,
        });
      }
    }

    // Create instructions
    for (let i = 0; i < exercise.instructions.length; i++) {
      await db.insert(schema.exerciseInstructions).values({
        id: nanoid(),
        exerciseId,
        order: i,
        instruction: exercise.instructions[i],
      });
    }

    // Download and create images
    if (exercise.images && exercise.images.length > 0) {
      for (let i = 0; i < exercise.images.length; i++) {
        const imagePath = exercise.images[i];
        const imageUrl = `${IMAGE_BASE_URL}/${imagePath}`;
        const localPath = await downloadImage(imageUrl, exerciseId, i);

        if (localPath) {
          await db.insert(schema.exerciseImages).values({
            id: nanoid(),
            exerciseId,
            order: i,
            path: localPath,
          });
          imageCount++;
        }
      }
    }

    count++;
    if (count % 50 === 0) {
      console.log(
        `  Progress: ${count} exercises seeded, ${imageCount}/${totalImages} images downloaded`,
      );
    }
  }

  if (skipped > 0) {
    console.log(`Skipped ${skipped} exercises (already exist).`);
  }
  console.log(
    `Seeded ${count} exercises with ${imageCount}/${totalImages} images downloaded.`,
  );
}

async function seedAdminUser() {
  const email = process.env.ADMIN_USER;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
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
    console.log(`Admin user ${email} already exists, skipping.`);
    return;
  }

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
    console.error("Failed to create admin user.");
    return;
  }

  // Upgrade the auto-created profile to ADMIN
  await db
    .update(schema.userProfiles)
    .set({ role: "ADMIN" })
    .where(eq(schema.userProfiles.userId, result.user.id));

  console.log(`Admin user ${email} created successfully.`);
}

async function main() {
  console.log("Starting database seed...");

  // Push schema first to ensure tables exist
  pushSchema();

  console.log("Downloading exercise images from GitHub...");

  try {
    // Seed reference data
    const lookups = await seedReferenceData();

    // Seed exercises
    await seedExercises(lookups);

    // Seed admin user (after reference data so default units exist for the profile hook)
    await seedAdminUser();

    console.log("Database seeding complete!");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }

  process.exit(0);
}

main();
