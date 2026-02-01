# All-in-One Dockerfile for OpenFit
# Combines nginx, Convex backend, and Next.js in a single container
#
# Multi-stage build:
# - Stage 1 (builder): Build Next.js
# - Stage 2 (convex-source): Extract Convex binaries
# - Stage 3 (runtime): Ubuntu 24.04 with all services

# =============================================================================
# Stage 1: Build Next.js
# =============================================================================
FROM node:22-bookworm-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files first for better caching
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Set placeholder for NEXT_PUBLIC_CONVEX_URL (will be replaced at runtime)
ENV NEXT_PUBLIC_CONVEX_URL=http://PLACEHOLDER_CONVEX_URL/convex

# Build the application
RUN pnpm build

# Copy static assets to standalone output
RUN cp -r public .next/standalone/public && \
    cp -r .next/static .next/standalone/.next/static

# =============================================================================
# Stage 2: Extract Convex binaries
# =============================================================================
FROM ghcr.io/get-convex/convex-backend:latest AS convex-source

# =============================================================================
# Stage 3: Runtime
# =============================================================================
FROM ubuntu:24.04 AS runtime

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    supervisor \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 22
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Create convex user and directories
RUN useradd -r -s /bin/false convex && \
    mkdir -p /convex/data /convex/bin && \
    chown -R convex:convex /convex

# Copy Convex binaries from convex-source
COPY --from=convex-source /convex/convex-local-backend /convex/bin/convex-local-backend
COPY --from=convex-source /convex/generate_admin_key.sh /convex/bin/generate_admin_key.sh
COPY --from=convex-source /convex/generate_key /convex/bin/generate_key
COPY --from=convex-source /convex/read_credentials.sh /convex/bin/read_credentials.sh
RUN chmod +x /convex/bin/convex-local-backend /convex/bin/generate_admin_key.sh /convex/bin/generate_key /convex/bin/read_credentials.sh

# Copy Next.js standalone build
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Convex source files for initialization (deploy/seed)
COPY --from=builder /app/convex ./convex
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Install Convex CLI globally for initialization
RUN npm install -g convex@latest

# Copy node_modules from builder for convex deploy
COPY --from=builder /app/node_modules ./node_modules

# Copy configuration files
COPY docker/all-in-one/nginx.conf /etc/nginx/nginx.conf
COPY docker/all-in-one/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/all-in-one/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Create nginx directories and set permissions
RUN mkdir -p /var/log/nginx /var/lib/nginx /run && \
    chown -R www-data:www-data /var/log/nginx /var/lib/nginx

# Create log directory for supervisor
RUN mkdir -p /var/log/supervisor

# Environment variables with defaults
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3001 \
    INSTANCE_NAME=convex-self-hosted \
    CONVEX_CLOUD_ORIGIN=http://127.0.0.1:3210 \
    CONVEX_SITE_ORIGIN=http://127.0.0.1:3211 \
    CONVEX_SELF_HOSTED_URL=http://127.0.0.1:3210 \
    DOCUMENT_RETENTION_DELAY=172800

# Expose nginx port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -sf http://localhost:3000/ || exit 1

# Data volume for Convex persistence
VOLUME ["/convex/data"]

ENTRYPOINT ["/entrypoint.sh"]
