#!/usr/bin/env npx tsx
/**
 * Unified seed script that seeds the database and uploads exercise images.
 *
 * Run with: npx tsx scripts/seed.ts
 *
 * This script will:
 * 1. Seed exercises, equipment, muscle groups, categories, and units
 * 2. Upload exercise images to Convex storage
 */

import { ConvexHttpClient } from "convex/browser";
import { api, internal } from "../convex/_generated/api";
import * as fs from "fs";
import * as path from "path";

const IMAGES_DIR = path.join(__dirname, "../convex/seedData/exerciseImages");
const CONVEX_URL = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error(
    "Error: CONVEX_URL or NEXT_PUBLIC_CONVEX_URL environment variable is required",
  );
  console.log("Make sure you have a .env.local file with NEXT_PUBLIC_CONVEX_URL set.");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

async function uploadImage(imagePath: string): Promise<string> {
  // Get upload URL from Convex (using internal mutation via action)
  const uploadUrl = await client.action(api.seed.getUploadUrl);

  // Read the image file
  const imageBuffer = fs.readFileSync(imagePath);
  const mimeType = imagePath.endsWith(".png") ? "image/png" : "image/jpeg";

  // Upload the image
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Type": mimeType,
    },
    body: imageBuffer,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload image: ${response.statusText}`);
  }

  const { storageId } = await response.json();
  return storageId;
}

// Import the raw exercises to get the name mapping
import { exercises as rawExercises } from "../convex/seedData/exercises";

function getExerciseNameFromId(exerciseId: string): string | undefined {
  const exercise = rawExercises.find((e) => e.id === exerciseId);
  return exercise?.name;
}

async function seedDatabase() {
  console.log("=== Step 1: Seeding database ===\n");

  const result = await client.action(api.seed.run);

  console.log(`\nDatabase seeding complete!`);
  console.log(`- ${result.exercisesSeeded} exercises`);
  console.log(`- ${result.repUnitsSeeded} repetition units`);
  console.log(`- ${result.weightUnitsSeeded} weight units`);

  return result;
}

async function uploadImages() {
  console.log("\n=== Step 2: Uploading exercise images ===\n");
  console.log(`Looking for images in: ${IMAGES_DIR}`);

  if (!fs.existsSync(IMAGES_DIR)) {
    console.log(`\nNo images directory found at: ${IMAGES_DIR}`);
    console.log("Skipping image upload. You can add images later via the admin panel.");
    return { successCount: 0, errorCount: 0 };
  }

  // Get all exercise directories
  const exerciseDirs = fs
    .readdirSync(IMAGES_DIR)
    .filter((name) => {
      const fullPath = path.join(IMAGES_DIR, name);
      return fs.statSync(fullPath).isDirectory();
    });

  console.log(`Found ${exerciseDirs.length} exercise directories`);

  let successCount = 0;
  let errorCount = 0;

  for (const exerciseDir of exerciseDirs) {
    const exercisePath = path.join(IMAGES_DIR, exerciseDir);
    const imageFiles = fs
      .readdirSync(exercisePath)
      .filter((name) => name.endsWith(".jpg") || name.endsWith(".png"))
      .sort(); // Sort to maintain order (0.jpg, 1.jpg, etc.)

    if (imageFiles.length === 0) {
      continue;
    }

    try {
      // Upload all images for this exercise
      const imageIds: string[] = [];
      for (const imageFile of imageFiles) {
        const imagePath = path.join(exercisePath, imageFile);
        const storageId = await uploadImage(imagePath);
        imageIds.push(storageId);
      }

      // Get exercise name from directory name
      const exerciseName = getExerciseNameFromId(exerciseDir);

      if (!exerciseName) {
        errorCount++;
        continue;
      }

      // Update exercise with image IDs
      await client.action(api.seed.updateImages, {
        exerciseName,
        imageIds,
      });

      successCount++;
      if (successCount % 50 === 0) {
        console.log(`Uploaded images for ${successCount} exercises...`);
      }
    } catch (error) {
      console.error(`Error processing ${exerciseDir}:`, error);
      errorCount++;
    }
  }

  console.log(`\nImage upload complete!`);
  console.log(`- Success: ${successCount}`);
  console.log(`- Errors: ${errorCount}`);

  return { successCount, errorCount };
}

async function main() {
  console.log("Starting unified seed process...\n");

  // Step 1: Seed the database
  await seedDatabase();

  // Step 2: Upload images
  await uploadImages();

  console.log("\n=== Seed complete! ===");
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
