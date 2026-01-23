#!/usr/bin/env npx tsx
/**
 * Script to upload exercise images to Convex storage and update exercises.
 *
 * Run with: npx tsx scripts/seed-exercise-images.ts
 *
 * Prerequisites:
 * - Convex dev server running or deployed
 * - Exercises already seeded (run `pnpm convex run seed:run` first)
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
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

async function uploadImage(imagePath: string): Promise<string> {
  // Get upload URL from Convex
  const uploadUrl = await client.mutation(api.mutations.admin.generateUploadUrl);

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

async function main() {
  console.log("Starting exercise image upload...");
  console.log(`Looking for images in: ${IMAGES_DIR}`);

  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`Error: Images directory not found: ${IMAGES_DIR}`);
    console.log("\nPlease move exercise images to convex/seedData/exerciseImages/");
    console.log("Expected structure:");
    console.log("  convex/seedData/exerciseImages/");
    console.log("    3_4_Sit-Up/");
    console.log("      0.jpg");
    console.log("      1.jpg");
    console.log("    90_90_Hamstring/");
    console.log("      0.jpg");
    console.log("      1.jpg");
    process.exit(1);
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
      console.log(`Skipping ${exerciseDir}: no images found`);
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

      // Convert exercise directory name to exercise name
      // e.g., "3_4_Sit-Up" -> need to match with actual exercise name
      // The exercise names in the database might be different, so we'll use
      // the raw exercise data to find the mapping
      const exerciseName = getExerciseNameFromId(exerciseDir);

      if (!exerciseName) {
        console.log(`Warning: Could not find exercise name for: ${exerciseDir}`);
        errorCount++;
        continue;
      }

      // Update exercise with image IDs
      await client.mutation(internal.seed.updateExerciseImages as any, {
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

  console.log("\nUpload complete!");
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
}

// Import the raw exercises to get the name mapping
import { exercises as rawExercises } from "../convex/seedData/exercises";

function getExerciseNameFromId(exerciseId: string): string | undefined {
  const exercise = rawExercises.find((e) => e.id === exerciseId);
  return exercise?.name;
}

main().catch(console.error);
