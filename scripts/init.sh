#!/bin/bash
set -e

if [ -z "$CONVEX_SELF_HOSTED_URL" ]; then
  echo "Error: CONVEX_SELF_HOSTED_URL environment variable is not set"
  exit 1
fi

if [ -z "$JWT_PRIVATE_KEY" ]; then
  echo "Error: JWT_PRIVATE_KEY environment variable is not set"
  exit 1
fi

if [ -z "$JWKS" ]; then
  echo "Error: JWKS environment variable is not set"
  exit 1
fi

echo "Using Convex URL: $CONVEX_SELF_HOSTED_URL"

# Set SITE_URL to match CONVEX_SITE_ORIGIN on the backend (http://localhost:3211)
# This ensures the token issuer matches what auth.config.ts expects
echo "Running: npx convex env set SITE_URL"
npx convex env set --url "$CONVEX_SELF_HOSTED_URL" SITE_URL "http://localhost:3211"

echo "Running: npx convex env set -- JWT_PRIVATE_KEY"
npx convex env set --url "$CONVEX_SELF_HOSTED_URL" -- JWT_PRIVATE_KEY "$JWT_PRIVATE_KEY"

echo "Running: npx convex env set JWKS"
npx convex env set --url "$CONVEX_SELF_HOSTED_URL" JWKS "$JWKS"

echo "Running: npx convex deploy"
npx convex deploy --url "$CONVEX_SELF_HOSTED_URL"

echo "Running: npx convex run seed:run"
npx convex run --url "$CONVEX_SELF_HOSTED_URL" seed:run

echo "Running: node scripts/seed-images.mjs"
node scripts/seed-images.mjs

echo "Initialization complete!"
