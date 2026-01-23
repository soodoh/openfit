import type { ActionCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

/**
 * Fetch an image from a URL and store it in Convex storage.
 */
export async function fetchAndStoreImage(
  ctx: ActionCtx,
  imageUrl: string,
): Promise<Id<"_storage">> {
  // Fetch the image
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${imageUrl} - ${response.statusText}`);
  }

  const blob = await response.blob();

  // Store in Convex storage
  const storageId = await ctx.storage.store(blob);
  return storageId;
}

/**
 * Fetch multiple images and store them in Convex storage.
 */
export async function fetchAndStoreImages(
  ctx: ActionCtx,
  imageUrls: string[],
): Promise<Id<"_storage">[]> {
  const storageIds: Id<"_storage">[] = [];

  for (const url of imageUrls) {
    try {
      const storageId = await fetchAndStoreImage(ctx, url);
      storageIds.push(storageId);
    } catch (error) {
      console.error(`Failed to store image from ${url}:`, error);
      // Continue with other images
    }
  }

  return storageIds;
}
