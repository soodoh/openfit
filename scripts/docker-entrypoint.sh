#!/bin/sh
# Open Fit Docker Entrypoint
# Handles runtime config injection and auto-initialization

echo "Open Fit - Starting up..."

# F1: Replace NEXT_PUBLIC_CONVEX_URL placeholder with runtime value
# This is needed because Next.js bakes NEXT_PUBLIC_* vars at build time
if [ -n "$NEXT_PUBLIC_CONVEX_URL" ]; then
    echo "Injecting NEXT_PUBLIC_CONVEX_URL: $NEXT_PUBLIC_CONVEX_URL"
    find /app/.next -type f -name "*.js" -exec sed -i "s|http://PLACEHOLDER_CONVEX_URL:3210|$NEXT_PUBLIC_CONVEX_URL|g" {} \; 2>/dev/null || true
fi

# Replace CONVEX_BACKEND_URL placeholder for Next.js rewrites (server-side proxy)
# Default to internal Docker network URL if not specified
CONVEX_BACKEND_URL="${CONVEX_BACKEND_URL:-http://convex-backend:3210}"
echo "Injecting CONVEX_BACKEND_URL: $CONVEX_BACKEND_URL"
find /app/.next -type f -name "*.js" -exec sed -i "s|http://PLACEHOLDER_CONVEX_BACKEND:3210|$CONVEX_BACKEND_URL|g" {} \; 2>/dev/null || true

# F6: Validate required environment variables
validate_env() {
    local missing=""

    if [ -z "$CONVEX_SELF_HOSTED_URL" ]; then
        missing="$missing CONVEX_SELF_HOSTED_URL"
    fi

    if [ -z "$CONVEX_SELF_HOSTED_ADMIN_KEY" ]; then
        missing="$missing CONVEX_SELF_HOSTED_ADMIN_KEY"
    fi

    if [ -z "$NEXT_PUBLIC_CONVEX_URL" ]; then
        missing="$missing NEXT_PUBLIC_CONVEX_URL"
    fi

    if [ -n "$missing" ]; then
        echo "Error: Missing required environment variables:$missing"
        echo "Please ensure these are set in your .env file or docker-compose environment."
        exit 1
    fi
}

# Function to wait for Convex backend to be ready
wait_for_convex() {
    echo "Waiting for Convex backend to be ready..."
    max_attempts=30
    attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if curl -sf "${CONVEX_SELF_HOSTED_URL}/version" > /dev/null 2>&1; then
            echo "Convex backend is ready!"
            return 0
        fi
        attempt=$((attempt + 1))
        echo "Attempt $attempt/$max_attempts - Convex not ready yet, waiting..."
        sleep 2
    done

    echo "Warning: Convex backend did not become ready in time"
    return 1
}

# Check if database needs initialization by checking if deployment exists
check_needs_init() {
    # Try to get deployment info - if it fails, we likely need to initialize
    # This is a simple heuristic; adjust based on actual Convex behavior
    if curl -sf "${CONVEX_SELF_HOSTED_URL}/api/dashboard" > /dev/null 2>&1; then
        return 1  # Deployment exists, no init needed
    fi
    return 0  # Needs init
}

# Main initialization logic
run_init() {
    validate_env

    if ! wait_for_convex; then
        echo "Skipping auto-init - Convex backend not available."
        echo "You may need to run 'docker exec openfit ./scripts/init.sh' manually when ready."
        return
    fi

    # F3: Check if already initialized by querying Convex
    if check_needs_init; then
        echo "First run detected - initializing database..."

        # F5: Handle init failure gracefully - don't exit, just warn
        if ./scripts/init.sh; then
            echo "Database initialization complete!"
        else
            echo ""
            echo "========================================================"
            echo "  Warning: Database initialization failed."
            echo "  The app will start, but you may need to run:"
            echo "    docker exec openfit ./scripts/init.sh"
            echo "========================================================"
            echo ""
        fi
    else
        echo "Database already initialized, skipping init."
    fi
}

# Run initialization (errors are handled internally, won't stop app startup)
run_init

# Start the application
echo "Starting Open Fit..."
exec node .next/standalone/server.js
