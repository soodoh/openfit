#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load .env.local file
if [ -f "$PROJECT_ROOT/.env.local" ]; then
  set -a
  source "$PROJECT_ROOT/.env.local"
  set +a
fi

cd "$PROJECT_ROOT"

echo "OpenFit Development Initialization"
echo "===================================="

# Ensure data directory exists
mkdir -p data/uploads

# Run migrations
echo "Running database migrations..."
pnpm db:migrate

# Seed database
echo "Seeding database..."
pnpm db:seed

echo ""
echo "Initialization complete!"
echo "You can now run: pnpm dev"
