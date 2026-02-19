#!/bin/sh
# OpenFit Docker Entrypoint
# Handles database initialization and app startup

echo "OpenFit - Starting up..."

# Ensure data directory exists
mkdir -p /app/data/uploads

# Check if database needs initialization
check_needs_init() {
  if [ ! -f "/app/data/openfit.db" ]; then
    return 0 # Needs init
  fi
  return 1 # Database exists
}

# Main initialization logic
run_init() {
  if check_needs_init; then
    echo "First run detected - initializing database..."

    # Run migrations
    echo "Running database migrations..."
    if tsx /app/db/migrate.ts; then
      echo "Migrations complete!"
    else
      echo "Warning: Migrations failed. Continuing anyway..."
    fi

    # Seed database
    echo "Seeding database..."
    if tsx /app/db/seed.ts; then
      echo "Database seeding complete!"
    else
      echo "Warning: Seeding failed. You may need to seed manually."
    fi
  else
    echo "Database already exists, skipping initialization."
    # Still run migrations in case of updates
    echo "Running any pending migrations..."
    tsx /app/db/migrate.ts || true
  fi
}

# Run initialization
run_init

# Start the application
echo "Starting OpenFit..."
exec node dist/server/index.mjs
