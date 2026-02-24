#!/bin/sh
# OpenFit Docker Entrypoint
# Handles database initialization and app startup

echo "OpenFit - Starting up..."

# Run db initialization
/app/scripts/init.sh

# Start the application
echo "Starting OpenFit..."
exec bun run /app/.output/server/index.mjs
