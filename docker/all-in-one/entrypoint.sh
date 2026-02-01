#!/bin/bash
# OpenFit All-in-One Entrypoint
# Handles runtime configuration and initialization

set -e

echo "=========================================="
echo "  OpenFit All-in-One Container"
echo "=========================================="

# =============================================================================
# Runtime URL Injection
# =============================================================================
# Next.js bakes NEXT_PUBLIC_* variables at build time, so we replace the
# placeholder with the actual runtime value

NEXT_PUBLIC_CONVEX_URL="${NEXT_PUBLIC_CONVEX_URL:-http://localhost:3000/convex}"
echo "Setting NEXT_PUBLIC_CONVEX_URL: $NEXT_PUBLIC_CONVEX_URL"

# Replace placeholder in all JS files
find /app/.next -type f -name "*.js" -exec sed -i "s|http://PLACEHOLDER_CONVEX_URL/convex|${NEXT_PUBLIC_CONVEX_URL}|g" {} \; 2>/dev/null || true

# =============================================================================
# Environment Validation
# =============================================================================
validate_env() {
    local missing=""

    if [ -z "$INSTANCE_SECRET" ]; then
        missing="$missing INSTANCE_SECRET"
    fi

    if [ -z "$JWT_PRIVATE_KEY" ]; then
        missing="$missing JWT_PRIVATE_KEY"
    fi

    if [ -z "$JWKS" ]; then
        missing="$missing JWKS"
    fi

    if [ -n "$missing" ]; then
        echo ""
        echo "ERROR: Missing required environment variables:$missing"
        echo ""
        echo "Generate these with: pnpm generate:keys"
        echo "Or see the README for manual key generation."
        echo ""
        exit 1
    fi
}

validate_env

# =============================================================================
# Generate Admin Key (if not provided)
# =============================================================================
if [ -z "$CONVEX_SELF_HOSTED_ADMIN_KEY" ]; then
    echo "Generating admin key from INSTANCE_SECRET..."
    # The generate_admin_key.sh script uses relative paths, so we need to cd to its directory
    export CONVEX_SELF_HOSTED_ADMIN_KEY=$(cd /convex/bin && ./generate_admin_key.sh 2>/dev/null || echo "")

    if [ -z "$CONVEX_SELF_HOSTED_ADMIN_KEY" ]; then
        echo "Warning: Failed to generate admin key. Initialization may fail."
    else
        echo "Admin key generated successfully."
    fi
fi

# =============================================================================
# Set Derived Environment Variables
# =============================================================================
# CONVEX_SITE_URL must match SITE_URL in auth config
export CONVEX_SITE_URL="${CONVEX_SITE_URL:-$NEXT_PUBLIC_CONVEX_URL}"
export CONVEX_AUTH_SITE_URL="${CONVEX_AUTH_SITE_URL:-http://localhost:3000}"

echo "CONVEX_SITE_URL: $CONVEX_SITE_URL"
echo "CONVEX_AUTH_SITE_URL: $CONVEX_AUTH_SITE_URL"

# =============================================================================
# Ensure Data Directory Permissions
# =============================================================================
mkdir -p /convex/data
chown -R convex:convex /convex/data

# =============================================================================
# Initialization (background)
# =============================================================================
# Run initialization in background so container starts immediately
init_in_background() {
    local init_marker="/convex/data/.initialized"

    # Wait for Convex to be ready
    echo "[init] Waiting for Convex backend..."
    local max_attempts=60
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if curl -sf http://127.0.0.1:3210/version > /dev/null 2>&1; then
            echo "[init] Convex backend is ready!"
            break
        fi
        attempt=$((attempt + 1))
        sleep 2
    done

    if [ $attempt -ge $max_attempts ]; then
        echo "[init] Warning: Convex backend did not become ready in time."
        return 1
    fi

    # Check if already initialized
    if [ -f "$init_marker" ]; then
        echo "[init] Database already initialized."
        return 0
    fi

    echo "[init] First run detected. Initializing database..."

    # Set environment variables
    echo "[init] Setting SITE_URL..."
    npx convex env set --url http://127.0.0.1:3210 SITE_URL "$CONVEX_AUTH_SITE_URL" 2>&1 || {
        echo "[init] Warning: Failed to set SITE_URL"
    }

    echo "[init] Setting JWT_PRIVATE_KEY..."
    npx convex env set --url http://127.0.0.1:3210 -- JWT_PRIVATE_KEY "$JWT_PRIVATE_KEY" 2>&1 || {
        echo "[init] Warning: Failed to set JWT_PRIVATE_KEY"
    }

    echo "[init] Setting JWKS..."
    npx convex env set --url http://127.0.0.1:3210 JWKS "$JWKS" 2>&1 || {
        echo "[init] Warning: Failed to set JWKS"
    }

    echo "[init] Deploying Convex functions..."
    if npx convex deploy --url http://127.0.0.1:3210 2>&1; then
        echo "[init] Convex deploy successful!"
    else
        echo "[init] Warning: Convex deploy failed. You may need to run initialization manually."
        return 1
    fi

    echo "[init] Running database seed..."
    if npx convex run --url http://127.0.0.1:3210 seed:run 2>&1; then
        echo "[init] Database seed successful!"
    else
        echo "[init] Warning: Database seed failed."
    fi

    # Mark as initialized
    touch "$init_marker"
    echo "[init] Initialization complete!"
}

# Start initialization in background
(sleep 5 && init_in_background) &

# =============================================================================
# Start Services
# =============================================================================
echo ""
echo "Starting services with supervisord..."
echo "  - Convex backend (port 3210/3211)"
echo "  - Next.js (port 3001)"
echo "  - nginx (port 3000)"
echo ""

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
