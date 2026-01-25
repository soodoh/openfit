#!/usr/bin/env node
/**
 * Upload exercise images to Convex storage.
 * Run with: node scripts/seed-images.mjs
 *
 * Requires CONVEX_URL environment variable to be set.
 */

import { ConvexHttpClient } from "convex/browser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.join(__dirname, "../convex/seedData/exerciseImages");

const CONVEX_URL = process.env.CONVEX_SELF_HOSTED_URL || process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error(
    "Error: CONVEX_URL or NEXT_PUBLIC_CONVEX_URL environment variable is required",
  );
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

// Transform upload URL to be reachable from Docker container
function transformUploadUrl(uploadUrl) {
  // If we're using an internal Docker URL (CONVEX_SELF_HOSTED_URL), we need to
  // replace loopback addresses with the Docker network hostname
  if (process.env.CONVEX_SELF_HOSTED_URL) {
    const internalUrl = new URL(process.env.CONVEX_SELF_HOSTED_URL);

    // Replace 127.0.0.1 or localhost with the Docker network hostname
    return uploadUrl
      .replace(/http:\/\/127\.0\.0\.1:3210/g, `http://${internalUrl.host}`)
      .replace(/http:\/\/localhost:3210/g, `http://${internalUrl.host}`);
  }
  return uploadUrl;
}

async function uploadImage(imagePath) {
  // Get upload URL from Convex
  let uploadUrl = await client.mutation("seed:generateUploadUrl");

  // Transform URL for Docker environment
  uploadUrl = transformUploadUrl(uploadUrl);

  // Read the image file
  const imageBuffer = fs.readFileSync(imagePath);
  const mimeType = imagePath.endsWith(".png") ? "image/png" : "image/jpeg";

  // Upload the image
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": mimeType },
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
    console.log(`No images directory found at: ${IMAGES_DIR}`);
    console.log("Skipping image upload.");
    return;
  }

  // Get exercises without images
  const exercises = await client.mutation("seed:getExercisesWithoutImages");
  console.log(`Found ${exercises.length} exercises without images`);

  if (exercises.length === 0) {
    console.log("All exercises already have images. Nothing to do.");
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (const exercise of exercises) {
    const exerciseDir = path.join(IMAGES_DIR, exercise.folderId);

    if (!fs.existsSync(exerciseDir)) {
      continue; // No images for this exercise
    }

    const imageFiles = fs
      .readdirSync(exerciseDir)
      .filter((name) => name.endsWith(".jpg") || name.endsWith(".png"))
      .sort();

    if (imageFiles.length === 0) {
      continue;
    }

    try {
      const imageIds = [];

      for (const imageFile of imageFiles) {
        const imagePath = path.join(exerciseDir, imageFile);
        const storageId = await uploadImage(imagePath);
        imageIds.push(storageId);
      }

      // Update exercise with image IDs
      await client.mutation("seed:updateExerciseImages", {
        exerciseName: exercise.name,
        imageIds,
      });

      successCount++;
      if (successCount % 50 === 0) {
        console.log(`Uploaded images for ${successCount} exercises...`);
      }
    } catch (error) {
      console.error(`Error processing ${exercise.name}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\nImage upload complete!`);
  console.log(`- Success: ${successCount}`);
  console.log(`- Errors: ${errorCount}`);
}

main().catch((error) => {
  console.error("Image upload failed:", error);
  process.exit(1);
});
