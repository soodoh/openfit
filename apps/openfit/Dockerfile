# Stage 1: Build
FROM node:24-alpine AS builder

WORKDIR /repo

# Install build dependencies
RUN apk add --no-cache curl bash python3 make g++

# Install bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

# Install dependencies (cached layer - only re-runs when lockfile changes)
COPY package.json bun.lock turbo.json ./
COPY apps/openfit/package.json ./apps/openfit/package.json
COPY apps/docs/package.json ./apps/docs/package.json
COPY apps/mobile-app/package.json ./apps/mobile-app/package.json
RUN bun install --frozen-lockfile

# Copy source and build the openfit workspace
COPY . .
RUN bun run build:openfit

# Prune to production dependencies after build
RUN bun install --frozen-lockfile --production

# Stage 2: Runtime
FROM node:24-alpine AS runner

WORKDIR /app

# Copy Nitro server output and db artifacts
COPY --from=builder /repo/apps/openfit/.output ./.output

# Copy production node_modules for runtime and db scripts
COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/apps/openfit/package.json ./package.json
COPY --from=builder /repo/apps/openfit/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /repo/apps/openfit/db/schema.ts ./db/schema.ts
COPY --from=builder /repo/apps/openfit/db/schema ./db/schema

# Copy public assets
COPY --from=builder /repo/apps/openfit/public ./public

# Copy entrypoint
COPY --from=builder /repo/apps/openfit/scripts ./scripts
RUN chmod +x ./scripts/docker-entrypoint.sh

# Create data directory for SQLite and uploads
RUN mkdir -p /app/data/uploads

ENV NODE_ENV=production
ENV DATABASE_URL=file:/app/data/openfit.db

EXPOSE 3000

ENTRYPOINT ["/app/scripts/docker-entrypoint.sh"]
