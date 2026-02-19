#!/bin/sh
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "OpenFit Database Initialization"
echo "================================"

# Ensure data directory exists
mkdir -p data/uploads

# Run migrations
echo "Running database migrations..."
node .output/db/migrate.js

# Seed database
echo "Seeding database..."
node .output/db/seed.js

echo ""
echo "Initialization complete!"
