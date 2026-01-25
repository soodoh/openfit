#!/bin/bash
set -e

# Use CONVEX_SELF_HOSTED_URL if set (for Docker), otherwise default to localhost
CONVEX_URL="${CONVEX_SELF_HOSTED_URL:-http://localhost:3210}"

if [ -z "$JWT_PRIVATE_KEY" ]; then
  echo "Error: JWT_PRIVATE_KEY environment variable is not set"
  exit 1
fi

if [ -z "$JWKS" ]; then
  echo "Error: JWKS environment variable is not set"
  exit 1
fi

echo "Using Convex URL: $CONVEX_URL"

echo "Running: npx convex deploy"
npx convex deploy --url "$CONVEX_URL"

echo "Running: npx convex env set -- JWT_PRIVATE_KEY"
npx convex env set --url "$CONVEX_URL" -- JWT_PRIVATE_KEY "$JWT_PRIVATE_KEY"

echo "Running: npx convex env set JWKS"
npx convex env set --url "$CONVEX_URL" JWKS "$JWKS"

echo "Running: npx convex run seed:run"
npx convex run --url "$CONVEX_URL" seed:run

echo "Running: node scripts/seed-images.mjs"
CONVEX_URL="$CONVEX_URL" node scripts/seed-images.mjs

echo "Initialization complete!"
