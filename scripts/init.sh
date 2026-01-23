#!/bin/bash
set -e

if [ -z "$JWT_PRIVATE_KEY" ]; then
  echo "Error: JWT_PRIVATE_KEY environment variable is not set"
  exit 1
fi

if [ -z "$JWKS" ]; then
  echo "Error: JWKS environment variable is not set"
  exit 1
fi

echo "Running: npx convex deploy"
npx convex deploy

echo "Running: npx convex env set -- JWT_PRIVATE_KEY"
npx convex env set -- JWT_PRIVATE_KEY "$JWT_PRIVATE_KEY"

echo "Running: npx convex env set JWKS"
npx convex env set JWKS "$JWKS"

echo "Running: npx convex run seed:run"
npx convex run seed:run

echo "Running: node scripts/seed-images.mjs"
node scripts/seed-images.mjs

echo "Initialization complete!"
