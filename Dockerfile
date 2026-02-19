# Stage 1: Build
FROM node:24-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache curl bash python3 make g++

# Install bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

# Install dependencies (cached layer - only re-runs when lockfile changes)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source and build
COPY . .
RUN bun run build

# Stage 2: Runtime
FROM node:24-alpine AS runner

WORKDIR /app

# Install tsx for running TypeScript db scripts at startup
RUN npm install -g tsx --no-fund --no-audit 2>/dev/null

# Copy TanStack Start build output
COPY --from=builder /app/.output ./.output

# Copy db scripts and files needed for migrations/seeding
COPY --from=builder /app/db ./db
COPY --from=builder /app/src/lib/auth.ts ./src/lib/auth.ts

# Copy node_modules for db scripts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy public assets
COPY --from=builder /app/public ./public

# Copy entrypoint
COPY --from=builder /app/scripts ./scripts
RUN chmod +x ./scripts/docker-entrypoint.sh

# Minimal tsconfig for tsx path alias resolution
RUN echo '{"compilerOptions":{"paths":{"@/db":["./db"],"@/db/*":["./db/*"],"@/*":["./src/*"]},"target":"ES2017","esModuleInterop":true}}' > tsconfig.json

# Create data directory for SQLite and uploads
RUN mkdir -p /app/data/uploads

ENV NODE_ENV=production
ENV DATABASE_URL=file:/app/data/openfit.db

EXPOSE 3000

ENTRYPOINT ["/app/scripts/docker-entrypoint.sh"]
